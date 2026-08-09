import { useMemo, useState } from "react";
import { ActionButton, HStack, Text, VStack } from "@seed-design/react";
import type { Member, Transaction } from "../data/mock";
import { won, isPaid, CURRENT_MONTH, CURRENT_YEAR } from "../data/mock";
import { AddTransactionModal } from "../components/AddTransactionModal";
import { PageHeader } from "../components/PageHeader";
import type { TabKey } from "../App";
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
    () => transactions.reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0),
    [transactions],
  );

  const thisMonth = useMemo(
    () => transactions.filter((t) => t.date.startsWith(`${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, "0")}`)),
    [transactions],
  );
  const monthIncome = thisMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = thisMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const recent = [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6);

  const activeMembersList = members.filter((m) => m.status === "active");
  const unpaidCount = activeMembersList.filter((m) => !isPaid(m, CURRENT_MONTH)).length;
  const total = activeMembersList.length;
  const paidRatio = total === 0 ? 0 : Math.round(((total - unpaidCount) / total) * 100);

  return (
    <>
      <PageHeader
        title="홈"
        subtitle="하루FC 회비 현황을 한눈에 확인하세요"
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

      <div className="home-stat-grid">
        <div className="stat-card highlight">
          <Text textStyle="t3Medium" color="fg.neutralMuted">
            모임 잔액
          </Text>
          <Text textStyle="t8Bold" color="fg.neutral">
            {won(balance)}
          </Text>
        </div>
        <div className="stat-card">
          <Text textStyle="t3Medium" color="fg.neutralMuted">
            이번달 입금
          </Text>
          <Text textStyle="t6Bold" color="fg.brand">
            {won(monthIncome)}
          </Text>
        </div>
        <div className="stat-card">
          <Text textStyle="t3Medium" color="fg.neutralMuted">
            이번달 출금
          </Text>
          <Text textStyle="t6Bold" color="fg.critical">
            {won(monthExpense)}
          </Text>
        </div>
      </div>

      <div className="home-columns">
        <VStack gap="x3" className="home-col-main">
          <HStack justify="space-between" align="center">
            <Text textStyle="t5Bold" color="fg.neutral">
              최근 내역
            </Text>
            <ActionButton variant="ghost" size="small" onClick={() => onNavigate("transactions")}>
              전체보기
            </ActionButton>
          </HStack>
          <div className="recent-list">
            {recent.map((t) => (
              <div key={t.id} className="recent-row">
                <div>
                  <Text textStyle="t4Medium" color="fg.neutral">
                    {t.category}
                  </Text>
                  <Text textStyle="t3Regular" color="fg.neutralMuted" style={{ display: "block" }}>
                    {t.memo}
                  </Text>
                </div>
                <div className="recent-row-side">
                  <Text textStyle="t4Bold" color={t.type === "income" ? "fg.brand" : "fg.critical"}>
                    {t.type === "income" ? "+" : "-"}
                    {won(t.amount)}
                  </Text>
                  <Text textStyle="t2Regular" color="fg.neutralMuted">
                    {dateLabel(t.date)}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </VStack>

        <VStack gap="x3" className="home-col-side">
          <Text textStyle="t5Bold" color="fg.neutral">
            이번달 미납 현황
          </Text>
          <div className="unpaid-card">
            <div className="unpaid-progress-track">
              <div className="unpaid-progress-fill" style={{ width: `${paidRatio}%` }} />
            </div>
            <Text textStyle="t4Medium" color="fg.neutral">
              {total - unpaidCount}/{total}명 납부완료 ({paidRatio}%)
            </Text>
            <ActionButton variant="neutralWeak" size="small" onClick={() => onNavigate("members")}>
              회원관리에서 보기
            </ActionButton>
          </div>
        </VStack>
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
