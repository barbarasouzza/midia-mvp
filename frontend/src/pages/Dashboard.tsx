// File: src/pages/Dashboard.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { ApiClient } from "../api/api";
import Tabs from "../components/Tabs";

import MediaList from "../components/medias/MediaList";
import PeopleList from "../components/PeopleList";
import SystemsList from "../components/SystemsList";

type Person = { id: number; name: string; email?: string | null };
type Line = { id: number; name: string };
type System = { id: number; name: string };

const api = new ApiClient();

export default function Dashboard() {
  const [people, setPeople] = useState<Person[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [systems, setSystems] = useState<System[]>([]);

  const loadAll = useCallback(async () => {
    try {
      const [p, l, s] = await Promise.all([
        api.listPeople(),
        api.listLines(),
        api.listSystems(),
      ]);
      setPeople(p);
      setLines(l);
      setSystems(s);
    } catch (e) {
      console.error(e);
      // opcional: exibir toast de erro
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // memo pra não recriar a estrutura a cada render
  const tabs = useMemo(
    () => [
      {
        label: "Mídias",
        content: <MediaList lines={lines} systems={systems} people={people} />,
      },
      { label: "Pessoas", content: <PeopleList onChange={loadAll} /> },
      { label: "Sistemas", content: <SystemsList onChange={loadAll} /> },
    ],
    [lines, systems, people, loadAll]
  );

  return (
    <div className="page">
      <header className="header">
        <h1 id="dashboard-title">Dashboard de Publicações</h1>
      </header>
      {/* Se o seu Tabs aceitar ariaLabel/id, ótimo para a11y */}
      <Tabs tabs={tabs} ariaLabel="Seções do dashboard" />
    </div>
  );
}
