import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Gift, Trophy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const banners = [
  {
    id: 1,
    title: "COMPLETE SUAS MISSÕES",
    subtitle: "GANHE DINHEIRO EXTRA",
    description: "AUMENTE SEU NÍVEL VIP!",
    cta: "RESGATAR",
    icon: Trophy,
    gradient: "from-primary via-casino-cyan to-accent",
  },
  {
    id: 2,
    title: "BEM-VINDO AO",
    subtitle: "NASCI15KBET",
    description: "BÔNUS DE 100% NO PRIMEIRO DEPÓSITO",
    cta: "DEPOSITAR",
    icon: Gift,
    gradient: "from-casino-gold via-casino-orange to-casino-pink",
  },
  {
    id: 3,
    title: "GIROS GRÁTIS",
    subtitle: "TODOS OS DIAS",
    description: "PARTICIPE E GANHE PRÊMIOS",
    cta: "PARTICIPAR",
    icon: Sparkles,
    gradient: "from-casino-purple via-casino-pink to-destructive",
  },
];

export const HeroBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % banners.length);

  const banner = banners[currentSlide];
  const Icon = banner.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-secondary to-card border border-border">
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r opacity-20 transition-all duration-500",
        banner.gradient
      )} />
      
      <div className="relative flex items-center justify-between p-8 min-h-[280px]">
        {/* Navigation arrows */}
        <button 
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        
        <button 
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Content */}
        <div className="flex-1 space-y-4 animate-fade-in" key={banner.id}>
          <div className="space-y-2">
            <h2 className={cn(
              "text-3xl md:text-4xl font-black bg-gradient-to-r bg-clip-text text-transparent",
              banner.gradient
            )}>
              {banner.title}
            </h2>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground">
              {banner.subtitle}
            </h3>
            <p className="text-lg text-muted-foreground">
              {banner.description}
            </p>
          </div>
          
          <Button variant="accent" size="lg" className="rounded-full font-black">
            {banner.cta}
          </Button>
        </div>

        {/* Icon decoration */}
        <div className="hidden md:flex items-center justify-center">
          <div className={cn(
            "p-8 rounded-full bg-gradient-to-r animate-float",
            banner.gradient,
            "opacity-80"
          )}>
            <Icon className="h-20 w-20 text-background" />
          </div>
        </div>

        {/* VIP Club card */}
        <div className="hidden lg:block absolute right-24 top-1/2 -translate-y-1/2">
          <div className="bg-card/80 backdrop-blur border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-casino-gold" />
              <span className="font-bold text-sm">CLUBE DE VANTAGENS</span>
            </div>
            <div className="flex gap-2">
              {["ITEM", "CATEGORIA", "VALOR"].map((tab) => (
                <span key={tab} className="px-3 py-1 text-xs bg-secondary rounded-md">
                  {tab}
                </span>
              ))}
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">DEPOSITAR R$ 350</span>
                <span>DEPÓSITO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">APOSTAR R$ 250</span>
                <span>FORTUNE TIGER</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SACAR R$ 200</span>
                <span>SAQUE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === currentSlide ? "bg-primary w-6" : "bg-muted-foreground/50"
            )}
          />
        ))}
      </div>
    </div>
  );
};
