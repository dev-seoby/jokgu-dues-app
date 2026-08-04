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
}: {
  members: Member[];
  onToggleMonth: (memberId: string, month: number) => void;
  onBulkSetMonth: (month: number, paid: boolean) => void;
  onAddMember: (name: string) => void;
  onToggleResting: (memberId: string) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [newName, setNewName] = useState("");

  const filtered = useMemo(
    () => members.filter((m) => m.name.toLowerCase().includes(keyword.trim().toLowerCase())),
    [members, keyword],
  );

  const activeCount = members.filter((m) => m.status === "active").length;
  const paidCount = members.filter((m) => m.status === "active" && isPaid(m, CURRENT_MONTH)).length;

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onAddMember(name);
    setNewName("");
  };

  return (
    <>
      <PageHeader
        title="회원관리"
        subtitle={`활동 회원 ${activeCount}명 · ${CURRENT_MONTH}월 납부 ${paidCount}명`}
        action={
          <HStack gap="x2">
            <ActionButton variant="neutralOutline" size="medium" onClick={() => onBulkSetMonth(CURRENT_MONTH, true)}>
              {CURRENT_MONTH}월 전체 납부처리
            </ActionButton>
            <ActionButton variant="ghost" size="medium" onClick={() => onBulkSetMonth(CURRENT_MONTH, false)}>
              전체 취소
            </ActionButton>
          </HStack>
        }
      />

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
          <span>결제방식</span>
          <span>상태</span>
          <span className="members-col-center">{CURRENT_MONTH}월 납부</span>
        </div>
        {filtered.map((m) => {
          const paid = isPaid(m, CURRENT_MONTH);
          const resting = m.status === "resting";
          return (
            <div className={`members-table-row ${resting ? "is-resting" : ""}`} key={m.id}>
              <Text textStyle="t4Medium" color="fg.neutral">
                {m.name}
              </Text>
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
                  onClick={() => onToggleMonth(m.id, CURRENT_MONTH)}
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
