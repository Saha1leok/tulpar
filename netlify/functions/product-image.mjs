import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";
import { isAuthenticated } from "./_auth.mjs";

const storeOptions = { name: "tulpar-product-images", region: "eu-central-1" };

export default async request => {
  const store = getStore(storeOptions);
  if (request.method === "GET") {
    const key = new URL(request.url).searchParams.get("key") || "";
    if (!/^products\/[a-zA-Z0-9._-]+$/.test(key)) return new Response("Not found", { status: 404 });
    const entry = await store.getWithMetadata(key, { type: "arrayBuffer" });
    if (!entry) return new Response("Not found", { status: 404 });
    return new Response(entry.data, { headers: { "Content-Type": entry.metadata?.contentType || "image/webp", "Cache-Control": "public, max-age=31536000, immutable" } });
  }
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!isAuthenticated(request)) return Response.json({ error: "Требуется вход администратора." }, { status: 401 });
  const contentType = request.headers.get("content-type") || "";
  if (!/^image\/(webp|jpeg|png)$/.test(contentType)) return Response.json({ error: "Разрешены изображения JPG, PNG и WebP." }, { status: 415 });
  const bytes = await request.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > 5_000_000) return Response.json({ error: "Фотография должна быть не больше 5 МБ." }, { status: 413 });
  const extension = contentType === "image/png" ? "png" : contentType === "image/jpeg" ? "jpg" : "webp";
  const key = `products/${Date.now()}-${randomUUID()}.${extension}`;
  await store.set(key, bytes, { metadata: { contentType } });
  return Response.json({ url: `/api/product-image?key=${encodeURIComponent(key)}` });
};

export const config = { path: "/api/product-image" };
