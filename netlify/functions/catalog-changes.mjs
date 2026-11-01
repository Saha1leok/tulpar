import { getStore } from "@netlify/blobs";
import { isAuthenticated } from "./_auth.mjs";

const emptyChanges = () => ({ patches: {}, deleted: [], added: [], updatedAt: null });

export default async request => {
  const store = getStore({ name: "tulpar-catalog", region: "eu-central-1" });
  if (request.method === "GET") {
    const changes = await store.get("changes", { type: "json" });
    return Response.json(changes || emptyChanges(), { headers: { "Cache-Control": "no-store" } });
  }
  if (request.method !== "PUT") return new Response("Method not allowed", { status: 405 });
  if (!isAuthenticated(request)) return Response.json({ error: "Требуется вход администратора." }, { status: 401 });
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Некорректный JSON." }, { status: 400 }); }
  if (!body || typeof body.patches !== "object" || !Array.isArray(body.deleted) || !Array.isArray(body.added)) return Response.json({ error: "Некорректные данные каталога." }, { status: 400 });
  const changes = { patches: body.patches, deleted: body.deleted, added: body.added, updatedAt: new Date().toISOString() };
  const serialized = JSON.stringify(changes);
  if (serialized.length > 4_000_000) return Response.json({ error: "Размер изменений слишком большой." }, { status: 413 });
  await store.setJSON("changes", changes);
  return Response.json({ saved: true, updatedAt: changes.updatedAt });
};

export const config = { path: "/api/catalog-changes" };
