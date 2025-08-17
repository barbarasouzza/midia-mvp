// File: src/components/Tabs.tsx
import React, { useId, useState } from "react";

export type TabItem = {
  label: string;
  content: React.ReactNode;
};

export type TabsProps = {
  tabs: TabItem[];
  initialIndex?: number;
  ariaLabel?: string; // ⬅️ novo
  className?: string;
};

export default function Tabs({ tabs, initialIndex = 0, ariaLabel, className = "" }: TabsProps) {
  const [active, setActive] = useState(initialIndex);
  const baseId = useId();

  return (
    <div className={`tabs ${className}`.trim()}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="tabs__list"
      >
        {tabs.map((t, i) => {
          const tabId = `${baseId}-tab-${i}`;
          const panelId = `${baseId}-panel-${i}`;
          const selected = i === active;
          return (
            <button
              key={tabId}
              id={tabId}
              role="tab"
              type="button"
              className={`tabs__tab ${selected ? "is-active" : ""}`}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") setActive((i + 1) % tabs.length);
                if (e.key === "ArrowLeft") setActive((i - 1 + tabs.length) % tabs.length);
                if (e.key === "Home") setActive(0);
                if (e.key === "End") setActive(tabs.length - 1);
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tabs.map((t, i) => {
        const tabId = `${baseId}-tab-${i}`;
        const panelId = `${baseId}-panel-${i}`;
        const selected = i === active;
        return (
          <div
            key={panelId}
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            hidden={!selected}
            className="tabs__panel"
          >
            {selected ? t.content : null}
          </div>
        );
      })}
    </div>
  );
}
