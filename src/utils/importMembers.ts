import * as XLSX from "xlsx";
import type { Member, MemberStatus, PaymentType } from "../data/mock";

/**
 * 기존에 운영 중이던 팀의 회원 명단 파일(엑셀/CSV)을 읽어
 * 회원관리에 일괄 등록할 수 있도록 파싱하는 유틸.
 *
 * 팀마다 정리해둔 파일 형식이 제각각이라 (이름만 있는 단순 목록부터
 * 상태/납부방식까지 있는 표까지) 최대한 유연하게 인식하고, 인식이
 * 애매한 값은 미리보기 화면(ImportMembersModal)에서 총무가 직접
 * 확인/수정한 뒤 등록하도록 설계함.
 */

export interface StagedMemberRow {
  key: string;
  name: string;
  status: MemberStatus;
  paymentType: PaymentType;
  /** 이미 등록된 회원과 이름이 같은 경우 */
  isDuplicate: boolean;
  include: boolean;
}

export interface MemberParseResult {
  rows: StagedMemberRow[];
  headerRecognized: boolean;
}

const NAME_ALIASES = ["이름", "성명", "선수명", "회원명", "닉네임"];
const STATUS_ALIASES = ["상태", "활동상태", "활동여부"];
const PAYMENT_TYPE_ALIASES = ["납부방식", "납부구분", "회비방식"];

function normalizeHeaderCell(cell: unknown): string {
  return String(cell ?? "")
    .trim()
    .replace(/\s+/g, "");
}

function matchColumn(headerRow: string[], aliases: string[]): number {
  return headerRow.findIndex((cell) => aliases.some((alias) => cell.includes(alias)));
}

/** 이름 컬럼을 찾을 수 있는 헤더 행을 앞쪽 30줄 안에서 탐색 */
function findHeaderRowIndex(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i] ?? [];
    const normalized = row.map(normalizeHeaderCell);
    if (matchColumn(normalized, NAME_ALIASES) !== -1) return i;
  }
  return -1;
}

function parseStatus(raw: unknown): MemberStatus {
  const text = String(raw ?? "");
  return text.includes("휴") ? "resting" : "active";
}

function parsePaymentType(raw: unknown): PaymentType {
  const text = String(raw ?? "");
  return text.includes("연납") || text.includes("연간") || text.includes("일시납") ? "annual_lump" : "monthly";
}

export async function parseMemberFile(file: File): Promise<MemberParseResult> {
  const isCsv = /\.csv$/i.test(file.name);
  let workbook: XLSX.WorkBook;

  if (isCsv) {
    const text = await file.text();
    workbook = XLSX.read(text, { type: "string" });
  } else {
    const arrayBuffer = await file.arrayBuffer();
    workbook = XLSX.read(arrayBuffer, { type: "array" });
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const grid: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });

  const headerIdx = findHeaderRowIndex(grid);
  const headerRecognized = headerIdx !== -1;

  // 헤더를 못 찾으면 "이름만 한 줄씩 나열된" 단순 목록으로 간주하고
  // 1번째 칸을 이름으로 읽는다.
  const headerRow = (headerRecognized ? grid[headerIdx] : []).map((c) => normalizeHeaderCell(c));
  const dataRows = grid.slice(headerRecognized ? headerIdx + 1 : 0);

  const colName = headerRecognized ? matchColumn(headerRow, NAME_ALIASES) : 0;
  const colStatus = headerRecognized ? matchColumn(headerRow, STATUS_ALIASES) : -1;
  const colPaymentType = headerRecognized ? matchColumn(headerRow, PAYMENT_TYPE_ALIASES) : -1;

  const rows: StagedMemberRow[] = [];
  let seq = 0;
  const seenNames = new Set<string>();

  for (const row of dataRows) {
    if (!row || row.every((cell) => cell === "" || cell === undefined || cell === null)) continue;

    const name = String(row[colName] ?? "").trim();
    if (!name) continue;
    // 같은 파일 안에서 중복된 이름은 한 번만
    if (seenNames.has(name)) continue;
    seenNames.add(name);

    rows.push({
      key: `import-member-${++seq}`,
      name,
      status: colStatus !== -1 ? parseStatus(row[colStatus]) : "active",
      paymentType: colPaymentType !== -1 ? parsePaymentType(row[colPaymentType]) : "monthly",
      isDuplicate: false,
      include: true,
    });
  }

  return { rows, headerRecognized };
}

/** 이미 등록된 회원과 이름이 같은 행을 표시하고, 중복 건은 기본적으로 체크 해제 */
export function markDuplicateMembers(rows: StagedMemberRow[], existing: Member[]): StagedMemberRow[] {
  const existingNames = new Set(existing.map((m) => m.name.trim()));
  return rows.map((row) => {
    const isDuplicate = existingNames.has(row.name);
    return { ...row, isDuplicate, include: !isDuplicate };
  });
}
