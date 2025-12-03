import { Link } from "react-router-dom";
import { Category } from "@/types/game";
import { cn } from "@/lib/utils";
import { 
  Sword, Compass, Ghost, Car, Shield, Monitor, Trophy, Brain,
  Sparkles, Lightbulb, Users, Globe, Crosshair, Glasses, Gamepad2,
  LucideIcon
} from "lucide-react";

// Map icon names to actual Lucide components
const iconMap: Record<string, LucideIcon> = {
  Sword,
  Compass,
  Ghost,
  Car,
  Shield,
  Monitor,
  Trophy,
  Brain,
  Sparkles,
  Lightbulb,
  Users,
  Globe,
  Crosshair,
  Glasses,
  Gamepad2,
};

interface CategoryCardProps {
  category: Category;
  index?: number;
}

export const CategoryCard = ({ category, index = 0 }: CategoryCardProps) => {
  const IconComponent = iconMap[category.icon] || Gamepad2;
  
  return (
    <Link
      to={`/categories/${category.slug}`}
      className={cn(
        "glass-card group p-6 text-center hover:border-primary/50 transition-all duration-300 hover-glow opacity-0 animate-scale-in",
        `stagger-${(index % 6) + 1}`
      )}
    >
      <div className="flex justify-center mb-3">
        <IconComponent className="w-10 h-10 text-primary transition-transform duration-300 group-hover:scale-125" />
      </div>
      <h3 className="font-display font-bold text-foreground group-hover:text-primary transition-colors">
        {category.name}
      </h3>
      <p className="text-sm text-muted-foreground mt-1">{category.count} لعبة</p>
    </Link>
  );
};
