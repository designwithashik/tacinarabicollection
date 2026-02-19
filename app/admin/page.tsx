"use client";

import { FormEvent, useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  price: string | number;
  image_url: string;
};

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);

  const loadAdminProducts = async () => {
    const res = await fetch("/api/products");
    const data = (await res.json()) as Product[];
    setProducts(Array.isArray(data) ? data : []);
  };

  const deleteProduct = async (id: number) => {
    await fetch(`/api/admin/delete-product/${id}`, {
      method: "DELETE"
    });
    await loadAdminProducts();
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/admin/add-product", {
      method: "POST",
      body: form
    });
    e.currentTarget.reset();
    await loadAdminProducts();
  };

  useEffect(() => {
    void loadAdminProducts();
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h2 className="mb-4 text-2xl font-bold">Add Product</h2>

      <form id="product-form" className="space-y-3" onSubmit={onSubmit}>
        <input name="name" placeholder="Name" required className="w-full rounded border px-3 py-2" />
        <input name="price" placeholder="Price" required className="w-full rounded border px-3 py-2" />
        <input type="file" name="image" accept="image/*" required className="w-full" />
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">Add Product</button>
      </form>

      <hr className="my-8" />

      <h2 className="mb-4 text-2xl font-bold">Products</h2>
      <div id="admin-products" className="space-y-4">
        {products.map((product) => (
          <div key={product.id} style={{ marginBottom: 20 }} className="flex items-center gap-3">
            <img src={product.image_url} width={80} alt={product.name} />
            <strong>{product.name}</strong>
            <span>{product.price}</span>
            <button onClick={() => void deleteProduct(product.id)} className="rounded border px-3 py-1">
              Delete
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
