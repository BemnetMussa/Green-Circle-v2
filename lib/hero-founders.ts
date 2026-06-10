/**
 * Curated hero slideshow — founder + product photography.
 * Edit paths and copy when final licensed assets are ready (`public/images/...`).
 */
export interface HeroFounderSlide {
  id: string;
  src: string;
  alt: string;
  caption: string;
  credit: string;
}

/** Space in filename — encoded for reliable loading */
const IMG_COPY = '/images/image%20copy.png';

export const HERO_FOUNDER_SLIDES: HeroFounderSlide[] = [
  {
    id: "hero-1",
    src: "/images/image%20copy%204.png",
    alt: "Samrawit Fikru, founder of RIDE, Ethiopia's ride-hailing platform.",
    caption: "Samrawit Fikru — Founder of RIDE, transforming urban mobility in Ethiopia.",
    credit: "Samrawit Fikru",
  },
  {
    id: "hero-2",
    src: IMG_COPY,
    alt: "Betelhem Dessie, founder of iCog Anyone Can Code, an AI and coding education platform.",
    caption: "Betelhem Dessie — Founder of iCog Anyone Can Code, bringing AI and coding education to African youth.",
    credit: "Betelhem Dessie",
  },
  {
    id: "hero-3",
    src: "/images/image%20copy%202.png",
    alt: "Dawit Abraham, Co-Founder and CEO of Beemi, an interactive live-streaming platform.",
    caption: "Dawit Abraham — Co-Founder of Beemi, reimagining interactive live streaming and gaming.",
    credit: "Dawit Abraham",
  },
  {
    id: "hero-4",
    src: "/images/image%20copy%203.png",
    alt: "Ezedin Kamil, Co-Founder and CEO of Tina Mart and Ibex Technologies.",
    caption: "Ezedin Kamil — Co-Founder of Tina Mart, helping Ethiopian businesses thrive online.",
    credit: "Ezedin Kamil",
  },
];