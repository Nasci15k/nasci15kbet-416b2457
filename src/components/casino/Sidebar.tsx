import { cn } from "@/lib/utils";
import { 
  Crown, 
  Trophy, 
  Gift, 
  Sparkles, 
  Pickaxe,
  Gamepad2,
  Radio,
  Plane,
  Zap,
  Star,
  Cat,
  Bomb,
  Building2,
  CircleDot,
  Cherry,
  Rocket,
  ChevronDown
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const promoItems = [
  { label: "Participe das", title: "Missões Clube Vip", icon: Crown, color: "from-casino-gold to-casino-orange" },
  { label: "Acompanhe Seu", title: "Nível No Clube Vip", icon: Trophy, color: "from-casino-purple to-casino-pink" },
  { label: "Aproveite Nossas", title: "Promoções exclusivas", icon: Gift, color: "from-destructive to-casino-orange" },
  { label: "Aproveite Agora", title: "Raspadinha Exclusiva", icon: Sparkles, color: "from-accent to-casino-cyan" },
  { label: "Jogue Agora", title: "Mines exclusivo", icon: Pickaxe, color: "from-muted-foreground to-foreground" },
];

const categoryIcons: Record<string, any> = {
  "all": Gamepad2,
  "live": Radio,
  "aviator": Plane,
  "crash": Zap,
  "favorites": Star,
  "fortune-tiger": Cat,
  "mines": Bomb,
  "providers": Building2,
  "roulette": CircleDot,
  "slots": Cherry,
  "spaceman": Rocket,
};

const categories = [
  { slug: "all", name: "All games" },
  { slug: "live", name: "Ao vivo" },
  { slug: "aviator", name: "Aviator" },
  { slug: "crash", name: "Crash" },
  { slug: "favorites", name: "Favoritos" },
  { slug: "fortune-tiger", name: "Fortune Tiger" },
  { slug: "mines", name: "Mines" },
  { slug: "providers", name: "Provedores" },
  { slug: "roulette", name: "Roleta Ao vivo" },
  { slug: "slots", name: "Slots" },
  { slug: "spaceman", name: "Spaceman" },
];

export const Sidebar = ({ isOpen, activeCategory, onCategoryChange }: SidebarProps) => {
  const [isCasinoOpen, setIsCasinoOpen] = useState(true);

  return (
    <aside 
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-sidebar border-r border-sidebar-border z-40 transition-all duration-300 overflow-y-auto",
        isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0"
      )}
    >
      <div className="p-4 space-y-3">
        {/* Promo badges */}
        {promoItems.map((item, index) => (
          <div 
            key={index}
            className={cn(
              "promo-badge w-full bg-gradient-to-r",
              item.color,
              "hover:scale-[1.02] hover:shadow-lg"
            )}
          >
            <div className="flex-1">
              <p className="text-[10px] font-medium opacity-90">{item.label}</p>
              <p className="text-sm font-bold">{item.title}</p>
            </div>
            <item.icon className="h-6 w-6" />
          </div>
        ))}
      </div>

      {/* Casino categories */}
      <div className="px-4 pb-4">
        <button 
          onClick={() => setIsCasinoOpen(!isCasinoOpen)}
          className="flex items-center justify-between w-full py-3 text-sm font-semibold text-foreground"
        >
          <span>CASSINO</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isCasinoOpen && "rotate-180")} />
        </button>

        {isCasinoOpen && (
          <nav className="space-y-1">
            {categories.map((category) => {
              const Icon = categoryIcons[category.slug] || Gamepad2;
              return (
                <button
                  key={category.slug}
                  onClick={() => onCategoryChange(category.slug)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                    activeCategory === category.slug 
                      ? "bg-primary/10 text-primary border-l-2 border-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </aside>
  );
};
