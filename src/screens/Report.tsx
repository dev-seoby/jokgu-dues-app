import { useMemo, useState } from "react";
import { Text } from "@seed-design/react";
import type { Member, Transaction } from "../data/mock";
import { won, isPaid, CURRENT_MONTH, CURRENT_YEAR, EXPENSE_CATEGORIES } from "../data/mock";
import { PageHeader } from "../components/PageHeader";
import "./Report.css";

export function Report({ transactions, members }: { transactions: Transaction[]; members: Member[] }) {
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);

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
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    return months
      .map((month) => {
        const prefix = `${CURRENT_YEAR}-${String(month).padStart(2, "0")}`;
        const monthTx = transactions.filter((t) => t.date.startsWith(prefix));
        const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        return { month, amount: income - expense, hasData: monthTx.length > 0 };
      })
      .filter((m) => m.hasData || m.month <= CURRENT_MONTH);
  }, [transactions]);

  const maxAbsNet = useMemo(
    () => Math.max(1, ...monthlyNet.map((m) => Math.abs(m.amount))),
    [monthlyNet],
  );

  const activeMembers = useMemo(() => members.filter((mm) => mm.status === "active"), [members]);
  const unpaidMembers = useMemo(
    () => activeMembers.filter((mm) => !isPaid(mm, selectedMonth)),
    [activeMembers, selectedMonth],
  );

  const categorySpend = useMemo(() => {
    const prefix = `${CURRENT_YEAR}-${String(selectedMonth).padStart(2, "0")}`;
    const monthExpenseTx = transactions.filter((t) => t.type === "expense" && t.date.startsWith(prefix));
    const byCategory = EXPENSE_CATEGORIES.map((category) => ({
      category,
      amount: monthExpenseTx.filter((t) => t.category === category).reduce((s, t) => s + t.amount, 0),
    })).filter((c) => c.amount > 0);
    const max = Math.max(1, ...byCategory.map((c) => c.amount));
    return byCategory
      .map((c) => ({ ...c, ratio: c.amount / max }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, selectedMonth]);

  return (
    <>
      <PageHeader title="리포트" subtitle={`하루FC 회비 · ${selectedMonth}월 기준`} />

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
        <Text as="h2" textStyle="t5Bold" color="fg.neutral">
          월별 순증감
        </Text>
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

      <section className="report-section month-tabs-wrap">
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
      </section>

      <div className="report-columns">
        <section className="report-section">
          <div className="section-header-row">
            <Text as="h2" textStyle="t5Bold" color="fg.neutral">
              {selectedMonth}월 미납 회원
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
            {selectedMonth}월 카테고리별 지출
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
