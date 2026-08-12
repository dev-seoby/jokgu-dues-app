import { useMemo, useState } from "react";
import { ActionButton, Text } from "@seed-design/react";
import type { Member, Transaction } from "../data/mock";
import { won, isPaid, CURRENT_MONTH, CURRENT_YEAR, EXPENSE_CATEGORIES } from "../data/mock";
import { PageHeader } from "../components/PageHeader";
import "./Report.css";

const MIN_YEAR = 2026; // 대시보드 도입 연도

type MonthOrTotal = number | "total";

function monthCellStatus(
  member: Member,
  year: number,
  month: number,
): "paid" | "unpaid" | "resting" | "future" {
  if (member.status === "resting") return "resting";
  if (isPaid(member, year, month)) return "paid";
  if (year > CURRENT_YEAR || (year === CURRENT_YEAR && month > CURRENT_MONTH)) return "future";
  return "unpaid";
}

export function Report({ transactions, members }: { transactions: Transaction[]; members: Member[] }) {
  const [selectedMonth, setSelectedMonth] = useState<MonthOrTotal>(CURRENT_MONTH);
  const [gridYear, setGridYear] = useState(CURRENT_YEAR);

  const totalIncome = useMemo(
    () => transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [transactions],
  );
  const totalExpense = useMemo(
    () => transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [transactions],
  );
  const balance = totalIncome - totalExpense;

  const sortedMembers = useMemo(
    () =>
      [...members].sort((a, b) => {
        if (a.status !== b.status) return a.status === "active" ? -1 : 1;
        return a.name.localeCompare(b.name, "ko");
      }),
    [members],
  );

  const canGoPrevYear = gridYear > MIN_YEAR;
  const canGoNextYear = gridYear < CURRENT_YEAR + 1;

  const activeMembers = useMemo(() => members.filter((mm) => mm.status === "active"), [members]);
  // Total 선택 시에도 미납 회원 목록은 이번 달 기준을 그대로 유지 (지출 카테고리만 전체 기간으로 확장)
  const unpaidListMonth = selectedMonth === "total" ? CURRENT_MONTH : selectedMonth;
  const unpaidMembers = useMemo(
    () => activeMembers.filter((mm) => !isPaid(mm, CURRENT_YEAR, unpaidListMonth)),
    [activeMembers, unpaidListMonth],
  );

  const categorySpend = useMemo(() => {
    const relevantTx =
      selectedMonth === "total"
        ? transactions.filter((t) => t.type === "expense")
        : transactions.filter(
            (t) => t.type === "expense" && t.date.startsWith(`${CURRENT_YEAR}-${String(selectedMonth).padStart(2, "0")}`),
          );
    const byCategory = EXPENSE_CATEGORIES.map((category) => ({
      category,
      amount: relevantTx.filter((t) => t.category === category).reduce((s, t) => s + t.amount, 0),
    })).filter((c) => c.amount > 0);
    const max = Math.max(1, ...byCategory.map((c) => c.amount));
    return byCategory
      .map((c) => ({ ...c, ratio: c.amount / max }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, selectedMonth]);

  const periodLabel = selectedMonth === "total" ? "지금까지 전체" : `${selectedMonth}월`;

  return (
    <>
      <PageHeader title="리포트" subtitle={`하루FC 회비 · ${periodLabel} 기준`} />

      <div className="report-summary-cards">
        <div className="report-summary-card">
          <Text textStyle="t3Medium" color="fg.neutralMuted">
            총 입금 (누적)
          </Text>
          <Text textStyle="t6Bold" color="fg.brand">
            {won(totalIncome)}
          </Text>
        </div>
        <div className="report-summary-card">
          <Text textStyle="t3Medium" color="fg.neutralMuted">
            총 출금 (누적)
          </Text>
          <Text textStyle="t6Bold" color="fg.critical">
            {won(totalExpense)}
          </Text>
        </div>
        <div className="report-summary-card highlight">
          <Text textStyle="t3Medium" color="fg.neutralMuted">
            잔액
          </Text>
          <Text textStyle="t6Bold" color="fg.neutral">
            {won(balance)}
          </Text>
        </div>
      </div>

      <section className="report-section">
        <div className="section-header-row">
          <Text as="h2" textStyle="t5Bold" color="fg.neutral">
            회원별 월간 납부 현황
          </Text>
          <div className="year-stepper">
            <ActionButton
              size="xsmall"
              variant="ghost"
              layout="iconOnly"
              aria-label="이전 연도"
              disabled={!canGoPrevYear}
              onClick={() => setGridYear((y) => y - 1)}
            >
              ‹
            </ActionButton>
            <Text textStyle="t3Bold" color="fg.neutral" className="year-stepper-label">
              {gridYear}년
            </Text>
            <ActionButton
              size="xsmall"
              variant="ghost"
              layout="iconOnly"
              aria-label="다음 연도"
              disabled={!canGoNextYear}
              onClick={() => setGridYear((y) => y + 1)}
            >
              ›
            </ActionButton>
          </div>
        </div>

        <div className="payment-grid-legend">
          <span className="legend-item"><i className="legend-dot paid" />납부완료</span>
          <span className="legend-item"><i className="legend-dot unpaid" />미납</span>
          <span className="legend-item"><i className="legend-dot resting" />휴회</span>
          <span className="legend-item"><i className="legend-dot future" />예정</span>
        </div>

        <div className="payment-grid-scroll">
          <div className="payment-grid">
            <div className="payment-grid-header">
              <span className="payment-grid-name-col">회원 ({sortedMembers.length}명)</span>
              <div className="payment-grid-months">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <span
                    key={month}
                    className={gridYear === CURRENT_YEAR && month === CURRENT_MONTH ? "current-month" : ""}
                  >
                    {month}월
                  </span>
                ))}
              </div>
              <span className="payment-grid-ratio-col">납부율</span>
            </div>
            <div className="payment-grid-body">
              {sortedMembers.map((member, idx) => {
                const isResting = member.status === "resting";
                const paidCount = Array.from({ length: 12 }, (_, i) => i + 1).filter(
                  (month) => monthCellStatus(member, gridYear, month) === "paid",
                ).length;
                return (
                  <div className={`payment-grid-row ${idx % 2 === 1 ? "alt" : ""}`} key={member.id}>
                    <div className="payment-grid-name-cell">
                      <span className={`payment-grid-avatar ${isResting ? "resting" : ""}`}>
                        {member.name.slice(0, 1)}
                      </span>
                      <Text textStyle="t3Medium" color="fg.neutral" className="payment-grid-name">
                        {member.name}
                      </Text>
                      {isResting && <span className="resting-badge">휴회</span>}
                    </div>
                    <div className="payment-grid-bar">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                        const status = monthCellStatus(member, gridYear, month);
                        const isCurrent = gridYear === CURRENT_YEAR && month === CURRENT_MONTH;
                        return (
                          <div
                            key={month}
                            className={`payment-cell ${status} ${isCurrent ? "current-month" : ""}`}
                            title={`${member.name} · ${gridYear}년 ${month}월 · ${
                              status === "paid"
                                ? "납부완료"
                                : status === "resting"
                                  ? "휴회"
                                  : status === "future"
                                    ? "예정"
                                    : "미납"
                            }`}
                          >
                            {status === "paid" && <span className="payment-cell-check">✓</span>}
                          </div>
                        );
                      })}
                    </div>
                    <Text
                      textStyle="t4Bold"
                      color={isResting ? "fg.neutralMuted" : paidCount === 12 ? "fg.brand" : "fg.neutralMuted"}
                      className="payment-grid-ratio"
                    >
                      {isResting ? "휴회" : `${paidCount}/12`}
                    </Text>
                  </div>
                );
              })}
              {sortedMembers.length === 0 && (
                <Text textStyle="t4Regular" color="fg.neutralMuted">
                  등록된 회원이 없어요
                </Text>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="report-section month-tabs-wrap">
        <div className="month-tabs" role="tablist" aria-label="기간 선택">
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
          <button
            role="tab"
            aria-selected={selectedMonth === "total"}
            className={`month-tab month-tab-total ${selectedMonth === "total" ? "active" : ""}`}
            onClick={() => setSelectedMonth("total")}
          >
            Total
          </button>
        </div>
      </section>

      <div className="report-columns">
        <section className="report-section">
          <div className="section-header-row">
            <Text as="h2" textStyle="t5Bold" color="fg.neutral">
              {`${unpaidListMonth}월 미납 회원`}
            </Text>
            <Text textStyle="t4Bold" color="fg.critical">
              {unpaidMembers.length}명
            </Text>
          </div>
          <div className="unpaid-list">
            {unpaidMembers.map((mm) => (
              <span className="unpaid-pill" key={mm.id}>
                {mm.name}
              </span>
            ))}
            {unpaidMembers.length === 0 && (
              <Text textStyle="t4Regular" color="fg.neutralMuted">
                전원 납부 완료했어요
              </Text>
            )}
          </div>
        </section>

        <section className="report-section">
          <Text as="h2" textStyle="t5Bold" color="fg.neutral">
            {selectedMonth === "total" ? "전체 기간 카테고리별 지출" : `${selectedMonth}월 카테고리별 지출`}
          </Text>
          <div className="category-list">
            {categorySpend.map(({ category, amount, ratio }) => (
              <div className="category-row" key={category}>
                <div className="category-row-top">
                  <Text textStyle="t4Regular" color="fg.neutral">
                    {category}
                  </Text>
                  <Text textStyle="t4Medium" color="fg.critical">
                    {won(amount)}
                  </Text>
                </div>
                <div className="category-track">
                  <div className="category-bar" style={{ width: `${ratio * 100}%` }} />
                </div>
              </div>
            ))}
            {categorySpend.length === 0 && (
              <Text textStyle="t4Regular" color="fg.neutralMuted">
                지출 내역이 없어요
              </Text>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
