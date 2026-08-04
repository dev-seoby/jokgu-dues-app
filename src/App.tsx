import { useState } from "react";
import "./App.css";
import { BottomNav, type TabKey } from "./components/BottomNav";
import { Home } from "./screens/Home";
import { Transactions } from "./screens/Transactions";
import { Members } from "./screens/Members";
import { Report } from "./screens/Report";
import { MOCK_MEMBERS, MOCK_TRANSACTIONS, type Member, type Transaction } from "./data/mock";

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

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </>
  );
}

export default App;
