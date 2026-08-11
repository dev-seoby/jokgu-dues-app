import { useState } from "react";
import { ActionButton, Icon, TextField, VStack, HStack, Text } from "@seed-design/react";
import type { Transaction, TransactionType } from "../data/mock";
import { EXPENSE_CATEGORIES } from "../data/mock";
import { CloseIcon } from "./icons";

/**
 * 거래 내역 1건 수정 팝업
 *
 * 엑셀로 가져왔거나 직접 입력한 거래 중 날짜/항목/금액/메모가 잘못된 건을
 * 목록에서 바로 고칠 수 있게 함. 삭제도 여기서 함께 처리.
 */

export function EditTransactionModal({
  transaction,
  onClose,
  onSave,
  onDelete,
}: {
  transaction: Transaction;
  onClose: () => void;
  onSave: (id: string, patch: Partial<Omit<Transaction, "id">>) => void;
  onDelete: (id: string) => void;
}) {
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [date, setDate] = useState(transaction.date);
  const [category, setCategory] = useState(transaction.category);
  const [customCategory, setCustomCategory] = useState(
    transaction.type === "expense" && !EXPENSE_CATEGORIES.includes(transaction.category)
      ? transaction.category
      : "",
  );
  const [amount, setAmount] = useState(String(transaction.amount));
  const [memo, setMemo] = useState(transaction.memo);

  const isIncome = type === "income";
  const isCustomCategory = type === "expense" && category === "기타";
  const canSubmit =
    amount.trim().length > 0 && Number(amount) > 0 && (!isCustomCategory || customCategory.trim().length > 0);

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    if (nextType === "expense" && !EXPENSE_CATEGORIES.includes(category)) {
      setCategory(EXPENSE_CATEGORIES[0]);
    }
    if (nextType === "income") {
      setCustomCategory("");
    }
  };

  const handleCategorySelect = (value: string) => {
    setCategory(value);
    if (value !== "기타") setCustomCategory("");
  };

  const handleSave = () => {
    if (!canSubmit) return;
    const finalCategory = isCustomCategory
      ? customCategory.trim()
      : category.trim() || (type === "income" ? "입금" : "지출");
    onSave(transaction.id, {
      type,
      category: finalCategory,
      amount: Number(amount),
      memo,
      date,
    });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm("이 거래 내역을 삭제할까요?")) {
      onDelete(transaction.id);
      onClose();
    }
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
              거래 내역 수정
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
              onClick={() => handleTypeChange("income")}
            >
              입금
            </ActionButton>
            <ActionButton
              flexGrow
              size="large"
              variant={!isIncome ? "criticalSolid" : "neutralOutline"}
              onClick={() => handleTypeChange("expense")}
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
                <select
                  className="plain-input"
                  value={EXPENSE_CATEGORIES.includes(category) ? category : "기타"}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                >
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

          {isCustomCategory && (
            <VStack gap="x1_5">
              <Text textStyle="t2Bold" color="fg.neutralMuted">
                기타 항목 직접 입력
              </Text>
              <TextField.Root className="modal-textfield">
                <TextField.Input
                  aria-label="기타 항목 직접 입력"
                  placeholder="예: 심판비, 대회 참가비"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  autoFocus
                />
              </TextField.Root>
            </VStack>
          )}

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
        </div>

        <div className="modal-footer">
          <HStack gap="x2">
            <ActionButton size="large" variant="ghost" onClick={handleDelete}>
              삭제
            </ActionButton>
            <ActionButton
              size="large"
              variant={isIncome ? "brandSolid" : "criticalSolid"}
              disabled={!canSubmit}
              onClick={handleSave}
              flexGrow
            >
              저장하기
            </ActionButton>
          </HStack>
        </div>
      </div>
    </div>
  );
}
