import { useEffect, useState } from "react";
import { ActionButton, Text } from "@seed-design/react";
import { HomeIcon, TransactionIcon, MembersIcon, ReportIcon } from "./components/icons";
import { TopBar } from "./components/TopBar";
import { Home } from "./screens/Home";
import { Transactions } from "./screens/Transactions";
import { Members } from "./screens/Members";
import { Report } from "./screens/Report";
import { Login } from "./screens/Login";
import type { Member, Transaction } from "./data/mock";
import { yearMonthKey } from "./data/mock";
import { useAuth } from "./hooks/useAuth";
import * as api from "./lib/api";
import { exportBackup } from "./lib/exportBackup";
import "./App.css";

export type TabKey = "home" | "transactions" | "members" | "report";

const NAV_ITEMS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "home", label: "홈", icon: <HomeIcon /> },
  { key: "transactions", label: "거래 내역", icon: <TransactionIcon /> },
  { key: "members", label: "회원관리", icon: <MembersIcon /> },
  { key: "report", label: "리포트", icon: <ReportIcon /> },
];

function App() {
  const { isAuthenticated, loading: authLoading, session, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const loadData = async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const [membersData, transactionsData] = await Promise.all([
        api.fetchMembers(),
        api.fetchTransactions(),
      ]);
      setMembers(membersData);
      setTransactions(transactionsData);
    } catch {
      setDataError("데이터를 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해주세요.");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const reportMutationError = () => {
    window.alert("저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    loadData();
  };

  const handleAddTransaction = async (tx: Omit<Transaction, "id">) => {
    try {
      const created = await api.insertTransaction(tx);
      setTransactions((prev) => [created, ...prev]);
    } catch {
      reportMutationError();
    }
  };

  const handleImportTransactions = async (txs: Omit<Transaction, "id">[]) => {
    try {
      const created = await api.insertTransactions(txs);
      setTransactions((prev) => [...created, ...prev]);
    } catch {
      reportMutationError();
    }
  };

  const handleUpdateTransaction = async (id: string, patch: Partial<Omit<Transaction, "id">>) => {
    const prevTransactions = transactions;
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    try {
      await api.updateTransaction(id, patch);
    } catch {
      setTransactions(prevTransactions);
      reportMutationError();
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const prevTransactions = transactions;
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.deleteTransaction(id);
    } catch {
      setTransactions(prevTransactions);
      reportMutationError();
    }
  };

  const handleToggleMonth = async (memberId: string, year: number, month: number) => {
    const target = members.find((m) => m.id === memberId);
    if (!target) return;
    const key = yearMonthKey(year, month);
    const nextPaidYearMonths = target.paidYearMonths.includes(key)
      ? target.paidYearMonths.filter((ym) => ym !== key)
      : [...target.paidYearMonths, key];
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, paidYearMonths: nextPaidYearMonths } : m)));
    try {
      await api.updateMember(memberId, { paidYearMonths: nextPaidYearMonths });
    } catch {
      reportMutationError();
    }
  };

  const handleBulkSetMonth = async (year: number, month: number, paid: boolean) => {
    const key = yearMonthKey(year, month);
    // 연납 회원은 개별 월 단위가 아니라 "연납 처리" 액션으로 별도 관리하므로 대상에서 제외
    const targets = members.filter((m) => m.status === "active" && m.paymentType === "monthly");
    setMembers((prev) =>
      prev.map((m) => {
        if (m.status !== "active" || m.paymentType !== "monthly") return m;
        const without = m.paidYearMonths.filter((ym) => ym !== key);
        return { ...m, paidYearMonths: paid ? [...without, key] : without };
      }),
    );
    try {
      await Promise.all(
        targets.map((m) => {
          const without = m.paidYearMonths.filter((ym) => ym !== key);
          const paidYearMonths = paid ? [...without, key] : without;
          return api.updateMember(m.id, { paidYearMonths });
        }),
      );
    } catch {
      reportMutationError();
    }
  };

  /** 연납 회원의 특정 연도 1~12월을 한 번에 처리(또는 취소) */
  const handleToggleAnnualLump = async (memberId: string, year: number) => {
    const target = members.find((m) => m.id === memberId);
    if (!target) return;
    const yearKeys = Array.from({ length: 12 }, (_, i) => yearMonthKey(year, i + 1));
    const alreadyFull = yearKeys.every((key) => target.paidYearMonths.includes(key));
    const confirmed = window.confirm(
      alreadyFull
        ? `${target.name} 님의 ${year}년 연납 처리를 취소할까요?`
        : `${target.name} 님을 ${year}년 연납 완료로 처리할까요? (1~12월 전체)`,
    );
    if (!confirmed) return;
    const nextPaidYearMonths = alreadyFull
      ? target.paidYearMonths.filter((ym) => !yearKeys.includes(ym))
      : [...new Set([...target.paidYearMonths, ...yearKeys])];
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, paidYearMonths: nextPaidYearMonths } : m)));
    try {
      await api.updateMember(memberId, { paidYearMonths: nextPaidYearMonths });
    } catch {
      reportMutationError();
    }
  };

  const handleAddMember = async (name: string) => {
    try {
      const created = await api.insertMember(name);
      setMembers((prev) => [...prev, created]);
    } catch {
      reportMutationError();
    }
  };

  const handleImportMembers = async (
    newMembers: { name: string; status: Member["status"]; paymentType: Member["paymentType"] }[],
  ) => {
    try {
      const created = await api.insertMembers(newMembers);
      setMembers((prev) => [...prev, ...created]);
    } catch {
      reportMutationError();
    }
  };

  /** 거래내역 업로드 시 자동 매칭된 회원 납부월을 실제로 반영 */
  const handleApplyMemberPayments = async (updates: { memberId: string; yearMonths: string[] }[]) => {
    if (updates.length === 0) return;
    const nextMembersById = new Map<string, string[]>();
    setMembers((prev) =>
      prev.map((m) => {
        const update = updates.find((u) => u.memberId === m.id);
        if (!update) return m;
        const merged = [...new Set([...m.paidYearMonths, ...update.yearMonths])].sort();
        nextMembersById.set(m.id, merged);
        return { ...m, paidYearMonths: merged };
      }),
    );
    try {
      await Promise.all(
        [...nextMembersById.entries()].map(([memberId, paidYearMonths]) =>
          api.updateMember(memberId, { paidYearMonths }),
        ),
      );
    } catch {
      reportMutationError();
    }
  };

  const handleToggleResting = async (memberId: string) => {
    const target = members.find((m) => m.id === memberId);
    if (!target) return;
    const nextStatus = target.status === "resting" ? "active" : "resting";
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, status: nextStatus } : m)));
    try {
      await api.updateMember(memberId, { status: nextStatus });
    } catch {
      reportMutationError();
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    const prevMembers = members;
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    try {
      await api.deleteMember(memberId);
    } catch {
      setMembers(prevMembers);
      reportMutationError();
    }
  };

  const handleTogglePaymentType = async (memberId: string) => {
    const target = members.find((m) => m.id === memberId);
    if (!target) return;
    const nextPaymentType = target.paymentType === "annual_lump" ? "monthly" : "annual_lump";
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, paymentType: nextPaymentType } : m)));
    try {
      await api.updateMember(memberId, { paymentType: nextPaymentType });
    } catch {
      reportMutationError();
    }
  };

  const activeLabel = NAV_ITEMS.find((item) => item.key === activeTab)?.label ?? "";

  if (authLoading) {
    return <div className="app-loading-screen" />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <img src="/team-logo.png" alt="하루FC 로고" className="team-logo-slot" />
          <Text textStyle="t6Bold" color="fg.neutral" className="team-name">
            하루FC
          </Text>
        </div>

        <nav className="sidebar-nav" aria-label="주 메뉴">
          <Text textStyle="t2Bold" color="fg.neutralMuted" className="sidebar-group-label">
            회비 관리
          </Text>
          {NAV_ITEMS.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              className="sidebar-nav-item"
              data-active={activeTab === key}
              onClick={() => setActiveTab(key)}
            >
              <span className="sidebar-nav-icon">{icon}</span>
              <span className="sidebar-nav-label">{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Text textStyle="t2Regular" color="fg.neutralMuted" className="sidebar-footer-email">
            {session?.user?.email ?? "총무 전용 대시보드"}
          </Text>
          <div className="sidebar-footer-actions">
            <ActionButton
              size="small"
              variant="ghost"
              onClick={() => exportBackup(members, transactions)}
            >
              내보내기
            </ActionButton>
            <ActionButton size="small" variant="ghost" onClick={signOut}>
              로그아웃
            </ActionButton>
          </div>
        </div>
      </aside>

      <main className="app-main">
        <TopBar label={activeLabel} />
        <div className="page-area">
          {dataError && (
            <div className="data-error-banner">
              <Text textStyle="t3Medium" color="fg.critical">
                {dataError}
              </Text>
              <ActionButton size="small" variant="neutralOutline" onClick={loadData}>
                다시 시도
              </ActionButton>
            </div>
          )}
          {dataLoading ? (
            <div className="app-loading-screen" />
          ) : (
            <>
              {activeTab === "home" && (
                <Home
                  transactions={transactions}
                  members={members}
                  onAddTransaction={handleAddTransaction}
                  onNavigate={setActiveTab}
                />
              )}
              {activeTab === "transactions" && (
                <Transactions
                  transactions={transactions}
                  members={members}
                  onAddTransaction={handleAddTransaction}
                  onImportTransactions={handleImportTransactions}
                  onApplyMemberPayments={handleApplyMemberPayments}
                  onUpdateTransaction={handleUpdateTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              )}
              {activeTab === "members" && (
                <Members
                  members={members}
                  onToggleMonth={handleToggleMonth}
                  onBulkSetMonth={handleBulkSetMonth}
                  onToggleAnnualLump={handleToggleAnnualLump}
                  onAddMember={handleAddMember}
                  onImportMembers={handleImportMembers}
                  onToggleResting={handleToggleResting}
                  onDeleteMember={handleDeleteMember}
                  onTogglePaymentType={handleTogglePaymentType}
                />
              )}
              {activeTab === "report" && <Report transactions={transactions} members={members} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
