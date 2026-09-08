import type { LucideIcon } from "lucide-react";
import {
  CarIcon,
  ClapperboardIcon,
  EllipsisIcon,
  HeartPulseIcon,
  HomeIcon,
  ShoppingCartIcon,
  SofaIcon,
  TagIcon,
  UtensilsIcon,
  WifiIcon,
  ZapIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  home: HomeIcon,
  zap: ZapIcon,
  wifi: WifiIcon,
  "shopping-cart": ShoppingCartIcon,
  sofa: SofaIcon,
  utensils: UtensilsIcon,
  car: CarIcon,
  clapperboard: ClapperboardIcon,
  "heart-pulse": HeartPulseIcon,
  ellipsis: EllipsisIcon,
  tag: TagIcon,
};

export function CategoryGlyph({
  icon,
  className,
}: {
  icon?: string | null;
  className?: string;
}) {
  const Icon = (icon && ICONS[icon]) || TagIcon;
  return <Icon className={className} />;
}

export function colorWithAlpha(hex: string | null | undefined, alpha: string) {
  const raw = (hex ?? "#64748b").replace("#", "");
  if (raw.length === 6) {
    return `#${raw}${alpha}`;
  }
  return `#${raw}`;
}
