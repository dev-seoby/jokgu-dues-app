/**
 * 공용 타입 & 헬퍼
 *
 * 실제 데이터는 Supabase(members/transactions 테이블)에서 불러오며,
 * 이 파일은 화면 전반에서 공유하는 타입 정의와 순수 헬퍼 함수만 담당함.
 *
 * 데이터 모델은 노션 기획안 기준:
 * - Member: 이름, 상태(active/resting), 납부방식(monthly/annual_lump), 월별 납부 여부
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

// 실제 서비스 운영 중 매달 자동으로 넘어가야 하므로 하드코딩하지 않고
// 페이지 로드 시점의 실제 날짜에서 계산함
const now = new Date();
export const CURRENT_MONTH = now.getMonth() + 1;
export const CURRENT_YEAR = now.getFullYear();

export const EXPENSE_CATEGORIES = ["구장비", "유니폼 추가비", "물품", "회식비", "기타"];

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export const isPaid = (member: Member, month: number) =>
  member.paymentType === "annual_lump" || member.status === "resting" || member.paidMonths.includes(month);
