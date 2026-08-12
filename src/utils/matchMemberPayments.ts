import type { Member } from "../data/mock";
import { yearMonthKey } from "../data/mock";

/**
 * 거래내역 업로드 시, 입금 건의 메모(예: "임지섭 7월", "이세일7,8월")를 보고
 * 어떤 회원의 몇 월 회비인지 자동으로 추정하는 유틸.
 *
 * 총무가 최종 확인 후 반영하도록, 이 파일은 "추정"만 하고 실제 반영은
 * ImportTransactionsModal의 미리보기 화면에서 총무가 확인/수정한 뒤에 이뤄짐.
 */

/**
 * 메모 텍스트에서 "7월", "7,8월", "7,8,9월" 같은 월 표기를 찾아 숫자 배열로 변환.
 * 못 찾으면 빈 배열을 반환 (호출부에서 거래 날짜의 월로 대체 처리).
 */
export function parseMonthsFromText(text: string): number[] {
  const months = new Set<number>();
  const pattern = /((?:\d{1,2}\s*[,./·~]\s*)*\d{1,2})\s*월/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const group = match[1];
    for (const piece of group.split(/[,./·~]/)) {
      const n = Number(piece.trim());
      if (Number.isInteger(n) && n >= 1 && n <= 12) months.add(n);
    }
  }
  return [...months].sort((a, b) => a - b);
}

/**
 * 메모 텍스트에 이름이 포함된 회원을 찾는다. 여러 명이 매칭되면(예: 한 이름이
 * 다른 이름의 부분 문자열인 경우) 더 긴 이름을 우선한다.
 */
export function matchMemberInText(members: Member[], text: string): Member | null {
  const candidates = members.filter((m) => m.name.trim().length > 0 && text.includes(m.name));
  if (candidates.length === 0) return null;
  return candidates.reduce((best, cur) => (cur.name.length > best.name.length ? cur : best));
}

export interface PaymentMatchSuggestion {
  memberId: string | null;
  /** 쉼표로 구분된 월 문자열 (예: "7,8") — 미리보기에서 그대로 편집 가능하도록 문자열로 유지 */
  monthsText: string;
}

/**
 * 입금 거래 1건에 대한 회원/납부월 추정.
 * - 메모에 회원 이름이 있으면 그 회원으로 매칭
 * - 메모에 월 표기가 있으면 그 달(들)로, 없으면 거래 날짜의 월로 추정
 */
export function suggestPaymentMatch(
  memo: string,
  transactionDateISO: string,
  members: Member[],
): PaymentMatchSuggestion {
  const matchedMember = matchMemberInText(members, memo);
  const monthsFromText = parseMonthsFromText(memo);
  const fallbackMonth = Number(transactionDateISO.slice(5, 7));
  const months = monthsFromText.length > 0 ? monthsFromText : [fallbackMonth];
  return {
    memberId: matchedMember?.id ?? null,
    monthsText: months.join(","),
  };
}

/** "7,8" 같은 문자열을 [7,8]로 파싱. 잘못된 값은 무시. */
export function parseMonthsText(monthsText: string): number[] {
  const months = new Set<number>();
  for (const piece of monthsText.split(",")) {
    const n = Number(piece.trim());
    if (Number.isInteger(n) && n >= 1 && n <= 12) months.add(n);
  }
  return [...months].sort((a, b) => a - b);
}

/**
 * 미리보기에서 총무가 입력한 "7,8" 같은 월 문자열을, 해당 거래의 실제 날짜(연도)와
 * 묶어서 "2026-07", "2026-08" 같은 연-월 키로 변환한다.
 *
 * 회원관리는 연도별로 납부월을 저장하므로, 몇 년치가 섞인 파일을 업로드해도
 * 각 거래 자신의 날짜에서 연도를 가져오기 때문에 자동으로 올바른 연도에 반영된다.
 */
export function toYearMonthKeys(monthsText: string, referenceDateISO: string): string[] {
  const year = Number(referenceDateISO.slice(0, 4));
  return parseMonthsText(monthsText).map((month) => yearMonthKey(year, month));
}
