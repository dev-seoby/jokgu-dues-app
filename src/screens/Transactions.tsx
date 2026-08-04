import { useMemo, useState } from "react";
import { Top } from "@toss/tds-mobile";
import type { Transaction, TransactionType } from "../data/mock";
import { won } from "../data/mock";
import { AddTransactionModal } from "../components/AddTransactionModal";
import "./Transactions.css";

type Filter = "all" | TransactionType;

const dateLabel = (iso: string) => iso.slice(2).replace(/-/g, ".");

export function Transactions({
  transactions,
  onAddTransaction,
}: {
  transactions: Transaction[];
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [modalType, setModalType] = useState<TransactionType | null>(null);

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [transactions],
  );

  const filtered = sorted.filter((t) => filter === "all" || t.type === filter);

  return (
    <>
      <Top title={<Top.TitleParagraph size={22}>입출금 내역</Top.TitleParagraph>} />

      <div className="tx-page screen-scroll-area">
        <div className="tx-filter-tabs" role="tablist" aria-label="입출금 필터">
          {(["all", "income", "expense"] as Filter[]).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              className={`tx-filter-tab ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "전체" : f === "income" ? "입금" : "출금"}
            </button>
          ))}
        </div>

        <ul className="tx-list">
          {filtered.map((t) => (
            <li className="tx-item" key={t.id}>
              <span className={`tx-dot ${t.type}`} aria-hidden="true">
                {t.category.slice(0, 1)}
              </span>
              <div className="tx-item-main">
                <span className="tx-category">{t.category}</span>
                <span className="tx-memo">{t.memo}</span>
                <span className="tx-date">{dateLabel(t.date)}</span>
              </div>
              <span className={`tx-amount ${t.type}`}>
                {t.type === "income" ? "+" : "-"}
                {won(t.amount)}
              </span>
            </li>
          ))}
          {filtered.length === 0 && <li className="tx-empty">내역이 없어요</li>}
        </ul>
      </div>

      <button
        className="tx-fab"
        aria-label="거래 추가"
        onClick={() => setModalType("expense")}
      >
        +
      </button>

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
