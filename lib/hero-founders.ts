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
    id: 'hero-1',
    src: '/images/image%20copy%204.png',
    alt: 'Samrawit Fikru, Ethiopian founder with product.',
    caption: 'Samrawit Fikru — building products that matter.',
    credit: 'Samrawit Fikru',
  },
  {
    id: 'hero-2',
    src: IMG_COPY,
    alt: 'Bethelhem Tadesse, Ethiopian founder with product.',
    caption: 'Bethelhem Tadesse — innovation at work.',
    credit: 'Bethelhem Tadesse',
  },
   {
    id: 'hero-3',
    src: "/images/image%20copy%202.png",
    alt: 'Dawit Abraham Co-Founder and CEO of Beemi,',
    caption: 'Dawit Abraham Co-Founder and CEO of Beemi - Ethiopian-based startup that gamifies live streaming platforms',
    credit: 'Dawit Abraham',
  },
   {
    id: 'hero-4',
    src: "/images/image%20copy%203.png",
    alt: 'Ezedin Kamil co-founder and CEO of Ibex Technologies and Tina Mart.,',
    caption: 'Ezedin Kamil co-founder and CEO of Ibex Technologies and Tina Mart.,',
    credit: 'Ezedin Kamil',
  },

];
