import { useRef, useState } from "react";
import { ActionButton, Icon, TextField, VStack, HStack, Text } from "@seed-design/react";
import type { Transaction, TransactionType } from "../data/mock";
import { EXPENSE_CATEGORIES } from "../data/mock";
import { CloseIcon } from "./icons";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = amount.trim().length > 0 && Number(amount) > 0;
  const isIncome = type === "income";

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
      <div className={`modal-sheet ${isIncome ? "tone-income" : "tone-expense"}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <Text as="p" textStyle="t2Bold" color={isIncome ? "fg.brand" : "fg.critical"} className="modal-eyebrow">
              {isIncome ? "입금" : "출금"}
            </Text>
            <Text as="h2" textStyle="t7Bold" color="fg.neutral">
              {isIncome ? "입금 추가" : "출금 추가"}
            </Text>
          </div>
          <ActionButton size="small" variant="ghost" layout="iconOnly" aria-label="닫기" onClick={onClose}>
            <Icon svg={<CloseIcon />} />
          </ActionButton>
        </div>

        <div className="modal-body">
          <HStack gap="x2">
            <ActionButton
              flexGrow
              size="large"
              variant={isIncome ? "brandSolid" : "neutralOutline"}
              onClick={() => setType("income")}
            >
              입금
            </ActionButton>
            <ActionButton
              flexGrow
              size="large"
              variant={!isIncome ? "criticalSolid" : "neutralOutline"}
              onClick={() => setType("expense")}
            >
              출금
            </ActionButton>
          </HStack>

          <div className="modal-field-row">
            <VStack gap="x1_5">
              <Text textStyle="t2Bold" color="fg.neutralMuted">
                날짜
              </Text>
              <input type="date" className="plain-input" value={date} onChange={(e) => setDate(e.target.value)} />
            </VStack>

            <VStack gap="x1_5">
              <Text textStyle="t2Bold" color="fg.neutralMuted">
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
                <TextField.Root className="modal-textfield">
                  <TextField.Input
                    aria-label="항목"
                    placeholder="예: 회비, 찬조금"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </TextField.Root>
              )}
            </VStack>
          </div>

          <VStack gap="x1_5">
            <Text textStyle="t2Bold" color="fg.neutralMuted">
              금액
            </Text>
            <TextField.Root className="modal-textfield modal-amount-field">
              <TextField.Input
                aria-label="금액"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <TextField.SuffixText>원</TextField.SuffixText>
            </TextField.Root>
          </VStack>

          <VStack gap="x1_5">
            <Text textStyle="t2Bold" color="fg.neutralMuted">
              메모
            </Text>
            <TextField.Root className="modal-textfield">
              <TextField.Input
                aria-label="메모"
                placeholder="선택 입력"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </TextField.Root>
          </VStack>

          <VStack gap="x1_5">
            <Text textStyle="t2Bold" color="fg.neutralMuted">
              영수증 사진
            </Text>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="modal-file-input"
              onChange={handleReceiptChange}
            />
            {receiptPreview ? (
              <div className="modal-receipt-preview-wrap">
                <img className="modal-receipt-preview" src={receiptPreview} alt="영수증 미리보기" />
                <ActionButton
                  size="small"
                  variant="ghost"
                  layout="iconOnly"
                  aria-label="영수증 제거"
                  className="modal-receipt-remove"
                  onClick={() => {
                    setReceiptPreview(undefined);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <Icon svg={<CloseIcon />} />
                </ActionButton>
              </div>
            ) : (
              <button
                type="button"
                className="modal-receipt-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <Text textStyle="t3Medium" color="fg.neutralMuted">
                  탭해서 영수증 이미지 첨부 (선택)
                </Text>
              </button>
            )}
          </VStack>
        </div>

        <div className="modal-footer">
          <ActionButton
            size="large"
            variant={isIncome ? "brandSolid" : "criticalSolid"}
            disabled={!canSubmit}
            onClick={handleSubmit}
            flexGrow
          >
            {isIncome ? "입금 추가하기" : "출금 추가하기"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
