import { cn } from "@/lib/utils";
import { 
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
  Rocket
} from "lucide-react";

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

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

export const CategoryFilter = ({ activeCategory, onCategoryChange }: CategoryFilterProps) => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
      {categories.map((category) => {
        const Icon = categoryIcons[category.slug] || Gamepad2;
        const isActive = activeCategory === category.slug;
        
        return (
          <button
            key={category.slug}
            onClick={() => onCategoryChange(category.slug)}
            className={cn(
              "category-button min-w-[90px] flex-shrink-0",
              isActive && "active"
            )}
          >
            <div className={cn(
              "p-3 rounded-xl transition-colors",
              isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            )}>
              <Icon className="h-6 w-6" />
            </div>
            <span className={cn(
              "text-xs font-medium whitespace-nowrap",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}>
              {category.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};
