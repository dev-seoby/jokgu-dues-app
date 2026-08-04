import { useMemo, useState } from "react";
import { Top } from "@toss/tds-mobile";
import type { Member, Transaction } from "../data/mock";
import { won, isPaid, CURRENT_MONTH } from "../data/mock";
import { AddTransactionModal } from "../components/AddTransactionModal";
import type { TabKey } from "../components/BottomNav";
import "./Home.css";

const dateLabel = (iso: string) => iso.slice(2).replace(/-/g, ".");

export function Home({
  transactions,
  members,
  onAddTransaction,
  onNavigate,
}: {
  transactions: Transaction[];
  members: Member[];
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
  onNavigate: (tab: TabKey) => void;
}) {
  const [modalType, setModalType] = useState<"income" | "expense" | null>(null);

  const balance = useMemo(
    () =>
      transactions.reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0),
    [transactions],
  );

  const thisMonth = useMemo(
    () => transactions.filter((t) => t.date.startsWith(`2026-${String(CURRENT_MONTH).padStart(2, "0")}`)),
    [transactions],
  );
  const monthIncome = thisMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = thisMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const recent = [...transactions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  const activeMembersList = members.filter((m) => m.status === "active");
  const unpaidCount = activeMembersList.filter((m) => !isPaid(m, CURRENT_MONTH)).length;
  const total = activeMembersList.length;
  const paidRatio = total === 0 ? 0 : Math.round(((total - unpaidCount) / total) * 100);

  return (
    <>
      <Top
        title={<Top.TitleParagraph size={22}>조기축구팀 회비</Top.TitleParagraph>}
        subtitleBottom={<Top.SubtitleParagraph size={15}>총무 대시보드</Top.SubtitleParagraph>}
      />

      <div className="home-page screen-scroll-area">
        <section className="balance-card">
          <span className="balance-label">모임 잔액</span>
          <strong className="balance-value">{won(balance)}</strong>
          <div className="balance-split">
            <div>
              <span>이번달 입금</span>
              <strong className="income">{won(monthIncome)}</strong>
            </div>
            <div>
              <span>이번달 출금</span>
              <strong className="expense">{won(monthExpense)}</strong>
            </div>
          </div>
        </section>

        <div className="quick-actions">
          <button className="quick-action income" onClick={() => setModalType("income")}>
            + 입금 추가
          </button>
          <button className="quick-action expense" onClick={() => setModalType("expense")}>
            − 출금 추가
          </button>
        </div>

        <section className="section">
          <div className="section-header-row">
            <h2 className="section-title">최근 내역</h2>
            <button className="link-btn" onClick={() => onNavigate("transactions")}>
              전체보기
            </button>
          </div>
          <ul className="recent-list">
            {recent.map((t) => (
              <li key={t.id} className="recent-item">
                <div className="recent-item-main">
                  <span className="recent-category">{t.category}</span>
                  <span className="recent-memo">{t.memo}</span>
                </div>
                <div className="recent-item-side">
                  <span className={`recent-amount ${t.type}`}>
                    {t.type === "income" ? "+" : "-"}
                    {won(t.amount)}
                  </span>
                  <span className="recent-date">{dateLabel(t.date)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="section">
          <div className="section-header-row">
            <h2 className="section-title">이번달 미납 회원</h2>
            <button className="link-btn" onClick={() => onNavigate("members")}>
              자세히 보기
            </button>
          </div>
          <div className="unpaid-progress-row">
            <div className="unpaid-progress-track">
              <div className="unpaid-progress-fill" style={{ width: `${paidRatio}%` }} />
            </div>
            <span className="unpaid-progress-label">{paidRatio}%</span>
          </div>
          <span className="unpaid-progress-sub">
            {total - unpaidCount}/{total}명 납부완료
          </span>
        </section>
      </div>

      {modalType && (
        <AddTransactionModal
          initialType={modalType}
          onClose={() => setModalType(null)}
          onSubmit={onAddTransaction}
        />
      )}
    </>
  );
}
