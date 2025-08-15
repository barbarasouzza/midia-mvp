// src/api.ts
export class ApiError extends Error {
  status: number; body: unknown;
  constructor(message: string, status: number, body: unknown) { super(message); this.status = status; this.body = body; }
}

export class ApiClient {
  private base = "/api";
  constructor() {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers || {});
    if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");

    const res = await fetch(this.base + path, { ...init, headers, credentials: "include" });
    const txt = await res.text();
    let body: unknown = null;
    try { body = txt ? JSON.parse(txt) : null; } catch { body = txt; }
    if (!res.ok) {
      const msg = typeof body === "object" && body && "message" in (body as any)
        ? (body as any).message : res.statusText || "Erro HTTP";
      throw new ApiError(String(msg), res.status, body);
    }
    return body as T;
  }

  login(username: string, token: string) {
    return this.request<{ ok: boolean }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, token }),
    });
  }
  logout() { return this.request<{ ok: boolean }>("/auth/logout", { method: "POST" }); }
  ping() { return this.request<{ ok: boolean }>("/auth/ping"); }

  listPeople() { return this.request<Array<{ id: number; name: string; email?: string | null }>>("/people"); }
}
