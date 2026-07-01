// ─── Base CraftJS node serialized format ───
export interface CraftNode {
  type: string | { resolvedName: string };
  props: Record<string, unknown>;
  parent?: string;
  displayName?: string;
  custom?: Record<string, unknown>;
  hidden?: boolean;
  isCanvas?: boolean;
  nodes?: string[];
  linkedNodes?: Record<string, string>;
}

export type CraftData = Record<string, CraftNode>;

// ─── Component props interfaces ───

export interface TextBlockProps {
  content: string;
  fontSize?: number;
  color?: string;
  textAlign?: "left" | "center" | "right";
}

export interface TitleProps {
  text: string;
  level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  align: "left" | "center" | "right";
  color?: string;
}

export interface ImageProps {
  src: string;
  alt?: string;
  href?: string;
  width?: number;
  height?: number;
}

export interface ButtonProps {
  label: string;
  href: string;
  variant: "primary" | "secondary" | "outline";
  size: "sm" | "md" | "lg";
}

export interface BannerProps {
  imageSrc: string;
  title: string;
  subtitle?: string;
  buttonLabel?: string;
  buttonHref?: string;
  overlayOpacity?: number;
  height: number;
  textColor: string;
}

export interface VideoProps {
  url: string;
  platform: "youtube" | "vimeo";
  aspectRatio: "16:9" | "4:3" | "1:1";
}

export interface SpacerProps {
  height: number;
}

export interface ColumnsProps {
  columns: 2 | 3 | 4;
  gap: number;
}

export interface ProductGridProps {
  title?: string;
  categoryId?: number;
  limit: number;
  columns: 2 | 3 | 4;
}

export interface CarouselProps {
  images: { src: string; alt?: string; href?: string }[];
  autoplay: boolean;
  interval: number;
}

export interface CustomHtmlProps {
  html: string;
}

// ─── Toolbox item ───

export interface ToolboxItem {
  name: string;
  label: string;
  icon: string;
  defaultProps: Record<string, unknown>;
}
