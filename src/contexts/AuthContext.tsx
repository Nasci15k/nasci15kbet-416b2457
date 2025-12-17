import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  phone: string | null;
  cpf: string | null;
  avatar_url: string | null;
  balance: number;
  bonus_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  total_wagered: number;
  total_won: number;
  vip_level: number;
  vip_points: number;
  is_blocked: boolean;
  referral_code: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return (data as Profile) ?? null;
  };

  const ensureProfile = async (userObj: User) => {
    const existing = await fetchProfile(userObj.id);
    if (existing) return existing;

    const { error: insertError } = await supabase.from("profiles").insert({
      user_id: userObj.id,
      email: userObj.email ?? "",
      name: (userObj.user_metadata as any)?.name ?? null,
    });

    if (insertError) {
      console.error("Error creating profile:", insertError);
      return null;
    }

    return await fetchProfile(userObj.id);
  };

  const checkIsAdmin = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (error) return false;
    return !!data;
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      if (profileData) {
        setProfile(profileData);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const [profileData, adminStatus] = await Promise.all([
            ensureProfile(session.user),
            checkIsAdmin(session.user.id),
          ]);
          if (mounted) {
            setProfile(profileData);
            setIsAdmin(adminStatus);
          }
        }
      } catch (e) {
        console.error("Auth init error:", e);
        if (mounted) {
          setProfile(null);
          setIsAdmin(false);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setIsLoading(true);

      try {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const [profileData, adminStatus] = await Promise.all([
            ensureProfile(session.user),
            checkIsAdmin(session.user.id),
          ]);
          if (mounted) {
            setProfile(profileData);
            setIsAdmin(adminStatus);
          }
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
      } catch (e) {
        console.error("Auth state change error:", e);
        if (mounted) {
          setProfile(null);
          setIsAdmin(false);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    toast.success("Login realizado com sucesso!");
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      throw error;
    }

    toast.success("Conta criada com sucesso!");
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    toast.success("Você saiu da sua conta");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
