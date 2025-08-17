import { useState } from "react";
import { ApiClient, ApiError } from "../api/api";
import { useNavigate } from "react-router-dom";

const api = new ApiClient();

export default function Login() {
  const [username, setUsername] = useState("admin");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setStatus(""); setLoading(true);
    try {
      if (!username.trim()) throw new Error("Informe o usuário.");
      if (!token.trim()) throw new Error("Informe o token.");
      await api.login(username, token);
      await api.ping();
      setToken("");
      navigate("/dashboard"); // redireciona após login
    } catch (e: any) {
      setStatus(e instanceof ApiError ? `Falha (${e.status}): ${e.message}` : String(e));
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
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
          <button onClick={handleLogin} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
        {status && <div className="status">{status}</div>}
      </section>
    </div>
  );
}
