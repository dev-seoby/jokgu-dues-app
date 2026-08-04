/**
 * 공용 목업 데이터 & 타입
 *
 * Supabase 연동 전까지 모든 화면이 이 모듈의 데이터를 공유해서 사용함.
 * 실제 연동 시 이 파일의 export들을 Supabase 쿼리 훅으로 교체하면 됨.
 *
 * 데이터 모델은 노션 기획안 기준:
 * - Member: 이름, 상태(active/resting)
 * - MemberDues: 회원ID, 년월, 납부여부, 납부일, payment_type(monthly/annual_lump)
 * - Transaction: 유형(입금/지출), 날짜, 금액, 항목, 메모, 영수증 이미지
 */

export type MemberStatus = "active" | "resting";
export type PaymentType = "monthly" | "annual_lump";
export type TransactionType = "income" | "expense";

export interface Member {
  id: string;
  name: string;
  status: MemberStatus;
  paymentType: PaymentType;
  /** 올해 납부 완료된 월 (1~12) */
  paidMonths: number[];
}

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  memo: string;
  /** YYYY-MM-DD */
  date: string;
  receiptImageUrl?: string;
}

export const CURRENT_MONTH = 7;
export const CURRENT_YEAR = 2026;

export const EXPENSE_CATEGORIES = ["구장비", "유니폼 추가비", "물품", "회식비", "기타"];

let memberSeq = 0;
const m = (
  name: string,
  paidMonths: number[],
  status: MemberStatus = "active",
  paymentType: PaymentType = "monthly",
): Member => ({
  id: `member-${++memberSeq}`,
  name,
  status,
  paymentType,
  paidMonths,
});

export const MOCK_MEMBERS: Member[] = [
  m("김민수", [1, 2, 3, 4, 5, 6]),
  m("이서연", [1, 2, 3, 4, 5]),
  m("박지훈", [1, 2, 3, 4]),
  m("최유진", [1, 2, 3]),
  m("정다훈", [1, 2, 3, 4, 5, 6, 7]),
  m("강태양", [1, 2, 3, 4, 5, 6, 7]),
  m("조현우", [1, 2, 3, 4, 5, 6, 7]),
  m("윤소희", [1, 2, 3, 4, 5, 6, 7]),
  m("임재현", [1, 2, 3, 4, 5, 6, 7]),
  m("오세훈", [1, 2, 3, 4, 5, 6, 7]),
  m("배수빈", [1, 2, 3, 4, 5, 6, 7]),
  m("신우진", [1, 2, 3, 4, 5, 6, 7]),
  m("황지원", [1, 2, 3, 4, 5, 6, 7]),
  m("김지우", [1, 2, 3, 4, 5, 6, 7]),
  m("이나연", [1, 2, 3, 4, 5, 6, 7]),
  m("박현서", [1, 2, 3, 4, 5, 6, 7]),
  m("최가영", [1, 2, 3, 4, 5, 6, 7]),
  m("강채원", [1, 2, 3, 4, 5, 6, 7]),
  m("김민준", Array.from({ length: 7 }, (_, i) => i + 1), "resting", "annual_lump"),
  m("박서아", [1, 2, 3, 4, 5, 6, 7], "resting"),
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "tx-1", type: "income", category: "회비", amount: 220000, memo: "7월 회비 일괄입금 (11명)", date: "2026-07-25" },
  { id: "tx-2", type: "expense", category: "구장비", amount: 90000, memo: "풋살 구장 대여비 (7월)", date: "2026-07-20" },
  { id: "tx-3", type: "expense", category: "물품", amount: 15000, memo: "생수/아이싱볼", date: "2026-07-18" },
  { id: "tx-4", type: "expense", category: "유니폼 추가비", amount: 65000, memo: "신규회원 유니폼 2벌", date: "2026-07-20" },
  { id: "tx-5", type: "income", category: "회비", amount: 200000, memo: "8월 회비 일괄입금 (10명)", date: "2026-06-27" },
  { id: "tx-6", type: "expense", category: "구장비", amount: 90000, memo: "구장 대여비 (6월)", date: "2026-06-21" },
  { id: "tx-7", type: "expense", category: "회식비", amount: 180000, memo: "6월 정기 회식", date: "2026-06-14" },
  { id: "tx-8", type: "income", category: "회비", amount: 240000, memo: "6월 회비 일괄입금 (12명)", date: "2026-05-30" },
  { id: "tx-9", type: "income", category: "찬조금", amount: 100000, memo: "박신영 찬조", date: "2026-05-19" },
];

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export const activeMembers = () => MOCK_MEMBERS.filter((mm) => mm.status === "active");

export const isPaid = (member: Member, month: number) =>
  member.paymentType === "annual_lump" || member.status === "resting" || member.paidMonths.includes(month);

export const unpaidMembersOf = (month: number) =>
  activeMembers().filter((mm) => !isPaid(mm, month));

export const totalIncome = () =>
  MOCK_TRANSACTIONS.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);

export const totalExpense = () =>
  MOCK_TRANSACTIONS.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

export const thisMonthTransactions = () =>
  MOCK_TRANSACTIONS.filter((t) => t.date.startsWith(`${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, "0")}`));

export const thisMonthIncome = () =>
  thisMonthTransactions().filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);

export const thisMonthExpense = () =>
  thisMonthTransactions().filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
