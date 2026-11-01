import { clearSessionCookie } from "./_auth.mjs";

export default async request => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  return Response.json({ authenticated: false }, { headers: { "Set-Cookie": clearSessionCookie() } });
};

export const config = { path: "/api/admin-logout" };
