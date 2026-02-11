/*
 * What this file does:
 *   - Reads and writes product inventory records in Vercel KV via REST endpoints.
 * Why it exists:
 *   - Persistent inventory without redeploy, shared across all clients.
 * Notes:
 *   - Uses KV REST env vars and stores payload under "products:current".
 */

import type { AdminProduct } from "./inventory";

const INVENTORY_KEY = "products:current";

type KVEnvelope = { data: AdminProduct[] };

type KVResult = { result?: KVEnvelope | string | null };

const getKVConfig = () => {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error("KV is not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN.");
  }
  return { url, token };
};

const parseEnvelope = (input: unknown): KVEnvelope => {
  if (!input) return { data: [] };
  if (typeof input === "string") {
    try {
      return parseEnvelope(JSON.parse(input));
    } catch {
      return { data: [] };
    }
  }
  if (typeof input === "object" && input && Array.isArray((input as KVEnvelope).data)) {
    return { data: (input as KVEnvelope).data };
  }
  return { data: [] };
};

export const getKVProducts = async (): Promise<AdminProduct[]> => {
  const { url, token } = getKVConfig();
  const res = await fetch(`${url}/get/${encodeURIComponent(INVENTORY_KEY)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to read products from KV.");
  }

  const payload = (await res.json()) as KVResult;
  return parseEnvelope(payload.result).data;
};

export const setKVProducts = async (products: AdminProduct[]) => {
  const { url, token } = getKVConfig();
  const envelope: KVEnvelope = { data: products };

  // Upstash/Vercel KV REST accepts value in set path; encoding keeps JSON safe.
  const value = encodeURIComponent(JSON.stringify(envelope));
  const res = await fetch(`${url}/set/${encodeURIComponent(INVENTORY_KEY)}/${value}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to persist products to KV.");
  }
};
