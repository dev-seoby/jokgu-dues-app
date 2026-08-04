import { useState } from "react";
import { Box, Text } from "@seed-design/react";
import { HomeIcon, TransactionIcon, MembersIcon, ReportIcon } from "./components/icons";
import { Home } from "./screens/Home";
import { Transactions } from "./screens/Transactions";
import { Members } from "./screens/Members";
import { Report } from "./screens/Report";
import { MOCK_MEMBERS, MOCK_TRANSACTIONS, type Member, type Transaction } from "./data/mock";
import "./App.css";

export type TabKey = "home" | "transactions" | "members" | "report";

const NAV_ITEMS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "home", label: "홈", icon: <HomeIcon /> },
  { key: "transactions", label: "거래", icon: <TransactionIcon /> },
  { key: "members", label: "회원관리", icon: <MembersIcon /> },
  { key: "report", label: "리포트", icon: <ReportIcon /> },
];

let txSeq = 1000;

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);

  const handleAddTransaction = (tx: Omit<Transaction, "id">) => {
    setTransactions((prev) => [...prev, { ...tx, id: `tx-${++txSeq}` }]);
  };

  const handleToggleMonth = (memberId: string, month: number) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id !== memberId
          ? m
          : {
              ...m,
              paidMonths: m.paidMonths.includes(month)
                ? m.paidMonths.filter((mo) => mo !== month)
                : [...m.paidMonths, month],
            },
      ),
    );
  };

  const handleBulkSetMonth = (month: number, paid: boolean) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.status !== "active") return m;
        const withoutMonth = m.paidMonths.filter((mo) => mo !== month);
        return { ...m, paidMonths: paid ? [...withoutMonth, month] : withoutMonth };
      }),
    );
  };

  const handleAddMember = (name: string) => {
    setMembers((prev) => [
      ...prev,
      { id: `member-${Date.now()}`, name, status: "active", paymentType: "monthly", paidMonths: [] },
    ]);
  };

  const handleToggleResting = (memberId: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id !== memberId ? m : { ...m, status: m.status === "resting" ? "active" : "resting" },
      ),
    );
  };

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <Box className="team-logo-slot" aria-hidden="true" />
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
          <Text textStyle="t2Regular" color="fg.neutralMuted">
            총무 전용 대시보드
          </Text>
        </div>
      </aside>

      <main className="app-main">
        <div className="page-area">
          {activeTab === "home" && (
            <Home
              transactions={transactions}
              members={members}
              onAddTransaction={handleAddTransaction}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === "transactions" && (
            <Transactions transactions={transactions} onAddTransaction={handleAddTransaction} />
          )}
          {activeTab === "members" && (
            <Members
              members={members}
              onToggleMonth={handleToggleMonth}
              onBulkSetMonth={handleBulkSetMonth}
              onAddMember={handleAddMember}
              onToggleResting={handleToggleResting}
            />
          )}
          {activeTab === "report" && <Report transactions={transactions} members={members} />}
        </div>
      </main>
    </div>
  );
}

export default App;
