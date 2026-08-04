import type { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const HomeIcon = () => (
  <svg {...base}>
    <path d="M4 11.2 12 4.5l8 6.7" />
    <path d="M6 9.8V19a1 1 0 0 0 1 1h3.2v-4.6a1.8 1.8 0 0 1 1.8-1.8v0a1.8 1.8 0 0 1 1.8 1.8V20H17a1 1 0 0 0 1-1V9.8" />
  </svg>
);

export const TransactionIcon = () => (
  <svg {...base}>
    <path d="M4 8.5h12.5" />
    <path d="M13.5 5 16.8 8.3 13.5 11.6" />
    <path d="M20 15.5H7.5" />
    <path d="M10.5 12.4 7.2 15.7 10.5 19" />
  </svg>
);

export const MembersIcon = () => (
  <svg {...base}>
    <circle cx="9.5" cy="8" r="2.9" />
    <path d="M3.6 19.4c0-3.3 2.6-5.6 5.9-5.6s5.9 2.3 5.9 5.6" />
    <path d="M15.8 6.2c1.2.3 2.1 1.4 2.1 2.7 0 1.3-.9 2.4-2.1 2.7" />
    <path d="M20.4 19.4c0-2.7-1.6-4.8-3.8-5.5" />
  </svg>
);

export const ReportIcon = () => (
  <svg {...base}>
    <rect x="4" y="4.5" width="16" height="15" rx="2.2" />
    <path d="M8 15.2V12" />
    <path d="M12 15.2V9" />
    <path d="M16 15.2v-3.6" />
  </svg>
);

export const PlusIcon = () => (
  <svg {...base} width={18} height={18}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const SearchIcon = () => (
  <svg {...base} width={18} height={18}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const CloseIcon = () => (
  <svg {...base} width={16} height={16}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
