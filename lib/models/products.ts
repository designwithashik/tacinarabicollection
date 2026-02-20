export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: "Clothing" | "Ceramic";
  colors: string[];
  sizes: string[];
  title?: string;
  subtitle?: string;
};

export const products: Product[] = [
  {
    id: "kurti-printed",
    name: "Printed Kurti",
    price: 550,
    image: "/images/product-1.svg",
    category: "Clothing",
    colors: ["Beige", "Olive", "Maroon"],
    sizes: ["M", "L", "XL"],
  },
  {
    id: "summer-one-piece",
    name: "Summer One-piece",
    price: 620,
    image: "/images/product-2.svg",
    category: "Clothing",
    colors: ["Beige", "Black", "Maroon"],
    sizes: ["M", "L", "XL"],
  },
  {
    id: "casual-pants",
    name: "Casual Women Pants",
    price: 480,
    image: "/images/product-3.svg",
    category: "Clothing",
    colors: ["Olive", "Black", "Beige"],
    sizes: ["M", "L", "XL"],
  },
  {
    id: "minimal-men-shirt",
    name: "Minimal Men Shirt",
    price: 750,
    image: "/images/product-4.svg",
    category: "Clothing",
    colors: ["Black", "Beige", "Maroon"],
    sizes: ["M", "L", "XL"],
  },
  {
    id: "ceramic-vase",
    name: "Ceramic Flower Vase",
    price: 990,
    image: "/images/product-5.svg",
    category: "Ceramic",
    colors: ["Ivory", "Sand", "Terracotta"],
    sizes: ["M", "L", "XL"],
  },
  {
    id: "ceramic-cup",
    name: "Ceramic Coffee Cup",
    price: 450,
    image: "/images/product-6.svg",
    category: "Ceramic",
    colors: ["Ivory", "Sand", "Terracotta"],
    sizes: ["M", "L", "XL"],
  },
];
