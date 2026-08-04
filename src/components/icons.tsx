/** 최소한의 라인 아이콘 모음 (외부 아이콘 패키지 의존 없이 직접 구성) */

const common = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export const HomeIcon = () => (
  <svg {...common}>
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10v9h12v-9" />
  </svg>
);

export const TransactionIcon = () => (
  <svg {...common}>
    <path d="M4 8h13l-3-3" />
    <path d="M20 16H7l3 3" />
  </svg>
);

export const MembersIcon = () => (
  <svg {...common}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <path d="M16 6.2c1.2.4 2 1.5 2 2.8s-.8 2.4-2 2.8" />
    <path d="M21 20c0-2.6-1.7-4.8-4-5.6" />
  </svg>
);

export const ReportIcon = () => (
  <svg {...common}>
    <path d="M5 20V10" />
    <path d="M12 20V4" />
    <path d="M19 20v-7" />
  </svg>
);

export const PlusIcon = () => (
  <svg {...common}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const SearchIcon = () => (
  <svg {...common}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
