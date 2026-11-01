import { createSession, isAuthenticated, safeEqual, sessionCookie } from "./_auth.mjs";

export default async request => {
  if (request.method === "GET") return Response.json({ authenticated: isAuthenticated(request) });
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword) return Response.json({ error: "На Netlify не задан ADMIN_PASSWORD." }, { status: 503 });
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Некорректный запрос." }, { status: 400 }); }
  if (!safeEqual(body.password || "", configuredPassword)) return Response.json({ error: "Неверный пароль." }, { status: 401 });
  return Response.json({ authenticated: true }, { headers: { "Set-Cookie": sessionCookie(createSession()) } });
};

export const config = { path: "/api/admin-login" };
