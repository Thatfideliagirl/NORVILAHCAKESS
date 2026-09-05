export type Category = {
  slug: string; // "parfaits"
  name: string; // "Parfaits"
  image: string; // "/products/parfaits.jpg"
  blurb: string;
  order: number;
};

export type Variant = {
  id: string;
  label: string; // "Small", "8 inch", "Box of 6"
  priceNaira: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  description: string;
  image: string;
  priceNaira: number; // base price, or the lowest variant
  variants?: Variant[];
  // Left undefined until the client supplies real, product-specific
  // copy: these are food-safety-sensitive (allergens, nutrition) and
  // must never be guessed. "benefits" is deliberately framed as
  // good-to-know info, not a medical claim -- no "boosts immunity"
  // style copy. The product modal only renders these when present.
  benefits?: string[];
  ingredients?: string[];
  available: boolean;
  featured: boolean;
};

// All prices below are placeholders confirmed by the client and must be
// replaced before launch. The exact catalogue, names, descriptions and
// variants will be supplied later — this is a working structure, not
// final business data.
export const products: Product[] = [
  {
    id: "cake-celebration",
    slug: "celebration-cake",
    name: "Celebration Cake",
    categorySlug: "cakes",
    description:
      "A layered celebration cake, finished by hand with buttercream and fresh fruit.",
    image: "/products/cakes.jpg",
    priceNaira: 25000, // placeholder
    variants: [
      { id: "cake-6in", label: "6 inch", priceNaira: 25000 }, // placeholder
      { id: "cake-8in", label: "8 inch", priceNaira: 38000 }, // placeholder
      { id: "cake-10in", label: "10 inch", priceNaira: 55000 }, // placeholder
    ],
    available: true,
    featured: true,
  },
  {
    id: "cupcake",
    slug: "cupcake",
    name: "Cupcake",
    categorySlug: "cupcakes",
    description: "Soft, moist cupcakes, single or boxed for sharing.",
    image: "/products/cupcakes.jpg",
    priceNaira: 1200, // placeholder
    variants: [
      { id: "cupcake-single", label: "Single", priceNaira: 1200 }, // placeholder
      { id: "cupcake-box6", label: "Box of 6", priceNaira: 7000 }, // placeholder
      { id: "cupcake-box12", label: "Box of 12", priceNaira: 13000 }, // placeholder
    ],
    available: true,
    featured: false,
  },
  {
    id: "parfait-strawberry",
    slug: "strawberry-parfait",
    name: "Strawberry Parfait",
    categorySlug: "parfaits",
    description: "Layered strawberry, cream and crunch, made fresh to order.",
    image: "/products/parfaits.jpg",
    priceNaira: 3500, // placeholder
    available: true,
    featured: true,
  },
  {
    id: "parfait-mixed-berry",
    slug: "mixed-berry-parfait",
    name: "Mixed Berry Parfait",
    categorySlug: "parfaits",
    description: "A blend of berries layered with cream and granola crunch.",
    image: "/products/parfaits.jpg",
    priceNaira: 4000, // placeholder
    available: true,
    featured: false,
  },
  {
    id: "parfait-greek-yoghurt",
    slug: "greek-yoghurt-parfait",
    name: "Greek Yoghurt Parfait",
    categorySlug: "parfaits",
    description: "Greek yoghurt layered with fruit and honeyed granola.",
    image: "/products/parfaits.jpg",
    priceNaira: 4500, // placeholder
    available: true,
    featured: false,
  },
  {
    id: "waffles-plate",
    slug: "waffles",
    name: "Waffles, Plate of 3",
    categorySlug: "waffles",
    description: "Warm, golden waffles, made to order.",
    image: "/products/waffles.jpg",
    priceNaira: 4000, // placeholder
    available: true,
    featured: true,
  },
  {
    id: "meat-pie",
    slug: "meat-pie",
    name: "Meat Pie",
    categorySlug: "meat-pies",
    description: "Flaky pastry with a savoury, well-seasoned filling.",
    image: "/products/meat-pies.jpg",
    priceNaira: 1000, // placeholder
    variants: [
      { id: "meat-pie-single", label: "Single", priceNaira: 1000 }, // placeholder
      { id: "meat-pie-box6", label: "Box of 6", priceNaira: 5500 }, // placeholder
    ],
    available: true,
    featured: false,
  },
  {
    id: "banana-bread-loaf",
    slug: "banana-bread",
    name: "Banana Bread Loaf",
    categorySlug: "banana-bread",
    description: "Moist banana bread, dense and just sweet enough.",
    image: "/products/banana-bread.jpg",
    priceNaira: 6500, // placeholder
    available: true,
    featured: false,
  },
  {
    id: "milky-yoghurt-500",
    slug: "milky-yoghurt",
    name: "Milky Yoghurt, 500ml",
    categorySlug: "milky-yoghurt",
    description: "Cool, creamy milky yoghurt, made in house.",
    image: "/products/milky-yoghurt.jpg",
    priceNaira: 2500, // placeholder
    available: true,
    featured: false,
  },
  {
    id: "greek-yoghurt-500",
    slug: "greek-yoghurt",
    name: "Greek Yoghurt, 500ml",
    categorySlug: "greek-yoghurt",
    description: "Thick, tangy Greek yoghurt, made in house.",
    image: "/products/greek-yoghurt.jpg",
    priceNaira: 3000, // placeholder
    available: true,
    featured: false,
  },
  {
    id: "granola-250",
    slug: "granola",
    name: "Granola, 250g",
    categorySlug: "granola",
    description: "Toasted, honeyed granola, great over yoghurt or parfait.",
    image: "/products/granola.jpg",
    priceNaira: 5500, // placeholder
    available: true,
    featured: false,
  },
  {
    id: "small-chops-tray",
    slug: "small-chops",
    name: "Small Chops Tray",
    categorySlug: "small-chops",
    description: "A mixed tray of savoury small chops, perfect for events.",
    image: "/products/small-chops.jpg",
    priceNaira: 15000, // placeholder
    available: true,
    featured: false,
  },
];
