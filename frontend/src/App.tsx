import { useState } from "react";
import { ApiClient, ApiError } from "./api";
import "./styles.css";

type Person = { id: number; name: string; email?: string | null };

const api = new ApiClient();

export default function App() {
  const [username, setUsername] = useState("admin");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);

  const handleLogin = async () => {
    setStatus(""); setLoading(true);
    try {
      if (!username.trim()) throw new Error("Informe o usuário.");
      if (!token.trim()) throw new Error("Informe o token.");
      await api.login(username, token);   // envia { username, token }
      await api.ping();                   // confirma sessão via cookie
      setAuthed(true);
      setStatus("Autenticado ✔️");
      setToken("");                       // não guardamos o token no front
    } catch (e: any) {
      setAuthed(false);
      setStatus(e instanceof ApiError ? `Falha (${e.status}): ${e.message}` : String(e));
    } finally { setLoading(false); }
  };


  const handleLogout = async () => {
    setLoading(true); setStatus("");
    try {
      await api.logout();
      setAuthed(false);
      setPeople([]);
      setStatus("Sessão encerrada.");
    } catch (e: any) {
      setStatus(e instanceof ApiError ? `Erro (${e.status}): ${e.message}` : String(e));
    } finally { setLoading(false); }
  };

  const loadPeople = async () => {
    setLoading(true); setStatus("");
    try {
      const list = await api.listPeople();
      setPeople(list);
      setStatus(`Carregado ✔️ (${list.length} pessoas)`);
    } catch (e: any) {
      setStatus(e instanceof ApiError ? `Erro (${e.status}): ${e.message}` : String(e));
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <header className="header"><h1>Mídias Digitais — Front</h1></header>

      <section className="card">
        <h2>Login</h2>
        <div className="row">
          <label>Usuário</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
        </div>
        <div className="row">
          <label>Token</label>
          <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="cole seu token" />
        </div>
        <div className="actions">
          {!authed ? (
            <button onClick={handleLogin} disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
          ) : (
            <button onClick={handleLogout} disabled={loading}>Sair</button>
          )}
          <button onClick={loadPeople} disabled={loading || !authed}>{loading ? "Carregando..." : "Listar Pessoas"}</button>
        </div>
        {status && <div className="status">{status}</div>}
      </section>

      <section className="card">
        <h2>Pessoas</h2>
        {people.length === 0 ? (
          <p className="status">Nenhuma pessoa carregada.</p>
        ) : (
          <ul className="list">
            {people.map(p => (
              <li key={p.id} className="item">
                <span className="name">{p.name}</span>
                {p.email ? <span className="email"> · {p.email}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
