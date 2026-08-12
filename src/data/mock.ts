/**
 * 공용 타입 & 헬퍼
 *
 * 실제 데이터는 Supabase(members/transactions 테이블)에서 불러오며,
 * 이 파일은 화면 전반에서 공유하는 타입 정의와 순수 헬퍼 함수만 담당함.
 *
 * 데이터 모델은 노션 기획안 기준:
 * - Member: 이름, 상태(active/resting), 납부방식(monthly/annual_lump), 연-월별 납부 여부
 * - Transaction: 유형(입금/지출), 날짜, 금액, 항목, 메모, 영수증 이미지
 *
 * 납부 현황은 "월(1~12)"이 아니라 "연-월(YYYY-MM)" 단위로 저장한다.
 * 대시보드가 여러 해에 걸쳐 계속 쓰일 걸 감안해, 올해 7월 납부와 내년 7월
 * 납부가 서로 다른 기록으로 남도록 하기 위함. 연납(annual_lump)도 별도
 * 처리가 아니라 "그 해 1~12월을 한 번에 채우는 액션"으로 동일한 저장소를
 * 공유한다 — 그래야 연납한 해가 지나면 다음 해엔 다시 납부 대상이 됨.
 */

export type MemberStatus = "active" | "resting";
export type PaymentType = "monthly" | "annual_lump";
export type TransactionType = "income" | "expense";

export interface Member {
  id: string;
  name: string;
  status: MemberStatus;
  paymentType: PaymentType;
  /** 납부 완료된 연-월 목록. 예: ["2026-07", "2026-08"] */
  paidYearMonths: string[];
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

// 실제 서비스 운영 중 매달/매년 자동으로 넘어가야 하므로 하드코딩하지 않고
// 페이지 로드 시점의 실제 날짜에서 계산함
const now = new Date();
export const CURRENT_MONTH = now.getMonth() + 1;
export const CURRENT_YEAR = now.getFullYear();

export const EXPENSE_CATEGORIES = ["구장비", "유니폼 추가비", "물품", "회식비", "기타"];

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

/** "2026-07" 형태의 연-월 키를 만든다 */
export const yearMonthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;

export const isPaid = (member: Member, year: number, month: number) =>
  member.status === "resting" || member.paidYearMonths.includes(yearMonthKey(year, month));

/** 연납 회원이 특정 연도의 1~12월을 전부 납부 처리했는지 */
export const isYearFullyPaid = (member: Member, year: number) =>
  Array.from({ length: 12 }, (_, i) => yearMonthKey(year, i + 1)).every((key) =>
    member.paidYearMonths.includes(key),
  );
