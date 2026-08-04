import { Top } from "@toss/tds-mobile";
import { useMemo, useState } from "react";
import type { Member, Transaction } from "../data/mock";
import { won, isPaid, CURRENT_MONTH } from "../data/mock";
import "./Report.css";

/**
 * 월별 리포트 화면
 *
 * 프론트리드 검토에서 반영한 사항:
 * - 브랜드 강조색은 sky 계열로 고정, red는 미납/지출(음수) 전용 semantic 컬러로만 사용
 * - 월별 순증감 막대그래프에 0 기준선을 명시하고, 음수는 기준선 왼쪽으로 렌더링
 * - 미납 회원 목록은 스크롤 영역(max-height)으로 제한
 * - "총 입금/총 출금"이 연간 누적 기준임을 라벨에 명시
 */

const monthKey = (iso: string) => iso.slice(0, 7); // YYYY-MM
const monthOf = (iso: string) => Number(iso.slice(5, 7));

export function Report({
  transactions,
  members,
}: {
  transactions: Transaction[];
  members: Member[];
}) {
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [showAllUnpaid, setShowAllUnpaid] = useState(false);

  const totalIncome = useMemo(
    () => transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [transactions],
  );
  const totalExpense = useMemo(
    () => transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [transactions],
  );
  const balance = totalIncome - totalExpense;

  const monthlyNet = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const t of transactions) {
      const key = monthKey(t.date);
      const delta = t.type === "income" ? t.amount : -t.amount;
      byMonth.set(key, (byMonth.get(key) ?? 0) + delta);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-5)
      .map(([key, amount]) => ({ month: Number(key.slice(5, 7)), amount }));
  }, [transactions]);

  const maxAbsNet = Math.max(1, ...monthlyNet.map((m) => Math.abs(m.amount)));

  const unpaidMembers = useMemo(
    () =>
      members
        .filter((m) => m.status === "active")
        .filter((m) => !isPaid(m, selectedMonth))
        .map((m) => m.name),
    [members, selectedMonth],
  );
  const visibleUnpaid = showAllUnpaid ? unpaidMembers : unpaidMembers.slice(0, 12);

  const categorySpend = useMemo(() => {
    const byCategory = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "expense" || monthOf(t.date) !== selectedMonth) continue;
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount);
    }
    const entries = Array.from(byCategory.entries()).sort(([, a], [, b]) => b - a);
    const max = entries[0]?.[1] ?? 1;
    return entries.map(([category, amount]) => ({ category, amount, ratio: amount / max }));
  }, [transactions, selectedMonth]);

  return (
    <>
      <Top
        title={<Top.TitleParagraph size={22}>월별 리포트</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            조기축구팀 회비 · {selectedMonth}월 기준
          </Top.SubtitleParagraph>
        }
      />

      <div className="report-page screen-scroll-area">
        <section className="summary-cards">
          <div className="summary-card">
            <span className="summary-label">총 입금 (누적)</span>
            <strong className="summary-value income">{won(totalIncome)}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">총 출금 (누적)</span>
            <strong className="summary-value expense">{won(totalExpense)}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">잔액</span>
            <strong className="summary-value">{won(balance)}</strong>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">월별 순증감</h2>
          <div className="net-chart">
            {monthlyNet.map(({ month, amount }) => {
              const isNegative = amount < 0;
              const widthPct = (Math.abs(amount) / maxAbsNet) * 100;
              return (
                <div className="net-row" key={month}>
                  <span className="net-month">{month}월</span>
                  <div className="net-track">
                    <div className="net-baseline" />
                    <div
                      className={`net-bar ${isNegative ? "negative" : "positive"}`}
                      style={{
                        width: `${widthPct / 2}%`,
                        left: isNegative ? `${50 - widthPct / 2}%` : "50%",
                      }}
                    />
                  </div>
                  <span className={`net-amount ${isNegative ? "negative" : "positive"}`}>
                    {isNegative ? "-" : "+"}
                    {won(Math.abs(amount))}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="section month-tabs-wrap">
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
          <div className="scroll-fade left" aria-hidden="true" />
          <div className="scroll-fade right" aria-hidden="true" />
        </section>

        <section className="section">
          <div className="section-header-row">
            <h2 className="section-title">{selectedMonth}월 미납 회원</h2>
            <span className="unpaid-count">{unpaidMembers.length}명</span>
          </div>
          {unpaidMembers.length === 0 ? (
            <p className="empty-note">미납 회원이 없어요.</p>
          ) : (
            <>
              <div className="unpaid-list">
                {visibleUnpaid.map((name) => (
                  <span className="unpaid-pill" key={name}>
                    {name}
                  </span>
                ))}
              </div>
              {unpaidMembers.length > 12 && (
                <button className="show-more-btn" onClick={() => setShowAllUnpaid((v) => !v)}>
                  {showAllUnpaid ? "접기" : `${unpaidMembers.length - 12}명 더보기`}
                </button>
              )}
            </>
          )}
        </section>

        <section className="section">
          <h2 className="section-title">{selectedMonth}월 카테고리별 지출</h2>
          {categorySpend.length === 0 ? (
            <p className="empty-note">이번 달 지출 내역이 없어요.</p>
          ) : (
            <div className="category-list">
              {categorySpend.map(({ category, amount, ratio }) => (
                <div className="category-row" key={category}>
                  <div className="category-row-top">
                    <span>{category}</span>
                    <span className="category-amount">{won(amount)}</span>
                  </div>
                  <div className="category-track">
                    <div className="category-bar" style={{ width: `${ratio * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
