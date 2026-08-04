import { useMemo, useState } from "react";
import { ActionButton, HStack, Text, TextField } from "@seed-design/react";
import type { Transaction, TransactionType } from "../data/mock";
import { won } from "../data/mock";
import { AddTransactionModal } from "../components/AddTransactionModal";
import { PageHeader } from "../components/PageHeader";
import { SearchIcon } from "../components/icons";
import "./Transactions.css";

type FilterType = "all" | TransactionType;

const dateLabel = (iso: string) => iso.slice(2).replace(/-/g, ".");

export function Transactions({
  transactions,
  onAddTransaction,
}: {
  transactions: Transaction[];
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
}) {
  const [modalType, setModalType] = useState<"income" | "expense" | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [keyword, setKeyword] = useState("");

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
          <TextField.Input placeholder="항목, 메모 검색" />
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
          <div className="tx-table-row" key={t.id}>
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
          </div>
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
    </>
  );
}
