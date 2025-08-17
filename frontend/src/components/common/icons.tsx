import React from "react";

type Props = React.SVGProps<SVGSVGElement>;

const base = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const PlusIcon = (p: Props) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14"/></svg>
);
export const EditIcon = (p: Props) => (
  <svg {...base} {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
);
export const TrashIcon = (p: Props) => (
  <svg {...base} {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
);
export const SaveIcon = (p: Props) => (
  <svg {...base} {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>
);
export const XIcon = (p: Props) => (
  <svg {...base} {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>
);
export const DownloadIcon = (p: Props) => (
  <svg {...base} {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
);
export const FilterIcon = (p: Props) => (
  <svg {...base} {...p}><path d="M22 3H2l8 9v7l4 2v-9l8-9z"/></svg>
);
