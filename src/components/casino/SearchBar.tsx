import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Pesquise um jogo de cassino..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 bg-secondary border-border focus:border-primary"
        />
      </div>
      <Button variant="secondary" size="icon">
        <SlidersHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
};
