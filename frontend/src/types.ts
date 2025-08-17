export type Role = "responsavel" | "participante";
export type Platform = "vimeo" | "youtube";

// Pessoas
export interface Person {
  id: number;
  name: string;
  email?: string | null;
  created_at?: string;
}
export interface PersonIn {
  name: string;
  email?: string;
}

// Linhas / Sistemas
export interface System {
  id: number;
  name: string;
}

export interface SystemIn {
  name: string;
}
export interface Line {
  id: number;
  name: string;
  system_id?: number;
  system_name?: string;
}

export interface LineIn {
  name: string;
  system_id?: number | null;
}

// Mídias
export interface MediaPersonLink {
  person_id: number;
  role: Role;
}
export interface Media {
  id: number;
  title: string;
  description?: string;
  platform: Platform;
  url: string;
  published_at: string;
  line_id?: number;
  system_id?: number;
  people: MediaPersonLink[];
}
export interface MediaIn {
  title: string;
  description?: string;
  platform: Platform;
  url: string;
  published_at: string;
  line_id?: number;
  system_id?: number;
  people: MediaPersonLink[];
}

// Usuários
export interface User {
  id: number;
  username: string;
  role: "admin" | "user";
  person_id?: number;
}
export interface UserIn {
  username: string;
  password: string;
  role?: "admin" | "user";
  person_id?: number;
}
