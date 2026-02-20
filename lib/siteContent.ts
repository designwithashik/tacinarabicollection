export type CarouselItem = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
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
