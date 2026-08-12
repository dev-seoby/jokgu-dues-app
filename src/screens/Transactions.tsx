import { useMemo, useState } from "react";
import { ActionButton, HStack, Text, TextField } from "@seed-design/react";
import type { Member, Transaction, TransactionType } from "../data/mock";
import { won } from "../data/mock";
import { AddTransactionModal } from "../components/AddTransactionModal";
import { EditTransactionModal } from "../components/EditTransactionModal";
import { ImportTransactionsModal } from "../components/ImportTransactionsModal";
import { PageHeader } from "../components/PageHeader";
import { EditIcon, SearchIcon } from "../components/icons";
import "./Transactions.css";

type FilterType = "all" | TransactionType;

const dateLabel = (iso: string) => iso.slice(2).replace(/-/g, ".");

export function Transactions({
  transactions,
  members,
  onAddTransaction,
  onImportTransactions,
  onApplyMemberPayments,
  onUpdateTransaction,
  onDeleteTransaction,
}: {
  transactions: Transaction[];
  members: Member[];
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
  onImportTransactions: (txs: Omit<Transaction, "id">[]) => void;
  onApplyMemberPayments: (updates: { memberId: string; yearMonths: string[] }[]) => void;
  onUpdateTransaction: (id: string, patch: Partial<Omit<Transaction, "id">>) => void;
  onDeleteTransaction: (id: string) => void;
}) {
  const [modalType, setModalType] = useState<"income" | "expense" | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [keyword, setKeyword] = useState("");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    return [...transactions]
      .filter((t) => filter === "all" || t.type === filter)
      .filter((t) => {
        if (!keyword.trim()) return true;
        const k = keyword.trim().toLowerCase();
        return t.category.toLowerCase().includes(k) || t.memo.toLowerCase().includes(k);
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [transactions, filter, keyword]);

  const total = filtered.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);

  return (
    <>
      <PageHeader
        title="거래 내역"
        subtitle="입출금 내역을 조회하고 새 거래를 등록하세요"
        action={
          <HStack gap="x2">
            <ActionButton variant="ghost" size="medium" onClick={() => setImportOpen(true)}>
              엑셀/CSV 업로드
            </ActionButton>
            <ActionButton variant="neutralOutline" size="medium" onClick={() => setModalType("income")}>
              + 입금 추가
            </ActionButton>
            <ActionButton variant="criticalSolid" size="medium" onClick={() => setModalType("expense")}>
              − 출금 추가
            </ActionButton>
          </HStack>
        }
      />

      <div className="tx-toolbar">
        <HStack gap="x1_5">
          <ActionButton
            size="small"
            variant={filter === "all" ? "neutralSolid" : "neutralOutline"}
            onClick={() => setFilter("all")}
          >
            전체
          </ActionButton>
          <ActionButton
            size="small"
            variant={filter === "income" ? "brandSolid" : "neutralOutline"}
            onClick={() => setFilter("income")}
          >
            입금
          </ActionButton>
          <ActionButton
            size="small"
            variant={filter === "expense" ? "criticalSolid" : "neutralOutline"}
            onClick={() => setFilter("expense")}
          >
            출금
          </ActionButton>
        </HStack>

        <TextField.Root value={keyword} onValueChange={setKeyword} className="tx-search">
          <TextField.PrefixIcon svg={<SearchIcon />} />
          <TextField.Input aria-label="거래 내역 검색" placeholder="항목, 메모 검색" />
        </TextField.Root>
      </div>

      <div className="tx-table">
        <div className="tx-table-head">
          <span>날짜</span>
          <span>항목</span>
          <span>메모</span>
          <span className="tx-col-amount">금액</span>
        </div>
        {filtered.map((t) => (
          <button
            type="button"
            className="tx-table-row tx-table-row-editable"
            key={t.id}
            onClick={() => setEditingTransaction(t)}
            aria-label={`${t.date} ${t.category} ${won(t.amount)} 수정`}
          >
            <Text textStyle="t3Regular" color="fg.neutralMuted">
              {dateLabel(t.date)}
            </Text>
            <Text textStyle="t4Medium" color="fg.neutral">
              {t.category}
            </Text>
            <Text textStyle="t3Regular" color="fg.neutralMuted">
              {t.memo}
              {t.receiptImageUrl && " · 영수증 첨부"}
            </Text>
            <Text
              textStyle="t4Bold"
              color={t.type === "income" ? "fg.brand" : "fg.critical"}
              className="tx-col-amount"
            >
              {t.type === "income" ? "+" : "-"}
              {won(t.amount)}
            </Text>
            <span className="tx-row-edit-icon" aria-hidden="true">
              <EditIcon />
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="tx-empty">
            <Text textStyle="t4Regular" color="fg.neutralMuted">
              조건에 맞는 내역이 없어요
            </Text>
          </div>
        )}
      </div>

      <HStack justify="flex-end" style={{ marginTop: 16 }}>
        <Text textStyle="t4Bold" color="fg.neutral">
          합계 {total >= 0 ? "+" : "-"}
          {won(Math.abs(total))}
        </Text>
      </HStack>

      {modalType && (
        <AddTransactionModal
          initialType={modalType}
          onClose={() => setModalType(null)}
          onSubmit={onAddTransaction}
        />
      )}

      {importOpen && (
        <ImportTransactionsModal
          existingTransactions={transactions}
          members={members}
          onClose={() => setImportOpen(false)}
          onImport={onImportTransactions}
          onApplyMemberPayments={onApplyMemberPayments}
        />
      )}

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSave={onUpdateTransaction}
          onDelete={onDeleteTransaction}
        />
      )}
    </>
  );
}
