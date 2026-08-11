import { useRef, useState } from "react";
import { ActionButton, Icon, Text, VStack, HStack } from "@seed-design/react";
import type { Transaction } from "../data/mock";
import { EXPENSE_CATEGORIES, won } from "../data/mock";
import { CloseIcon } from "./icons";
import {
  parseTransactionFile,
  markDuplicates,
  PasswordRequiredError,
  WrongPasswordError,
  DecryptFailedError,
  type StagedTransactionRow,
} from "../utils/importTransactions";
import "./ImportTransactionsModal.css";

/**
 * 엑셀/CSV 거래내역 업로드 팝업
 *
 * 흐름: 파일 선택 → 자동 파싱 → (암호화된 파일이면 비밀번호 입력) →
 * 미리보기(행별 수정 가능, 중복은 기본 제외) → 가져오기
 * 총무가 은행 앱에서 내보낸 파일을 그대로 올려도 되고, 인식이 애매한 값은
 * 미리보기 테이블에서 직접 고쳐서 넣을 수 있게 구성함.
 */

export function ImportTransactionsModal({
  existingTransactions,
  onClose,
  onImport,
}: {
  existingTransactions: Transaction[];
  onClose: () => void;
  onImport: (transactions: Omit<Transaction, "id">[]) => void;
}) {
  const [rows, setRows] = useState<StagedTransactionRow[] | null>(null);
  const [headerRecognized, setHeaderRecognized] = useState(true);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runParse = async (file: File, pw?: string) => {
    setParseError(null);
    setIsParsing(true);
    try {
      const result = await parseTransactionFile(file, pw);
      if (result.rows.length === 0) {
        setParseError("파일에서 거래 내역을 찾지 못했어요. 은행 앱에서 내보낸 원본 파일인지 확인해주세요.");
        setRows(null);
      } else {
        setRows(markDuplicates(result.rows, existingTransactions));
        setHeaderRecognized(result.headerRecognized);
        setNeedsPassword(false);
        setPendingFile(null);
        setPassword("");
      }
    } catch (err) {
      if (err instanceof PasswordRequiredError) {
        setNeedsPassword(true);
        setPendingFile(file);
      } else if (err instanceof WrongPasswordError) {
        setNeedsPassword(true);
        setPendingFile(file);
        setParseError("비밀번호가 올바르지 않아요. 다시 입력해주세요.");
      } else if (err instanceof DecryptFailedError) {
        // 비밀번호는 맞을 수 있지만 기술적으로 열지 못한 경우 — 원인을 그대로 보여줘서
        // 총무가 화면 문구를 그대로 전달하면 바로 진단할 수 있게 함
        setNeedsPassword(true);
        setPendingFile(file);
        setParseError(err.message);
      } else {
        setParseError("파일을 읽는 중 문제가 발생했어요. 엑셀(.xlsx) 또는 CSV 파일인지 확인해주세요.");
        setRows(null);
      }
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setNeedsPassword(false);
    setPassword("");
    await runParse(file);
  };

  const handlePasswordSubmit = async () => {
    if (!pendingFile || !password) return;
    await runParse(pendingFile, password);
  };

  const updateRow = (key: string, patch: Partial<StagedTransactionRow>) => {
    setRows((prev) => (prev ? prev.map((r) => (r.key === key ? { ...r, ...patch } : r)) : prev));
  };

  const includedCount = rows?.filter((r) => r.include).length ?? 0;
  const duplicateCount = rows?.filter((r) => r.isDuplicate).length ?? 0;

  const handleImport = () => {
    if (!rows) return;
    const toImport = rows
      .filter((r) => r.include)
      .map((r) => ({
        type: r.type,
        category: r.category.trim() || (r.type === "income" ? "회비" : "기타"),
        amount: r.amount,
        memo: r.memo,
        date: r.date,
      }));
    if (toImport.length === 0) return;
    onImport(toImport);
    onClose();
  };

  const handleReset = () => {
    setRows(null);
    setFileName("");
    setParseError(null);
    setNeedsPassword(false);
    setPendingFile(null);
    setPassword("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet import-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <Text as="p" textStyle="t2Bold" color="fg.brand" className="modal-eyebrow">
              엑셀/CSV 업로드
            </Text>
            <Text as="h2" textStyle="t7Bold" color="fg.neutral">
              거래내역 일괄 가져오기
            </Text>
          </div>
          <ActionButton size="small" variant="ghost" layout="iconOnly" aria-label="닫기" onClick={onClose}>
            <Icon svg={<CloseIcon />} />
          </ActionButton>
        </div>

        <div className="modal-body import-modal-body">
          {!rows && (
            <VStack gap="x2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="modal-file-input"
                onChange={handleFileChange}
                aria-label="거래내역 파일 선택"
              />
              <button
                type="button"
                className="modal-receipt-dropzone import-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <Text textStyle="t3Medium" color="fg.neutralMuted">
                  {isParsing
                    ? "파일 읽는 중..."
                    : "탭해서 은행 거래내역 파일 선택 (.xlsx, .xls, .csv)"}
                </Text>
              </button>
              {fileName && !parseError && (
                <Text textStyle="t2Regular" color="fg.neutralMuted">
                  선택한 파일: {fileName}
                </Text>
              )}

              {needsPassword && (
                <VStack gap="x1" className="import-password-box">
                  <Text textStyle="t2Medium" color="fg.neutral">
                    은행에서 받은 파일에 비밀번호가 걸려 있어요. 파일 열 때 쓰는 비밀번호를 입력해주세요.
                  </Text>
                  <HStack gap="x1">
                    <input
                      type="password"
                      className="plain-input import-password-input"
                      placeholder="파일 비밀번호"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handlePasswordSubmit();
                      }}
                      autoFocus
                    />
                    <ActionButton
                      size="medium"
                      variant="brandSolid"
                      disabled={!password || isParsing}
                      onClick={handlePasswordSubmit}
                    >
                      확인
                    </ActionButton>
                  </HStack>
                </VStack>
              )}

              {parseError && (
                <Text textStyle="t2Medium" color="fg.critical">
                  {parseError}
                </Text>
              )}
              <Text textStyle="t1Regular" color="fg.neutralMuted" className="import-help-text">
                카카오뱅크 등 은행 앱에서 내보낸 거래내역 파일을 그대로 올리면 자동으로 인식해요.
                비밀번호로 잠긴 파일도 비밀번호만 입력하면 그대로 업로드할 수 있어요.
                업로드 후 화면에서 내용을 확인하고 고친 다음 가져올 수 있어요.
              </Text>
            </VStack>
          )}

          {rows && (
            <>
              {!headerRecognized && (
                <Text textStyle="t2Medium" color="fg.critical" className="import-warning">
                  파일 형식을 정확히 인식하지 못했어요. 아래 내용을 꼼꼼히 확인해주세요.
                </Text>
              )}
              <HStack justify="space-between" className="import-summary-row">
                <Text textStyle="t2Medium" color="fg.neutralMuted">
                  총 {rows.length}건 인식 · {duplicateCount}건 중복 추정 (기본 제외됨)
                </Text>
                <ActionButton size="small" variant="ghost" onClick={handleReset}>
                  다른 파일 선택
                </ActionButton>
              </HStack>

              <div className="import-table">
                <div className="import-table-head">
                  <span></span>
                  <span>날짜</span>
                  <span>구분</span>
                  <span>항목</span>
                  <span>금액</span>
                  <span>메모</span>
                </div>
                {rows.map((row) => (
                  <div
                    className={`import-table-row ${row.isDuplicate ? "is-duplicate" : ""}`}
                    key={row.key}
                  >
                    <input
                      type="checkbox"
                      checked={row.include}
                      onChange={(e) => updateRow(row.key, { include: e.target.checked })}
                      aria-label={`${row.date} ${row.category} ${won(row.amount)} 가져오기 선택`}
                    />
                    <input
                      type="date"
                      className="plain-input import-cell-input"
                      value={row.date}
                      onChange={(e) => updateRow(row.key, { date: e.target.value })}
                    />
                    <select
                      className="plain-input import-cell-input"
                      value={row.type}
                      onChange={(e) =>
                        updateRow(row.key, { type: e.target.value as StagedTransactionRow["type"] })
                      }
                    >
                      <option value="income">입금</option>
                      <option value="expense">출금</option>
                    </select>
                    {row.type === "expense" ? (
                      <select
                        className="plain-input import-cell-input"
                        value={row.category}
                        onChange={(e) => updateRow(row.key, { category: e.target.value })}
                      >
                        {[...new Set([row.category, ...EXPENSE_CATEGORIES])].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="plain-input import-cell-input"
                        value={row.category}
                        onChange={(e) => updateRow(row.key, { category: e.target.value })}
                      />
                    )}
                    <input
                      type="number"
                      className="plain-input import-cell-input import-cell-amount"
                      value={row.amount}
                      onChange={(e) => updateRow(row.key, { amount: Number(e.target.value) || 0 })}
                    />
                    <input
                      type="text"
                      className="plain-input import-cell-input"
                      value={row.memo}
                      onChange={(e) => updateRow(row.key, { memo: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {rows && (
          <div className="modal-footer">
            <ActionButton
              size="large"
              variant="brandSolid"
              disabled={includedCount === 0}
              onClick={handleImport}
              flexGrow
            >
              선택한 {includedCount}건 가져오기
            </ActionButton>
          </div>
        )}
      </div>
    </div>
  );
}
