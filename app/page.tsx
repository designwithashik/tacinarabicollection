"use client";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  price: string | number;
  image_url: string;
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      const res = await fetch("/api/products");
      const data = (await res.json()) as Product[];
      setProducts(Array.isArray(data) ? data : []);
    };

    void loadProducts();
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Products</h1>
      <div id="product-container" className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="product-card rounded-xl border p-4 shadow-sm">
            <img src={product.image_url} alt={product.name} className="h-56 w-full rounded-md object-cover" />
            <h3 className="mt-3 text-lg font-semibold">{product.name}</h3>
            <p className="text-sm text-gray-700">{product.price}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
