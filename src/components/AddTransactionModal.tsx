import { useState } from "react";
import { ActionButton, TextField, VStack, HStack, Text } from "@seed-design/react";
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
        <HStack justify="space-between" align="center">
          <Text textStyle="t6Bold" color="fg.neutral">
            {type === "income" ? "입금 추가" : "출금 추가"}
          </Text>
          <ActionButton size="small" variant="ghost" layout="iconOnly" aria-label="닫기" onClick={onClose}>
            ✕
          </ActionButton>
        </HStack>

        <HStack gap="x2">
          <ActionButton
            flexGrow
            size="medium"
            variant={type === "income" ? "brandSolid" : "neutralOutline"}
            onClick={() => setType("income")}
          >
            입금
          </ActionButton>
          <ActionButton
            flexGrow
            size="medium"
            variant={type === "expense" ? "criticalSolid" : "neutralOutline"}
            onClick={() => setType("expense")}
          >
            출금
          </ActionButton>
        </HStack>

        <VStack gap="x1">
          <Text textStyle="t3Medium" color="fg.neutralMuted">
            날짜
          </Text>
          <input type="date" className="plain-input" value={date} onChange={(e) => setDate(e.target.value)} />
        </VStack>

        <VStack gap="x1">
          <Text textStyle="t3Medium" color="fg.neutralMuted">
            항목
          </Text>
          {type === "expense" ? (
            <select className="plain-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : (
            <TextField.Root>
              <TextField.Input
                placeholder="예: 회비, 찬조금"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </TextField.Root>
          )}
        </VStack>

        <VStack gap="x1">
          <Text textStyle="t3Medium" color="fg.neutralMuted">
            금액
          </Text>
          <TextField.Root>
            <TextField.Input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <TextField.SuffixText>원</TextField.SuffixText>
          </TextField.Root>
        </VStack>

        <VStack gap="x1">
          <Text textStyle="t3Medium" color="fg.neutralMuted">
            메모
          </Text>
          <TextField.Root>
            <TextField.Input placeholder="선택 입력" value={memo} onChange={(e) => setMemo(e.target.value)} />
          </TextField.Root>
        </VStack>

        <VStack gap="x1">
          <Text textStyle="t3Medium" color="fg.neutralMuted">
            영수증 사진
          </Text>
          <input type="file" accept="image/*" onChange={handleReceiptChange} />
        </VStack>

        {receiptPreview && <img className="modal-receipt-preview" src={receiptPreview} alt="영수증 미리보기" />}

        <ActionButton size="large" variant="neutralSolid" disabled={!canSubmit} onClick={handleSubmit}>
          {type === "income" ? "입금 추가하기" : "출금 추가하기"}
        </ActionButton>
      </div>
    </div>
  );
}
