import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Game } from "@/types/casino";
import { X, Maximize, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
  gameUrl: string | null;
}

export const GameModal = ({ isOpen, onClose, game, gameUrl }: GameModalProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    const iframe = document.getElementById("game-iframe");
    if (iframe) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        iframe.requestFullscreen();
        setIsFullscreen(true);
      }
    }
  };

  if (!game) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 bg-background border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{game.name}</h3>
              <p className="text-xs text-muted-foreground">{game.provider}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleFullscreen}>
              <Maximize className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Game iframe */}
        <div className="flex-1 bg-background">
          {gameUrl ? (
            <iframe
              id="game-iframe"
              src={gameUrl}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen"
              title={game.name}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden">
                  <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-semibold">{game.name}</h3>
                <p className="text-muted-foreground">Conecte o backend para jogar</p>
                <Button variant="accent">
                  Conectar Lovable Cloud
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
