import "./BottomNav.css";

export type TabKey = "home" | "transactions" | "members" | "report";

const TABS: { key: TabKey; label: string }[] = [
  { key: "home", label: "홈" },
  { key: "transactions", label: "거래" },
  { key: "members", label: "회원" },
  { key: "report", label: "리포트" },
];

// 아이콘은 최소한의 라인 아이콘으로 직접 구성 (외부 아이콘 패키지 의존 없이)
function TabIcon({ tab, active }: { tab: TabKey; active: boolean }) {
  const stroke = active ? "var(--brand)" : "var(--text-secondary)";
  const common = { fill: "none", stroke, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (tab) {
    case "home":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" {...common}>
          <path d="M4 11.5 12 4l8 7.5" />
          <path d="M6 10v9h12v-9" />
        </svg>
      );
    case "transactions":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" {...common}>
          <path d="M4 8h13l-3-3" />
          <path d="M20 16H7l3 3" />
        </svg>
      );
    case "members":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <path d="M16 6.2c1.2.4 2 1.5 2 2.8s-.8 2.4-2 2.8" />
          <path d="M21 20c0-2.6-1.7-4.8-4-5.6" />
        </svg>
      );
    case "report":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" {...common}>
          <path d="M5 20V10" />
          <path d="M12 20V4" />
          <path d="M19 20v-7" />
        </svg>
      );
  }
}

export function BottomNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  return (
    <nav className="bottom-nav" role="tablist" aria-label="화면 전환">
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          role="tab"
          aria-selected={active === key}
          className={`bottom-nav-item ${active === key ? "active" : ""}`}
          onClick={() => onChange(key)}
        >
          <TabIcon tab={key} active={active === key} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
