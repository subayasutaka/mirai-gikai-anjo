// Free commercial-use theme photographs. Source and license checked 2026-09-30.
// Objects only: Pexels forbids depicting people in political contexts.
export const ANJO_PHOTOS = {
  budget: {
    src: "/anjo/photos/budget.jpg",
    alt: "計算機とペン",
    author: "Kaboompics",
    source: "https://www.pexels.com/photo/calculator-with-pen-5412200/",
    license: "https://www.pexels.com/license/",
    checkedOn: "2026-09-30",
  },
  water: {
    src: "/anjo/photos/water.jpg",
    alt: "蛇口から流れる水",
    author: "Karolina Grabowska / Kaboompics",
    source:
      "https://www.pexels.com/photo/water-flows-from-the-tap-to-sink-6256/",
    license: "https://www.pexels.com/license/",
    checkedOn: "2026-09-30",
  },
  documents: {
    src: "/anjo/photos/documents.jpg",
    alt: "ノートとペン",
    author: "Yusuf Çelik",
    source:
      "https://www.pexels.com/photo/opened-notebook-with-blank-pages-18677608/",
    license: "https://www.pexels.com/license/",
    checkedOn: "2026-09-30",
  },
  flowers: {
    src: "/anjo/photos/flowers.jpg",
    alt: "窓辺の白い花",
    author: "cottonbro studio",
    source:
      "https://www.pexels.com/photo/white-flowers-in-clear-glass-vase-5960675/",
    license: "https://www.pexels.com/license/",
    checkedOn: "2026-09-30",
  },
  health: {
    src: "/anjo/photos/health.jpg",
    alt: "白い机の聴診器",
    author: "Pavel Danilyuk",
    source:
      "https://www.pexels.com/photo/stethoscope-on-white-surface-6753427/",
    license: "https://www.pexels.com/license/",
    checkedOn: "2026-09-30",
  },
  recycling: {
    src: "/anjo/photos/recycling.jpg",
    alt: "分別用の容器",
    author: "Polina Tankilevitch",
    source: "https://www.pexels.com/photo/recycling-bins-3735212/",
    license: "https://www.pexels.com/license/",
    checkedOn: "2026-09-30",
  },
  parking: {
    src: "/anjo/photos/parking.jpg",
    alt: "駐車場の区画",
    author: "Ellie Burgin",
    source: "https://www.pexels.com/photo/empty-spaces-of-parking-lot-8910523/",
    license: "https://www.pexels.com/license/",
    checkedOn: "2026-09-30",
  },
  land: {
    src: "/anjo/photos/land.jpg",
    alt: "紙の地図",
    author: "Marina Leonova",
    source:
      "https://www.pexels.com/photo/paper-map-on-the-white-surface-7634479/",
    license: "https://www.pexels.com/license/",
    checkedOn: "2026-09-30",
  },
  food: {
    src: "/anjo/photos/food.jpg",
    alt: "ご飯と野菜のお皿",
    author: "Anca",
    source:
      "https://www.pexels.com/photo/tasty-rice-with-stewed-vegetables-on-plate-7189421/",
    license: "https://www.pexels.com/license/",
    checkedOn: "2026-09-30",
  },
  pipes: {
    src: "/anjo/photos/pipes.jpg",
    alt: "水滴のついた配管",
    author: "Monstera Production",
    source: "https://www.pexels.com/photo/close-up-pipes-in-rain-7794404/",
    license: "https://www.pexels.com/license/",
    checkedOn: "2026-09-30",
  },
  technology: {
    src: "/anjo/photos/technology.jpg",
    alt: "キーボード",
    author: "Lukas Mayer",
    source: "https://www.pexels.com/photo/black-computer-keyboard-785429/",
    license: "https://www.pexels.com/license/",
    checkedOn: "2026-09-30",
  },
} as const;

export type AnjoPhoto = (typeof ANJO_PHOTOS)[keyof typeof ANJO_PHOTOS];

// Specific subjects precede generic budget/document words. Unknown topics use
// neutral stationery, rather than guessing at a person or a particular facility.
export function getAnjoPhoto(subject: string): AnjoPhoto {
  if (/斎苑|葬|火葬/.test(subject)) return ANJO_PHOTOS.flowers;
  if (/償還|返戻|返すお金/.test(subject)) return ANJO_PHOTOS.budget;
  if (/給食|食費|食事/.test(subject)) return ANJO_PHOTOS.food;
  if (/システム|デジタル|電子/.test(subject)) return ANJO_PHOTOS.technology;
  if (/廃棄物|ごみ|ゴミ|資源|リサイクル/.test(subject))
    return ANJO_PHOTOS.recycling;
  if (/下水道|配管/.test(subject)) return ANJO_PHOTOS.pipes;
  if (/水道/.test(subject)) return ANJO_PHOTOS.water;
  if (/駐車場/.test(subject)) return ANJO_PHOTOS.parking;
  if (/土地|固定資産|公図|地縁/.test(subject)) return ANJO_PHOTOS.land;
  if (/医療|健康|介護|保険/.test(subject)) return ANJO_PHOTOS.health;
  if (/予算|決算|会計|精算|剰余金/.test(subject)) return ANJO_PHOTOS.budget;
  return ANJO_PHOTOS.documents;
}
