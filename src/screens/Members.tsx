import { useMemo, useState } from "react";
import { Top } from "@toss/tds-mobile";
import type { Member } from "../data/mock";
import { CURRENT_MONTH, isPaid } from "../data/mock";
import "./Members.css";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

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
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");

  const activeCount = members.filter((m) => m.status === "active").length;
  const restingCount = members.length - activeCount;
  const paidCount = members.filter((m) => m.status === "active" && isPaid(m, CURRENT_MONTH)).length;
  const ratio = activeCount === 0 ? 0 : Math.round((paidCount / activeCount) * 100);

  const filtered = useMemo(
    () => members.filter((m) => m.name.includes(search.trim())),
    [members, search],
  );

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onAddMember(name);
    setNewName("");
  };

  const handleBulk = (paid: boolean) => {
    const ok = window.confirm(
      `${activeCount}명 전원의 ${CURRENT_MONTH}월 납부 상태를 ${
        paid ? "전체 납부완료" : "전체 초기화"
      } 처리할까요? 이 작업은 되돌리기 번거로워요.`,
    );
    if (ok) onBulkSetMonth(CURRENT_MONTH, paid);
  };

  return (
    <>
      <Top title={<Top.TitleParagraph size={22}>회원 관리</Top.TitleParagraph>} />

      <div className="member-page screen-scroll-area">
        <section className="member-summary">
          <div className="member-summary-row">
            <span>
              {CURRENT_MONTH}월 납부 현황 (휴식 {restingCount}명 제외)
            </span>
            <strong>
              {paidCount}/{activeCount}명 · {ratio}%
            </strong>
          </div>
          <div className="member-progress-track">
            <div className="member-progress-fill" style={{ width: `${ratio}%` }} />
          </div>
        </section>

        <div className="member-inputs">
          <input
            className="member-search"
            type="text"
            placeholder="회원 이름 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="member-add-row">
            <input
              type="text"
              placeholder="새 회원 이름"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button onClick={handleAdd} disabled={!newName.trim()}>
              추가
            </button>
          </div>
        </div>

        <div className="member-bulk-row">
          <button className="bulk-btn" onClick={() => handleBulk(true)}>
            이번달 전체 납부완료
          </button>
          <button className="bulk-btn danger" onClick={() => handleBulk(false)}>
            이번달 전체 초기화
          </button>
        </div>

        <div className="member-grid-scroll">
          <div className="member-grid">
            <div className="member-grid-header">
              <span className="member-grid-name-col">이름</span>
              {MONTHS.map((mo) => (
                <span key={mo} className={`member-grid-month-col ${mo === CURRENT_MONTH ? "current" : ""}`}>
                  {mo}
                </span>
              ))}
            </div>
            {filtered.map((member) => (
              <div className="member-grid-row" key={member.id}>
                <div className="member-grid-name-col">
                  <span>{member.name}</span>
                  {member.status === "resting" && <span className="member-badge resting">휴식</span>}
                  {member.paymentType === "annual_lump" && (
                    <span className="member-badge lump">연납</span>
                  )}
                </div>
                {MONTHS.map((mo) => {
                  const paid = isPaid(member, mo);
                  const locked = member.status === "resting" || member.paymentType === "annual_lump";
                  return (
                    <button
                      key={mo}
                      className={`member-grid-cell ${paid ? "paid" : ""} ${locked ? "locked" : ""}`}
                      disabled={locked}
                      onClick={() => onToggleMonth(member.id, mo)}
                      aria-label={`${member.name} ${mo}월 ${paid ? "납부완료" : "미납"}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="scroll-fade left" aria-hidden="true" />
          <div className="scroll-fade right" aria-hidden="true" />
        </div>

        <section className="section">
          <h2 className="section-title">회원 상태 변경</h2>
          <ul className="member-status-list">
            {filtered.map((member) => (
              <li key={member.id} className="member-status-row">
                <span>{member.name}</span>
                <button className="status-toggle-btn" onClick={() => onToggleResting(member.id)}>
                  {member.status === "resting" ? "휴식 해제" : "휴식 전환"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
