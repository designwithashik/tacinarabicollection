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
