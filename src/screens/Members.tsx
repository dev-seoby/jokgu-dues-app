import { useMemo, useState } from "react";
import { ActionButton, HStack, Text, TextField } from "@seed-design/react";
import type { Member } from "../data/mock";
import { CURRENT_MONTH, isPaid } from "../data/mock";
import { PageHeader } from "../components/PageHeader";
import { SearchIcon } from "../components/icons";
import "./Members.css";

export function Members({
  members,
  onToggleMonth,
  onBulkSetMonth,
  onAddMember,
  onToggleResting,
  onDeleteMember,
}: {
  members: Member[];
  onToggleMonth: (memberId: string, month: number) => void;
  onBulkSetMonth: (month: number, paid: boolean) => void;
  onAddMember: (name: string) => void;
  onToggleResting: (memberId: string) => void;
  onDeleteMember: (memberId: string) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [newName, setNewName] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);

  const filtered = useMemo(
    () => members.filter((m) => m.name.toLowerCase().includes(keyword.trim().toLowerCase())),
    [members, keyword],
  );

  const activeCount = members.filter((m) => m.status === "active").length;
  const paidCount = members.filter((m) => m.status === "active" && isPaid(m, selectedMonth)).length;

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
        subtitle={`활동 회원 ${activeCount}명 · ${selectedMonth}월 납부 ${paidCount}명`}
        action={
          <HStack gap="x2">
            <ActionButton
              variant="neutralOutline"
              size="medium"
              onClick={() => onBulkSetMonth(selectedMonth, true)}
            >
              {selectedMonth}월 전체 납부처리
            </ActionButton>
            <ActionButton variant="ghost" size="medium" onClick={() => onBulkSetMonth(selectedMonth, false)}>
              전체 취소
            </ActionButton>
          </HStack>
        }
      />

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
          <TextField.Input placeholder="이름 검색" />
        </TextField.Root>

        <HStack gap="x1_5">
          <TextField.Root
            value={newName}
            onValueChange={setNewName}
            className="members-add-input"
          >
            <TextField.Input
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
          <span className="members-col-center">{selectedMonth}월 납부</span>
        </div>
        {filtered.map((m) => {
          const paid = isPaid(m, selectedMonth);
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
                  ✕
                </ActionButton>
              </div>
              <Text textStyle="t3Regular" color="fg.neutralMuted">
                {m.paymentType === "annual_lump" ? "연납" : "월납"}
              </Text>
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
                  variant={paid ? "brandSolid" : "criticalSolid"}
                  disabled={m.paymentType === "annual_lump" || resting}
                  onClick={() => onToggleMonth(m.id, selectedMonth)}
                >
                  {m.paymentType === "annual_lump" ? "연납완료" : resting ? "휴회" : paid ? "납부완료" : "미납"}
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
    </>
  );
}
