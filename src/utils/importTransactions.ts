import * as XLSX from "xlsx";
import * as officeCrypto from "officecrypto-tool";
import { Buffer } from "buffer";
import type { Transaction, TransactionType } from "../data/mock";

/**
 * 엑셀/CSV 거래내역 업로드 파싱 유틸
 *
 * 카카오뱅크 등 은행 앱에서 내보낸 거래내역 파일을 최대한 그대로 인식하도록
 * 컬럼명을 유연하게 매칭한다 (은행마다 헤더 문구가 조금씩 다름).
 * 100% 자동 인식을 보장하지 않으므로, 파싱 결과는 항상 "미리보기 후 확인/수정"
 * 화면(ImportTransactionsModal)을 거쳐 총무가 최종 확인하고 가져오기 하도록 설계함.
 *
 * 은행에서 내보낸 파일은 비밀번호로 암호화되어 있는 경우가 많다 (MS Office
 * "암호 설정" 방식). 이 경우 officecrypto-tool로 비밀번호를 받아 복호화한 뒤
 * 같은 파싱 로직을 태운다.
 */

export interface StagedTransactionRow {
  /** 미리보기 테이블에서 각 행을 구분하기 위한 내부 키 (react key용) */
  key: string;
  date: string; // YYYY-MM-DD, 인식 실패 시 오늘 날짜로 대체
  dateRecognized: boolean;
  type: TransactionType;
  category: string;
  amount: number;
  memo: string;
  /** 기존 거래내역과 (날짜+금액+구분) 기준으로 겹치는지 여부 */
  isDuplicate: boolean;
  /** 미리보기에서 가져오기 대상으로 체크되어 있는지 (중복 건은 기본 해제) */
  include: boolean;
}

export interface ParseResult {
  rows: StagedTransactionRow[];
  /** 헤더 행을 못 찾아 컬럼을 추정으로 처리한 경우 경고 표시용 */
  headerRecognized: boolean;
}

/** 비밀번호로 암호화된 파일인데 비밀번호가 아직 없을 때 던지는 에러 */
export class PasswordRequiredError extends Error {
  constructor() {
    super("이 파일은 비밀번호로 잠겨 있어요.");
    this.name = "PasswordRequiredError";
  }
}

/** 비밀번호를 입력했지만 틀렸을 때 던지는 에러 */
export class WrongPasswordError extends Error {
  constructor() {
    super("비밀번호가 올바르지 않아요.");
    this.name = "WrongPasswordError";
  }
}

const HEADER_ALIASES = {
  date: ["거래일시", "거래일자", "거래일", "이체일시", "날짜", "일자"],
  incomeAmount: ["입금액", "입금", "들어온금액", "입금(원)"],
  expenseAmount: ["출금액", "출금", "나간금액", "출금(원)"],
  unifiedAmount: ["거래금액", "금액", "거래금액(원)"],
  directionLabel: ["구분", "거래구분", "입출금구분", "타입"],
  memo: ["적요", "내용", "거래내용", "메모", "비고", "거래기록사항"],
};

function normalizeHeaderCell(cell: unknown): string {
  return String(cell ?? "")
    .trim()
    .replace(/\s+/g, "");
}

function findHeaderRowIndex(rows: unknown[][]): number {
  const allAliases = Object.values(HEADER_ALIASES).flat();
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i] ?? [];
    const normalized = row.map(normalizeHeaderCell);
    const hits = normalized.filter((cell) => allAliases.some((alias) => cell.includes(alias)));
    if (hits.length >= 2) return i;
  }
  return -1;
}

function matchColumn(headerRow: string[], aliases: string[]): number {
  const normalized = headerRow.map(normalizeHeaderCell);
  return normalized.findIndex((cell) => aliases.some((alias) => cell.includes(alias)));
}

/** 다양한 은행 앱 날짜 포맷을 YYYY-MM-DD로 정규화. 실패 시 null. */
function normalizeDate(raw: unknown): string | null {
  if (raw === undefined || raw === null || raw === "") return null;

  // 엑셀 날짜 시리얼 넘버로 들어오는 경우
  if (typeof raw === "number") {
    const parsed = XLSX.SSF.parse_date_code(raw);
    if (parsed) {
      const mm = String(parsed.m).padStart(2, "0");
      const dd = String(parsed.d).padStart(2, "0");
      return `${parsed.y}-${mm}-${dd}`;
    }
    return null;
  }

  const text = String(raw).trim();
  // 시간 부분 제거 (예: "2026-07-25 14:23:11" -> "2026-07-25")
  const datePart = text.split(/\s+/)[0];

  // YYYYMMDD
  if (/^\d{8}$/.test(datePart)) {
    return `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`;
  }
  // YYYY-MM-DD / YYYY.MM.DD / YYYY/MM/DD
  const m = datePart.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
  if (m) {
    const [, y, mo, d] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

function toNumber(raw: unknown): number {
  if (typeof raw === "number") return raw;
  const cleaned = String(raw ?? "")
    .replace(/[,원\s]/g, "")
    .trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * 엑셀/CSV 파일을 파싱한다.
 *
 * 파일이 비밀번호로 암호화되어 있으면:
 * - password가 없으면 PasswordRequiredError를 던진다 (UI에서 비밀번호 입력창 표시)
 * - password가 틀리면 WrongPasswordError를 던진다 (UI에서 재입력 유도)
 * - password가 맞으면 복호화 후 정상적으로 파싱을 진행한다
 */
export async function parseTransactionFile(file: File, password?: string): Promise<ParseResult> {
  const isCsv = /\.csv$/i.test(file.name);
  let workbook: XLSX.WorkBook;

  if (isCsv) {
    const text = await file.text();
    workbook = XLSX.read(text, { type: "string" });
  } else {
    const arrayBuffer = await file.arrayBuffer();
    let buffer: Buffer = Buffer.from(arrayBuffer);

    if (officeCrypto.isEncrypted(buffer)) {
      if (!password) {
        throw new PasswordRequiredError();
      }
      try {
        buffer = await officeCrypto.decrypt(buffer, { password });
      } catch {
        throw new WrongPasswordError();
      }
    }

    workbook = XLSX.read(buffer, { type: "buffer" });
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const grid: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });

  const headerIdx = findHeaderRowIndex(grid);
  const headerRecognized = headerIdx !== -1;
  const headerRow = (headerRecognized ? grid[headerIdx] : grid[0] ?? []).map((c) => normalizeHeaderCell(c));
  const dataRows = grid.slice(headerRecognized ? headerIdx + 1 : 1);

  const colDate = matchColumn(headerRow, HEADER_ALIASES.date);
  const colIncome = matchColumn(headerRow, HEADER_ALIASES.incomeAmount);
  const colExpense = matchColumn(headerRow, HEADER_ALIASES.expenseAmount);
  const colUnifiedAmount = matchColumn(headerRow, HEADER_ALIASES.unifiedAmount);
  const colDirection = matchColumn(headerRow, HEADER_ALIASES.directionLabel);
  const colMemo = matchColumn(headerRow, HEADER_ALIASES.memo);

  const rows: StagedTransactionRow[] = [];
  let seq = 0;

  for (const row of dataRows) {
    if (!row || row.every((cell) => cell === "" || cell === undefined || cell === null)) continue;

    let type: TransactionType | null = null;
    let amount = 0;

    if (colIncome !== -1 || colExpense !== -1) {
      const incomeVal = colIncome !== -1 ? toNumber(row[colIncome]) : 0;
      const expenseVal = colExpense !== -1 ? toNumber(row[colExpense]) : 0;
      if (incomeVal > 0) {
        type = "income";
        amount = incomeVal;
      } else if (expenseVal > 0) {
        type = "expense";
        amount = expenseVal;
      }
    } else if (colUnifiedAmount !== -1) {
      const raw = toNumber(row[colUnifiedAmount]);
      if (colDirection !== -1) {
        const label = String(row[colDirection] ?? "");
        type = label.includes("출금") || label.includes("지출") ? "expense" : "income";
        amount = Math.abs(raw);
      } else {
        type = raw < 0 ? "expense" : "income";
        amount = Math.abs(raw);
      }
    }

    if (type === null || amount <= 0) continue;

    const normalizedDate = colDate !== -1 ? normalizeDate(row[colDate]) : null;
    const memo = colMemo !== -1 ? String(row[colMemo] ?? "").trim() : "";

    rows.push({
      key: `import-${++seq}`,
      date: normalizedDate ?? todayISO(),
      dateRecognized: normalizedDate !== null,
      type,
      category: type === "income" ? "회비" : "기타",
      amount,
      memo,
      isDuplicate: false,
      include: true,
    });
  }

  return { rows, headerRecognized };
}

/** 기존 거래내역과 (날짜+금액+구분) 기준으로 겹치는 행을 표시하고, 중복 건은 기본적으로 체크 해제 */
export function markDuplicates(
  rows: StagedTransactionRow[],
  existing: Transaction[],
): StagedTransactionRow[] {
  const existingKeys = new Set(existing.map((t) => `${t.date}|${t.amount}|${t.type}`));
  return rows.map((row) => {
    const isDuplicate = existingKeys.has(`${row.date}|${row.amount}|${row.type}`);
    return { ...row, isDuplicate, include: !isDuplicate };
  });
}
