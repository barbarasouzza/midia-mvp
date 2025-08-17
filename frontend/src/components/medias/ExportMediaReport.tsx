// src/components/medias/ExportMediaReport.tsx
import { useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // <- sem RowInput aqui
import { useToast } from "../common/toast";
import type { Media, Line, System, Person } from "../../types";

type Props = {
  media: Media[];
  lines: Line[];
  systems: System[];
  people: Person[];
};

function toInputDate(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function formatDateTimeBR(d = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}
function fileStamp(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}`;
}

export default function ExportMediaReport({ media, lines, systems, people }: Props) {
  const { success, error } = useToast();

  const getPersonName = (id: number) => people.find(p => p.id === id)?.name || "—";
  const getLineName = (id?: number | null) => (id ? lines.find(l => l.id === id)?.name || "—" : "—");
  const getSystemName = (id?: number | null) => (id ? systems.find(s => s.id === id)?.name || "—" : "—");

  const tableHead = useMemo(
    () => ["Título", "Responsável", "Participantes", "Linha", "Sistema", "Plataforma", "Data", "URL"],
    []
  );

  // Use strings sempre -> serve tanto pro PDF quanto pro CSV
  const rows: string[][] = useMemo(() => {
    return media.map(m => {
      const responsavel = (m.people || []).find(p => p.role === "responsavel");
      const participantes = (m.people || []).filter(p => p.role === "participante");
      const participantesStr = participantes.map(p => getPersonName(p.person_id)).join(", ");

      return [
        m.title || "—",
        responsavel ? getPersonName(responsavel.person_id) : "—",
        participantesStr || "—",
        getLineName(m.line_id),
        getSystemName(m.system_id),
        m.platform || "—",
        toInputDate(m.published_at) || "—",
        m.url || "—",
      ];
    });
  }, [media, lines, systems, people]);

  const summary = useMemo(() => {
    const total = media.length;
    const byPlatform = media.reduce<Record<string, number>>((acc, m) => {
      const k = (m.platform || "—").toString();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const platformStr = Object.entries(byPlatform)
      .map(([k, v]) => `${k}: ${v}`)
      .join("  •  ");
    return { total, platformStr };
  }, [media]);

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 36;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Relatório de Mídias", margin, 42);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Gerado em: ${formatDateTimeBR()}`, margin, 60);
      doc.text(`Total: ${summary.total}`, margin, 76);
      if (summary.platformStr) doc.text(`Por plataforma: ${summary.platformStr}`, margin, 92);

      autoTable(doc, {
        startY: 110,
        head: [tableHead],
        body: rows,
        styles: { fontSize: 9, cellPadding: 6, valign: "middle" },
        headStyles: { fillColor: [11, 18, 32], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 180 }, // título
          1: { cellWidth: 120 }, // responsável
          2: { cellWidth: 180 }, // participantes
          3: { cellWidth: 100 }, // linha
          4: { cellWidth: 120 }, // sistema
          5: { cellWidth: 90 },  // plataforma
          6: { cellWidth: 70 },  // data
          7: { cellWidth: 180 }, // url
        },
        didDrawPage: () => {
          // rodapé
          const str = `Página ${doc.getNumberOfPages()}`;
          doc.setFontSize(9);
          doc.text(str, pageW - margin, pageH - 16, { align: "right" });
        },
      });

      doc.save(`relatorio-midias-${fileStamp()}.pdf`);
      success("PDF gerado ✔️");
    } catch (e: any) {
      console.error(e);
      error("Falha ao gerar PDF");
    }
  };

  const handleExportCSV = () => {
    try {
      const header = tableHead.join(";");
      const body = rows
        .map((r: string[]) =>
          r
            .map((v: string) => {
              const s = String(v ?? "");
              const needsQuotes = /[;"\n]/.test(s);
              const escaped = s.replace(/"/g, '""');
              return needsQuotes ? `"${escaped}"` : escaped;
            })
            .join(";")
        )
        .join("\n");

      const csv = header + "\n" + body;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-midias-${fileStamp()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      success("CSV gerado ✔️");
    } catch (e: any) {
      console.error(e);
      error("Falha ao gerar CSV");
    }
  };

  return (
    <div className="export-actions" style={{ display: "flex", gap: 8 }}>
      <button onClick={handleExportPDF} aria-label="Exportar PDF">Exportar PDF</button>
      <button onClick={handleExportCSV} aria-label="Exportar CSV">Exportar CSV</button>
    </div>
  );
}
