import { useState } from "react";
import type { Transaction, TransactionType } from "../data/mock";
import { EXPENSE_CATEGORIES } from "../data/mock";
import "./AddTransactionModal.css";

const todayISO = () => new Date().toISOString().slice(0, 10);

export function AddTransactionModal({
  initialType,
  onClose,
  onSubmit,
}: {
  initialType: TransactionType;
  onClose: () => void;
  onSubmit: (tx: Omit<Transaction, "id">) => void;
}) {
  const [type, setType] = useState<TransactionType>(initialType);
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState(type === "expense" ? EXPENSE_CATEGORIES[0] : "회비");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [receiptPreview, setReceiptPreview] = useState<string | undefined>(undefined);

  const canSubmit = amount.trim().length > 0 && Number(amount) > 0;

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptPreview(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      type,
      category: category.trim() || (type === "income" ? "입금" : "지출"),
      amount: Number(amount),
      memo,
      date,
      receiptImageUrl: receiptPreview,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{type === "income" ? "입금 추가" : "출금 추가"}</h2>
          <button className="modal-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="modal-type-toggle">
          <button
            className={type === "income" ? "active income" : ""}
            onClick={() => setType("income")}
          >
            입금
          </button>
          <button
            className={type === "expense" ? "active expense" : ""}
            onClick={() => setType("expense")}
          >
            출금
          </button>
        </div>

        <label className="modal-field">
          <span>날짜</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <label className="modal-field">
          <span>항목</span>
          {type === "expense" ? (
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={category}
              placeholder="예: 회비, 찬조금"
              onChange={(e) => setCategory(e.target.value)}
            />
          )}
        </label>

        <label className="modal-field">
          <span>금액</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        <label className="modal-field">
          <span>메모</span>
          <input
            type="text"
            placeholder="선택 입력"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </label>

        <label className="modal-field">
          <span>영수증 사진</span>
          <input type="file" accept="image/*" onChange={handleReceiptChange} />
        </label>

        {receiptPreview && (
          <img className="modal-receipt-preview" src={receiptPreview} alt="영수증 미리보기" />
        )}

        <button className="modal-submit" disabled={!canSubmit} onClick={handleSubmit}>
          {type === "income" ? "입금 추가하기" : "출금 추가하기"}
        </button>
      </div>
    </div>
  );
}
