// File: src/api/api.ts
import type {
  Person, PersonIn, Line, LineIn, System, SystemIn, Media, MediaIn, User, UserIn
} from "../types";

export class ApiError extends Error {
  status: number;
  body: unknown;
  url?: string;
  constructor(message: string, status: number, body: unknown, url?: string) {
    super(message);
    this.status = status;
    this.body = body;
    this.url = url;
  }
}

export type ApiClientOptions = {
  base?: string;           // ⬅️ permite configurar a base
  timeoutMs?: number;      // ⬅️ timeout opcional por requisição
};

export class ApiClient {
  private base: string;
  private timeoutMs: number;

  constructor(opts: ApiClientOptions = {}) {
    this.base = opts.base ?? "/api";
    this.timeoutMs = opts.timeoutMs ?? 0; // 0 = sem timeout
  }

  private withTimeout(signal?: AbortSignal | null) {
    // Sem timeout → devolve um "cleanup" no-op e sem sinal de timeout
    if (!this.timeoutMs) {
      return {
        signal: undefined as AbortSignal | undefined,
        cleanup: () => { /* noop */ },
      };
    }

    const ac = new AbortController();
    const id = setTimeout(() => ac.abort(), this.timeoutMs);

    // Propaga abort externo (se houver)
    if (signal) {
      if (signal.aborted) {
        ac.abort();
      } else {
        signal.addEventListener("abort", () => ac.abort(), { once: true });
      }
    }

    return {
      signal: ac.signal,
      cleanup: () => clearTimeout(id),
    };
  }


  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = this.base + path;

    const headers = new Headers(init.headers || {});
    // aceita JSON sempre
    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    // seta Content-Type só se tiver body e ainda não tiver sido definido
    if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");

    const { signal: timeoutSignal, cleanup } = this.withTimeout(init.signal);

    try {
      const res = await fetch(url, {
        ...init,
        headers,
        credentials: "include",
        signal: timeoutSignal,
      });

      // 204/205: sem conteúdo
      if (res.status === 204 || res.status === 205) {
        return undefined as unknown as T;
      }

      const txt = await res.text();
      let body: unknown = null;
      try { body = txt ? JSON.parse(txt) : null; } catch { body = txt; }

      if (!res.ok) {
        const msg =
          typeof body === "object" && body && "message" in (body as any)
            ? (body as any).message
            : res.statusText || "Erro HTTP";
        throw new ApiError(String(msg), res.status, body, url);
      }

      return body as T;
    } catch (err: any) {
      // transforma erros de rede/abort/timeout num ApiError consistente
      if (err?.name === "AbortError") {
        throw new ApiError("Requisição cancelada/expirada", 0, null, url);
      }
      if (err instanceof ApiError) throw err;
      throw new ApiError(String(err?.message || "Falha de rede"), 0, null, url);
    } finally {
      cleanup();
    }
  }

  // --- Auth ---
  login(username: string, token: string) {
    return this.request<{ ok: boolean }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, token }),
    });
  }
  logout() { return this.request<{ ok: boolean }>("/auth/logout", { method: "POST" }); }
  ping() { return this.request<{ ok: boolean }>("/auth/ping"); }

  // --- Pessoas ---
  listPeople() { return this.request<Person[]>("/people"); }
  createPerson(data: PersonIn) {
    return this.request<Person>("/people", { method: "POST", body: JSON.stringify(data) });
  }
  updatePerson(id: number, data: PersonIn) {
    return this.request<Person>(`/people/${id}`, { method: "PUT", body: JSON.stringify(data) });
  }
  // ⬇️ opcional: PATCH parcial, simétrico ao de mídia
  updatePersonPartial(id: number, data: Partial<PersonIn>) {
    return this.request<Person>(`/people/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  }
  deletePerson(id: number) {
    return this.request<{ ok: boolean }>(`/people/${id}`, { method: "DELETE" });
  }

  // --- Linhas ---
  listLines() { return this.request<Line[]>("/lines"); }
  createLine(data: LineIn) {
    return this.request<Line>("/lines", { method: "POST", body: JSON.stringify(data) });
  }
  updateLine(id: number, data: LineIn) {
    return this.request<Line>(`/lines/${id}`, { method: "PUT", body: JSON.stringify(data) });
  }
  deleteLine(id: number) {
    return this.request<{ ok: boolean }>(`/lines/${id}`, { method: "DELETE" });
  }

  // --- Sistemas ---
  listSystems() { return this.request<System[]>("/systems"); }
  createSystem(data: SystemIn) {
    return this.request<System>("/systems", { method: "POST", body: JSON.stringify(data) });
  }
  updateSystem(id: number, data: SystemIn) {
    return this.request<System>(`/systems/${id}`, { method: "PUT", body: JSON.stringify(data) });
  }
  deleteSystem(id: number) {
    return this.request<{ ok: boolean }>(`/systems/${id}`, { method: "DELETE" });
  }

  // --- Mídias ---
  listMedia() { return this.request<Media[]>("/media"); }
  createMedia(data: MediaIn) {
    return this.request<Media>("/media", { method: "POST", body: JSON.stringify(data) });
  }
  updateMedia(id: number, data: MediaIn) {
    return this.request<Media>(`/media/${id}`, { method: "PUT", body: JSON.stringify(data) });
  }
  updateMediaPartial(id: number, data: Partial<MediaIn>) {
    return this.request<Media>(`/media/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  }
  deleteMedia(id: number) {
    return this.request<{ ok: boolean }>(`/media/${id}`, { method: "DELETE" });
  }

  // --- Usuários ---
  listUsers() { return this.request<User[]>("/users"); }
  createUser(data: UserIn) {
    return this.request<User>("/users", { method: "POST", body: JSON.stringify(data) });
  }
  updateUser(id: number, data: UserIn) {
    return this.request<User>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) });
  }
  deleteUser(id: number) {
    return this.request<{ ok: boolean }>(`/users/${id}`, { method: "DELETE" });
  }
}
