CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);


--
-- Name: transaction_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transaction_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'cancelled'
);


--
-- Name: transaction_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transaction_type AS ENUM (
    'deposit',
    'withdrawal',
    'bet',
    'win',
    'bonus',
    'refund',
    'adjustment'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    UPPER(LEFT(MD5(NEW.id::text), 8))
  );
  
  -- Atribuir role de user por padrão
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    entity_type text,
    entity_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: affiliate_commissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affiliate_commissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    affiliate_id uuid NOT NULL,
    referred_user_id uuid,
    amount numeric(15,2) NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'pending'::text,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: affiliate_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affiliate_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    commission_type text DEFAULT 'revenue_share'::text,
    commission_percent numeric(5,2) DEFAULT 30,
    min_payout numeric(15,2) DEFAULT 100,
    cookie_days integer DEFAULT 30,
    is_active boolean DEFAULT true,
    terms text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: affiliates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affiliates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    code text NOT NULL,
    total_clicks integer DEFAULT 0,
    total_signups integer DEFAULT 0,
    total_deposits numeric(15,2) DEFAULT 0,
    total_commission numeric(15,2) DEFAULT 0,
    pending_commission numeric(15,2) DEFAULT 0,
    is_approved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: api_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider text NOT NULL,
    agent_token text,
    secret_key text,
    webhook_url text,
    is_active boolean DEFAULT true,
    rtp_default integer DEFAULT 97,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: appearance_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appearance_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_name text DEFAULT 'Nasci15kBet'::text,
    site_logo text,
    site_favicon text,
    primary_color text DEFAULT '#F59E0B'::text,
    secondary_color text DEFAULT '#10B981'::text,
    accent_color text DEFAULT '#8B5CF6'::text,
    background_color text DEFAULT '#0A0E1A'::text,
    header_color text DEFAULT '#0F1629'::text,
    sidebar_color text DEFAULT '#0F1629'::text,
    font_family text DEFAULT 'Outfit'::text,
    hero_banners jsonb DEFAULT '[]'::jsonb,
    footer_text text,
    social_links jsonb DEFAULT '{}'::jsonb,
    custom_css text,
    custom_js text,
    maintenance_mode boolean DEFAULT false,
    maintenance_message text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: bonuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bonuses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    value numeric(15,2) NOT NULL,
    value_type text DEFAULT 'percent'::text,
    min_deposit numeric(15,2),
    max_bonus numeric(15,2),
    wagering_requirement numeric(5,2) DEFAULT 35,
    valid_days integer DEFAULT 7,
    is_active boolean DEFAULT true,
    code text,
    max_uses integer,
    current_uses integer DEFAULT 0,
    target_users text DEFAULT 'all'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: custom_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    content text,
    meta_title text,
    meta_description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: deposits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deposits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    payment_method_id uuid,
    amount numeric(15,2) NOT NULL,
    fee numeric(15,2) DEFAULT 0,
    status public.transaction_status DEFAULT 'pending'::public.transaction_status,
    external_id text,
    pix_code text,
    qr_code text,
    expires_at timestamp with time zone,
    confirmed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: game_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    icon text,
    is_active boolean DEFAULT true,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: game_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    external_id integer,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    is_active boolean DEFAULT true,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: game_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    game_id uuid NOT NULL,
    start_balance numeric(15,2),
    end_balance numeric(15,2),
    total_bet numeric(15,2) DEFAULT 0,
    total_win numeric(15,2) DEFAULT 0,
    rounds_played integer DEFAULT 0,
    started_at timestamp with time zone DEFAULT now(),
    ended_at timestamp with time zone
);


--
-- Name: games; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.games (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    external_code text NOT NULL,
    name text NOT NULL,
    provider_id uuid,
    category_id uuid,
    image text,
    is_original boolean DEFAULT false,
    is_live boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    is_new boolean DEFAULT false,
    is_active boolean DEFAULT true,
    rtp numeric(5,2),
    min_bet numeric(15,2) DEFAULT 0.10,
    max_bet numeric(15,2) DEFAULT 1000.00,
    order_index integer DEFAULT 0,
    play_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text,
    is_read boolean DEFAULT false,
    action_url text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    icon text,
    min_deposit numeric(15,2) DEFAULT 10.00,
    max_deposit numeric(15,2) DEFAULT 50000.00,
    min_withdrawal numeric(15,2) DEFAULT 20.00,
    max_withdrawal numeric(15,2) DEFAULT 10000.00,
    deposit_fee_percent numeric(5,2) DEFAULT 0,
    withdrawal_fee_percent numeric(5,2) DEFAULT 0,
    processing_time text DEFAULT 'Instantâneo'::text,
    is_active boolean DEFAULT true,
    config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: popups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.popups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text,
    image text,
    button_text text,
    button_url text,
    trigger_type text DEFAULT 'on_load'::text,
    delay_seconds integer DEFAULT 0,
    show_once boolean DEFAULT true,
    is_active boolean DEFAULT true,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text NOT NULL,
    name text,
    phone text,
    cpf text,
    avatar_url text,
    balance numeric(15,2) DEFAULT 0.00,
    bonus_balance numeric(15,2) DEFAULT 0.00,
    total_deposited numeric(15,2) DEFAULT 0.00,
    total_withdrawn numeric(15,2) DEFAULT 0.00,
    total_wagered numeric(15,2) DEFAULT 0.00,
    total_won numeric(15,2) DEFAULT 0.00,
    vip_level integer DEFAULT 0,
    vip_points integer DEFAULT 0,
    is_blocked boolean DEFAULT false,
    blocked_reason text,
    referral_code text,
    referred_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: promotions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promotions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    image text,
    type text DEFAULT 'general'::text,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    terms text,
    is_active boolean DEFAULT true,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: support_replies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_replies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    user_id uuid,
    message text NOT NULL,
    is_staff boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'open'::text,
    priority text DEFAULT 'normal'::text,
    assigned_to uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value jsonb DEFAULT '{}'::jsonb NOT NULL,
    description text,
    category text DEFAULT 'general'::text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type public.transaction_type NOT NULL,
    amount numeric(15,2) NOT NULL,
    balance_before numeric(15,2),
    balance_after numeric(15,2),
    status public.transaction_status DEFAULT 'pending'::public.transaction_status,
    reference_id text,
    game_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_bonuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_bonuses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    bonus_id uuid NOT NULL,
    amount numeric(15,2) NOT NULL,
    wagered numeric(15,2) DEFAULT 0,
    required_wagering numeric(15,2) NOT NULL,
    status text DEFAULT 'active'::text,
    expires_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: vip_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vip_levels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    level integer NOT NULL,
    name text NOT NULL,
    min_points integer NOT NULL,
    cashback_percent numeric(5,2) DEFAULT 0,
    withdrawal_priority boolean DEFAULT false,
    dedicated_support boolean DEFAULT false,
    special_bonuses boolean DEFAULT false,
    benefits jsonb DEFAULT '[]'::jsonb,
    icon text,
    color text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: withdrawals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.withdrawals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    payment_method_id uuid,
    amount numeric(15,2) NOT NULL,
    fee numeric(15,2) DEFAULT 0,
    status public.transaction_status DEFAULT 'pending'::public.transaction_status,
    pix_key text,
    pix_key_type text,
    bank_info jsonb DEFAULT '{}'::jsonb,
    approved_by uuid,
    approved_at timestamp with time zone,
    rejected_reason text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: affiliate_commissions affiliate_commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_commissions
    ADD CONSTRAINT affiliate_commissions_pkey PRIMARY KEY (id);


--
-- Name: affiliate_settings affiliate_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_settings
    ADD CONSTRAINT affiliate_settings_pkey PRIMARY KEY (id);


--
-- Name: affiliates affiliates_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_code_key UNIQUE (code);


--
-- Name: affiliates affiliates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_pkey PRIMARY KEY (id);


--
-- Name: affiliates affiliates_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_user_id_key UNIQUE (user_id);


--
-- Name: api_settings api_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_settings
    ADD CONSTRAINT api_settings_pkey PRIMARY KEY (id);


--
-- Name: appearance_settings appearance_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appearance_settings
    ADD CONSTRAINT appearance_settings_pkey PRIMARY KEY (id);


--
-- Name: bonuses bonuses_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bonuses
    ADD CONSTRAINT bonuses_code_key UNIQUE (code);


--
-- Name: bonuses bonuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bonuses
    ADD CONSTRAINT bonuses_pkey PRIMARY KEY (id);


--
-- Name: custom_pages custom_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_pages
    ADD CONSTRAINT custom_pages_pkey PRIMARY KEY (id);


--
-- Name: custom_pages custom_pages_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_pages
    ADD CONSTRAINT custom_pages_slug_key UNIQUE (slug);


--
-- Name: deposits deposits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_pkey PRIMARY KEY (id);


--
-- Name: game_categories game_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_categories
    ADD CONSTRAINT game_categories_pkey PRIMARY KEY (id);


--
-- Name: game_categories game_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_categories
    ADD CONSTRAINT game_categories_slug_key UNIQUE (slug);


--
-- Name: game_providers game_providers_external_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_providers
    ADD CONSTRAINT game_providers_external_id_key UNIQUE (external_id);


--
-- Name: game_providers game_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_providers
    ADD CONSTRAINT game_providers_pkey PRIMARY KEY (id);


--
-- Name: game_providers game_providers_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_providers
    ADD CONSTRAINT game_providers_slug_key UNIQUE (slug);


--
-- Name: game_sessions game_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_sessions
    ADD CONSTRAINT game_sessions_pkey PRIMARY KEY (id);


--
-- Name: games games_external_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_external_code_key UNIQUE (external_code);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: popups popups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.popups
    ADD CONSTRAINT popups_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_referral_code_key UNIQUE (referral_code);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (id);


--
-- Name: support_replies support_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_replies
    ADD CONSTRAINT support_replies_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_key_key UNIQUE (key);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: user_bonuses user_bonuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bonuses
    ADD CONSTRAINT user_bonuses_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: vip_levels vip_levels_level_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vip_levels
    ADD CONSTRAINT vip_levels_level_key UNIQUE (level);


--
-- Name: vip_levels vip_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vip_levels
    ADD CONSTRAINT vip_levels_pkey PRIMARY KEY (id);


--
-- Name: withdrawals withdrawals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_pkey PRIMARY KEY (id);


--
-- Name: appearance_settings update_appearance_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_appearance_updated_at BEFORE UPDATE ON public.appearance_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: transactions update_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: affiliate_commissions affiliate_commissions_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_commissions
    ADD CONSTRAINT affiliate_commissions_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id);


--
-- Name: affiliate_commissions affiliate_commissions_referred_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_commissions
    ADD CONSTRAINT affiliate_commissions_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES auth.users(id);


--
-- Name: affiliates affiliates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: deposits deposits_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id);


--
-- Name: deposits deposits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: game_sessions game_sessions_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_sessions
    ADD CONSTRAINT game_sessions_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id);


--
-- Name: game_sessions game_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_sessions
    ADD CONSTRAINT game_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: games games_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.game_categories(id);


--
-- Name: games games_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.game_providers(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_referred_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.profiles(id);


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: support_replies support_replies_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_replies
    ADD CONSTRAINT support_replies_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;


--
-- Name: support_replies support_replies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_replies
    ADD CONSTRAINT support_replies_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: support_tickets support_tickets_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id);


--
-- Name: support_tickets support_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: system_settings system_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: transactions transactions_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id);


--
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_bonuses user_bonuses_bonus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bonuses
    ADD CONSTRAINT user_bonuses_bonus_id_fkey FOREIGN KEY (bonus_id) REFERENCES public.bonuses(id);


--
-- Name: user_bonuses user_bonuses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bonuses
    ADD CONSTRAINT user_bonuses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: withdrawals withdrawals_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: withdrawals withdrawals_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id);


--
-- Name: withdrawals withdrawals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles Admins can insert profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK ((public.is_admin() OR (auth.uid() = user_id)));


--
-- Name: affiliate_settings Admins can manage affiliate settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage affiliate settings" ON public.affiliate_settings USING (public.is_admin());


--
-- Name: affiliates Admins can manage affiliates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage affiliates" ON public.affiliates USING (public.is_admin());


--
-- Name: api_settings Admins can manage api settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage api settings" ON public.api_settings USING (public.is_admin());


--
-- Name: appearance_settings Admins can manage appearance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage appearance" ON public.appearance_settings USING (public.is_admin());


--
-- Name: bonuses Admins can manage bonuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage bonuses" ON public.bonuses USING (public.is_admin());


--
-- Name: game_categories Admins can manage categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage categories" ON public.game_categories USING (public.is_admin());


--
-- Name: affiliate_commissions Admins can manage commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage commissions" ON public.affiliate_commissions USING (public.is_admin());


--
-- Name: deposits Admins can manage deposits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage deposits" ON public.deposits USING (public.is_admin());


--
-- Name: games Admins can manage games; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage games" ON public.games USING (public.is_admin());


--
-- Name: notifications Admins can manage notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage notifications" ON public.notifications USING (public.is_admin());


--
-- Name: custom_pages Admins can manage pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage pages" ON public.custom_pages USING (public.is_admin());


--
-- Name: payment_methods Admins can manage payment methods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage payment methods" ON public.payment_methods USING (public.is_admin());


--
-- Name: popups Admins can manage popups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage popups" ON public.popups USING (public.is_admin());


--
-- Name: promotions Admins can manage promotions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage promotions" ON public.promotions USING (public.is_admin());


--
-- Name: game_providers Admins can manage providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage providers" ON public.game_providers USING (public.is_admin());


--
-- Name: support_replies Admins can manage replies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage replies" ON public.support_replies USING (public.is_admin());


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles USING (public.is_admin());


--
-- Name: system_settings Admins can manage system settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage system settings" ON public.system_settings USING (public.is_admin());


--
-- Name: support_tickets Admins can manage tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage tickets" ON public.support_tickets USING (public.is_admin());


--
-- Name: user_bonuses Admins can manage user_bonuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage user_bonuses" ON public.user_bonuses USING (public.is_admin());


--
-- Name: vip_levels Admins can manage vip levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage vip levels" ON public.vip_levels USING (public.is_admin());


--
-- Name: withdrawals Admins can manage withdrawals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage withdrawals" ON public.withdrawals USING (public.is_admin());


--
-- Name: profiles Admins can update all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin());


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());


--
-- Name: game_sessions Admins can view all sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all sessions" ON public.game_sessions USING (public.is_admin());


--
-- Name: transactions Admins can view all transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT USING (public.is_admin());


--
-- Name: activity_logs Admins can view logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view logs" ON public.activity_logs FOR SELECT USING (public.is_admin());


--
-- Name: bonuses Anyone can view active bonuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active bonuses" ON public.bonuses FOR SELECT USING ((is_active = true));


--
-- Name: game_categories Anyone can view active categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active categories" ON public.game_categories FOR SELECT USING ((is_active = true));


--
-- Name: games Anyone can view active games; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active games" ON public.games FOR SELECT USING ((is_active = true));


--
-- Name: custom_pages Anyone can view active pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active pages" ON public.custom_pages FOR SELECT USING ((is_active = true));


--
-- Name: payment_methods Anyone can view active payment methods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active payment methods" ON public.payment_methods FOR SELECT USING ((is_active = true));


--
-- Name: popups Anyone can view active popups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active popups" ON public.popups FOR SELECT USING ((is_active = true));


--
-- Name: promotions Anyone can view active promotions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active promotions" ON public.promotions FOR SELECT USING ((is_active = true));


--
-- Name: game_providers Anyone can view active providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active providers" ON public.game_providers FOR SELECT USING ((is_active = true));


--
-- Name: affiliate_settings Anyone can view affiliate settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view affiliate settings" ON public.affiliate_settings FOR SELECT USING (true);


--
-- Name: appearance_settings Anyone can view appearance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view appearance" ON public.appearance_settings FOR SELECT USING (true);


--
-- Name: vip_levels Anyone can view vip levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view vip levels" ON public.vip_levels FOR SELECT USING (true);


--
-- Name: activity_logs System can insert logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert logs" ON public.activity_logs FOR INSERT WITH CHECK (true);


--
-- Name: transactions System can insert transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert transactions" ON public.transactions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: deposits Users can create deposits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create deposits" ON public.deposits FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: affiliates Users can create own affiliate; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own affiliate" ON public.affiliates FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: support_replies Users can create replies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create replies" ON public.support_replies FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.support_tickets
  WHERE ((support_tickets.id = support_replies.ticket_id) AND (support_tickets.user_id = auth.uid())))));


--
-- Name: support_tickets Users can create tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: withdrawals Users can create withdrawals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create withdrawals" ON public.withdrawals FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: game_sessions Users can insert own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own sessions" ON public.game_sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: notifications Users can update own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: game_sessions Users can update own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own sessions" ON public.game_sessions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: affiliates Users can view own affiliate; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own affiliate" ON public.affiliates FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: affiliate_commissions Users can view own commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own commissions" ON public.affiliate_commissions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.affiliates
  WHERE ((affiliates.id = affiliate_commissions.affiliate_id) AND (affiliates.user_id = auth.uid())))));


--
-- Name: deposits Users can view own deposits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own deposits" ON public.deposits FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notifications Users can view own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: game_sessions Users can view own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own sessions" ON public.game_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: support_tickets Users can view own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: transactions Users can view own transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_bonuses Users can view own user_bonuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own user_bonuses" ON public.user_bonuses FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: withdrawals Users can view own withdrawals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: support_replies Users can view ticket replies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view ticket replies" ON public.support_replies FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.support_tickets
  WHERE ((support_tickets.id = support_replies.ticket_id) AND (support_tickets.user_id = auth.uid())))));


--
-- Name: activity_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: affiliate_commissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

--
-- Name: affiliate_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: affiliates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

--
-- Name: api_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: appearance_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.appearance_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: bonuses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bonuses ENABLE ROW LEVEL SECURITY;

--
-- Name: custom_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: deposits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

--
-- Name: game_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.game_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: game_providers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.game_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: game_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: games; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_methods; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

--
-- Name: popups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: promotions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

--
-- Name: support_replies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_replies ENABLE ROW LEVEL SECURITY;

--
-- Name: support_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: system_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_bonuses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_bonuses ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: vip_levels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vip_levels ENABLE ROW LEVEL SECURITY;

--
-- Name: withdrawals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


