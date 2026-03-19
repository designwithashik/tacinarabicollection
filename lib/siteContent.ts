export type CarouselTextAlign = "left" | "center" | "right";
export type CarouselOverlayIntensity = "light" | "medium" | "strong";

export type CarouselItem = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  campaignLabel?: string;
  buttonText: string;
  buttonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  metadataChips?: string[];
  textAlign?: CarouselTextAlign;
  overlayIntensity?: CarouselOverlayIntensity;
  active: boolean;
  order: number;
};

export type AnnouncementContent = {
  text: string;
  active: boolean;
};

export type FilterPanelItem = {
  id: string;
  label: string;
  value: string;
  active: boolean;
  highlight: boolean;
  showOnLanding: boolean;
  order: number;
};
