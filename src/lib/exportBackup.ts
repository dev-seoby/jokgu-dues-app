import * as XLSX from "xlsx";
import type { Member, Transaction } from "../data/mock";

/**
 * 데이터 내보내기(수동 백업)
 *
 * Supabase가 유일한 저장소가 되면서 생기는 리스크(장애/실수 삭제 등)에 대비한
 * 최후의 안전판. 현재 화면에 로드된 회원/거래 데이터를 엑셀 파일로 다운로드함.
 * 별도 서버 없이 브라우저에서 바로 파일을 만들어 저장하는 방식.
 */
export function exportBackup(members: Member[], transactions: Transaction[]) {
  const memberRows = members.map((m) => ({
    이름: m.name,
    상태: m.status === "active" ? "활동" : "휴회",
    납부방식: m.paymentType === "annual_lump" ? "연납" : "월납",
    "납부완료 연월(쉼표구분)": [...m.paidYearMonths].sort().join(", "),
  }));

  const transactionRows = transactions.map((t) => ({
    날짜: t.date,
    구분: t.type === "income" ? "입금" : "출금",
    항목: t.category,
    금액: t.amount,
    메모: t.memo,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(memberRows), "회원");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(transactionRows), "거래내역");

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `하루FC_백업_${today}.xlsx`);
}
