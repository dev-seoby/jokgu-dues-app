import { useMemo, useState } from "react";
import { ActionButton, HStack, Icon, Text, TextField } from "@seed-design/react";
import type { Member } from "../data/mock";
import { CURRENT_MONTH, CURRENT_YEAR, isPaid, isYearFullyPaid } from "../data/mock";
import { PageHeader } from "../components/PageHeader";
import { ImportMembersModal } from "../components/ImportMembersModal";
import { CloseIcon, SearchIcon } from "../components/icons";
import "./Members.css";

const MIN_YEAR = 2026; // 대시보드 도입 연도 — 그 이전은 이 시스템으로 관리한 적이 없어서 조회 의미가 없음

export function Members({
  members,
  onToggleMonth,
  onBulkSetMonth,
  onToggleAnnualLump,
  onAddMember,
  onImportMembers,
  onToggleResting,
  onDeleteMember,
  onTogglePaymentType,
}: {
  members: Member[];
  onToggleMonth: (memberId: string, year: number, month: number) => void;
  onBulkSetMonth: (year: number, month: number, paid: boolean) => void;
  onToggleAnnualLump: (memberId: string, year: number) => void;
  onAddMember: (name: string) => void;
  onImportMembers: (members: { name: string; status: Member["status"]; paymentType: Member["paymentType"] }[]) => void;
  onToggleResting: (memberId: string) => void;
  onDeleteMember: (memberId: string) => void;
  onTogglePaymentType: (memberId: string) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [newName, setNewName] = useState("");
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = useMemo(
    () => members.filter((m) => m.name.toLowerCase().includes(keyword.trim().toLowerCase())),
    [members, keyword],
  );

  const activeCount = members.filter((m) => m.status === "active").length;
  const paidCount = members.filter((m) => m.status === "active" && isPaid(m, selectedYear, selectedMonth)).length;

  const canGoPrevYear = selectedYear > MIN_YEAR;
  const canGoNextYear = selectedYear < CURRENT_YEAR + 1;

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onAddMember(name);
    setNewName("");
  };

  const handleDelete = (member: Member) => {
    if (window.confirm(`${member.name} 님을 회원 목록에서 삭제할까요?\n납부 이력도 함께 삭제돼요.`)) {
      onDeleteMember(member.id);
    }
  };

  return (
    <>
      <PageHeader
        title="회원관리"
        subtitle={`활동 회원 ${activeCount}명 · ${selectedYear}년 ${selectedMonth}월 납부 ${paidCount}명`}
        action={
          <HStack gap="x2">
            <ActionButton variant="ghost" size="medium" onClick={() => setImportOpen(true)}>
              명단 업로드
            </ActionButton>
            <ActionButton
              variant="neutralOutline"
              size="medium"
              onClick={() => onBulkSetMonth(selectedYear, selectedMonth, true)}
            >
              {selectedMonth}월 전체 납부처리
            </ActionButton>
            <ActionButton
              variant="ghost"
              size="medium"
              onClick={() => onBulkSetMonth(selectedYear, selectedMonth, false)}
            >
              전체 취소
            </ActionButton>
          </HStack>
        }
      />

      <div className="year-stepper">
        <ActionButton
          size="xsmall"
          variant="ghost"
          layout="iconOnly"
          aria-label="이전 연도"
          disabled={!canGoPrevYear}
          onClick={() => setSelectedYear((y) => y - 1)}
        >
          ‹
        </ActionButton>
        <Text textStyle="t3Bold" color="fg.neutral" className="year-stepper-label">
          {selectedYear}년
        </Text>
        <ActionButton
          size="xsmall"
          variant="ghost"
          layout="iconOnly"
          aria-label="다음 연도"
          disabled={!canGoNextYear}
          onClick={() => setSelectedYear((y) => y + 1)}
        >
          ›
        </ActionButton>
        {selectedYear !== CURRENT_YEAR && (
          <ActionButton size="xsmall" variant="ghost" onClick={() => setSelectedYear(CURRENT_YEAR)}>
            올해로
          </ActionButton>
        )}
      </div>

      <div className="month-tabs-wrap">
        <div className="month-tabs" role="tablist" aria-label="월 선택">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
            <button
              key={month}
              role="tab"
              aria-selected={month === selectedMonth}
              className={`month-tab ${month === selectedMonth ? "active" : ""}`}
              onClick={() => setSelectedMonth(month)}
            >
              {month}월
            </button>
          ))}
        </div>
      </div>

      <div className="members-toolbar">
        <TextField.Root value={keyword} onValueChange={setKeyword} className="members-search">
          <TextField.PrefixIcon svg={<SearchIcon />} />
          <TextField.Input aria-label="회원 이름 검색" placeholder="이름 검색" />
        </TextField.Root>

        <HStack gap="x1_5">
          <TextField.Root
            value={newName}
            onValueChange={setNewName}
            className="members-add-input"
          >
            <TextField.Input
              aria-label="새 회원 이름"
              placeholder="새 회원 이름"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
          </TextField.Root>
          <ActionButton variant="neutralSolid" size="medium" onClick={handleAdd}>
            회원 추가
          </ActionButton>
        </HStack>
      </div>

      <div className="members-table">
        <div className="members-table-head">
          <span>이름</span>
          <span>납부방식</span>
          <span>상태</span>
          <span className="members-col-center">
            {selectedYear}년 {selectedMonth}월 납부
          </span>
        </div>
        {filtered.map((m) => {
          const isAnnual = m.paymentType === "annual_lump";
          const paid = isPaid(m, selectedYear, selectedMonth);
          const annualPaidThisYear = isYearFullyPaid(m, selectedYear);
          const resting = m.status === "resting";
          return (
            <div className={`members-table-row ${resting ? "is-resting" : ""}`} key={m.id}>
              <div className="members-name-cell">
                <Text textStyle="t4Medium" color="fg.neutral">
                  {m.name}
                </Text>
                <ActionButton
                  size="xsmall"
                  variant="ghost"
                  layout="iconOnly"
                  aria-label={`${m.name} 삭제`}
                  className="members-delete-btn"
                  onClick={() => handleDelete(m)}
                >
                  <Icon svg={<CloseIcon />} />
                </ActionButton>
              </div>
              <ActionButton
                size="xsmall"
                variant={isAnnual ? "brandSolid" : "neutralOutline"}
                onClick={() => onTogglePaymentType(m.id)}
              >
                {isAnnual ? "연납" : "월납"}
              </ActionButton>
              <ActionButton
                size="xsmall"
                variant={resting ? "neutralOutline" : "neutralWeak"}
                onClick={() => onToggleResting(m.id)}
              >
                {resting ? "휴회" : "활동"}
              </ActionButton>
              <div className="members-col-center">
                <ActionButton
                  size="xsmall"
                  variant={(isAnnual ? annualPaidThisYear : paid) ? "brandSolid" : "criticalSolid"}
                  disabled={resting}
                  onClick={() =>
                    isAnnual
                      ? onToggleAnnualLump(m.id, selectedYear)
                      : onToggleMonth(m.id, selectedYear, selectedMonth)
                  }
                >
                  {resting
                    ? "휴회"
                    : isAnnual
                      ? annualPaidThisYear
                        ? "연납완료"
                        : `${selectedYear}년 연납대기`
                      : paid
                        ? "납부완료"
                        : "미납"}
                </ActionButton>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="members-empty">
            <Text textStyle="t4Regular" color="fg.neutralMuted">
              검색 결과가 없어요
            </Text>
          </div>
        )}
      </div>

      {importOpen && (
        <ImportMembersModal
          existingMembers={members}
          onClose={() => setImportOpen(false)}
          onImport={onImportMembers}
        />
      )}
    </>
  );
}
