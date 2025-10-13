import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, TrendingUp } from "lucide-react";

interface SponsorPlaceholderCardProps {
  position: number;
}

function SponsorPlaceholderCardComponent({ position }: SponsorPlaceholderCardProps) {
  const handleContactClick = () => {
    window.location.href = 'mailto:hello@gamehublauncher.com?subject=Sponsored Server Inquiry';
  };

  return (
    <div 
      className="
        group relative overflow-hidden rounded-xl border-2 border-dashed
        border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/10
        backdrop-blur-md transition-all duration-300 
        hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/20
      "
      data-testid={`sponsor-placeholder-card-${position}`}
    >
      {/* Spotlight Badge */}
      <div className="absolute top-2 right-2 z-10">
        <Badge 
          className="bg-gradient-to-r from-primary/80 to-secondary/80 text-white font-bold text-xs px-2 py-0.5"
          data-testid={`badge-spotlight-${position}`}
        >
          <Sparkles className="w-3 h-3 mr-0.5" />
          AVAILABLE
        </Badge>
      </div>

      <div className="p-2.5 pt-9 flex flex-col items-center justify-center text-center">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-2 border border-primary/30">
          <TrendingUp className="w-5 h-5 text-primary-glow" />
        </div>

        {/* Heading */}
        <h3 className="text-sm font-bold mb-1.5 text-white" data-testid={`text-heading-${position}`}>
          Feature Your Server
        </h3>

        {/* Description */}
        <p className="text-white/70 mb-2 text-xs leading-tight" data-testid={`text-description-${position}`}>
          Premium placement & priority
        </p>

        {/* Benefits List - Single line */}
        <div className="mb-2 flex items-center gap-2 text-white/80 text-xs">
          <span>Top • Premium • Grades</span>
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleContactClick}
          className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 font-bold text-sm py-2 neon-glow transition-all group"
          data-testid={`button-contact-sponsor-${position}`}
        >
          Get Sponsored
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

      {/* Animated border glow effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-xl border-2 border-primary/50 animate-pulse" />
      </div>

      {/* Subtle animated gradient background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 animate-gradient-x" />
      </div>
    </div>
  );
}

export const SponsorPlaceholderCard = memo(SponsorPlaceholderCardComponent);
