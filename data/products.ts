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
      "Moist, rich and beautifully crafted for birthdays, celebrations or simply treating yourself.",
    image: "/products/cakes.jpg",
    priceNaira: 25000, // placeholder
    variants: [
      { id: "cake-6in", label: "6 inch", priceNaira: 25000 }, // placeholder
      { id: "cake-8in", label: "8 inch", priceNaira: 38000 }, // placeholder
      { id: "cake-10in", label: "10 inch", priceNaira: 55000 }, // placeholder
    ],
    ingredients: ["Flour", "Eggs", "Butter", "Milk", "Sugar"],
    benefits: ["A delightful treat made for special moments and everyday celebrations."],
    available: true,
    featured: true,
  },
  {
    id: "cupcake",
    slug: "cupcake",
    name: "Cupcake",
    categorySlug: "cupcakes",
    description:
      "Soft, fluffy cupcakes finished with creamy frosting and made for little moments of happiness.",
    image: "/products/cupcakes.jpg",
    priceNaira: 1200, // placeholder
    variants: [
      { id: "cupcake-single", label: "Single", priceNaira: 1200 }, // placeholder
      { id: "cupcake-box6", label: "Box of 6", priceNaira: 7000 }, // placeholder
      { id: "cupcake-box12", label: "Box of 12", priceNaira: 13000 }, // placeholder
    ],
    ingredients: ["Flour", "Eggs", "Milk", "Butter", "Sugar", "Frosting"],
    benefits: ["A convenient individual treat that's perfect for sharing or enjoying on your own."],
    available: true,
    featured: false,
  },
  {
    id: "parfait-strawberry",
    slug: "strawberry-parfait",
    name: "Strawberry Parfait",
    categorySlug: "parfaits",
    description:
      "Creamy yoghurt layered with fresh fruit, crunchy toppings and delicious goodness in every spoonful.",
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
    description:
      "Creamy yoghurt layered with fresh fruit, crunchy toppings and delicious goodness in every spoonful.",
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
    description:
      "Creamy yoghurt layered with fresh fruit, crunchy toppings and delicious goodness in every spoonful.",
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
    description:
      "Crisp on the outside, soft and fluffy inside, made for a delicious little treat.",
    image: "/products/waffles.jpg",
    priceNaira: 4000, // placeholder
    ingredients: ["Flour", "Eggs", "Milk", "Butter", "Vanilla"],
    benefits: ["A satisfying source of energy with a comforting, freshly made taste."],
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
    description:
      "Smooth, creamy and refreshing, made for an easy everyday indulgence.",
    image: "/products/milky-yoghurt.jpg",
    priceNaira: 2500, // placeholder
    ingredients: ["Yoghurt", "Milk", "Natural sweeteners"],
    benefits: ["A dairy-based option that provides protein and calcium."],
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
  {
    id: "coconut-bread-loaf",
    slug: "coconut-bread",
    name: "Coconut Bread Loaf",
    categorySlug: "coconut-bread",
    description:
      "Soft, moist and delicately flavoured with coconut. A simple treat that's hard to resist.",
    image: "/products/coconut-bread.jpg",
    priceNaira: 6500, // placeholder
    ingredients: ["Flour", "Coconut", "Eggs", "Milk", "Butter"],
    benefits: ["Contains coconut and provides a satisfying, energy-rich snack."],
    available: true,
    featured: false,
  },
];
