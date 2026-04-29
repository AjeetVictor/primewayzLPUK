export type HeroSlide = {
  id: string;
  headline: string;
  subheadline: string;
  accentText?: string;
};

export type HeroContentSliderProps = {
  slides: HeroSlide[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
};
