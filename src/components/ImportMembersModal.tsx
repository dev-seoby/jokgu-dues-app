import { useRef, useState } from "react";
import { ActionButton, Icon, Text, VStack, HStack } from "@seed-design/react";
import type { Member } from "../data/mock";
import { CloseIcon } from "./icons";
import { parseMemberFile, markDuplicateMembers, type StagedMemberRow } from "../utils/importMembers";
import "./ImportMembersModal.css";

/**
 * 기존에 운영하던 팀의 회원 명단 파일(엑셀/CSV)을 업로드해서
 * 회원관리에 한 번에 등록하는 팝업.
 *
 * 흐름: 파일 선택 → 자동 파싱 → 미리보기(행별 수정 가능, 이미 등록된
 * 이름은 기본 제외) → 등록
 */

export function ImportMembersModal({
  existingMembers,
  onClose,
  onImport,
}: {
  existingMembers: Member[];
  onClose: () => void;
  onImport: (members: { name: string; status: Member["status"]; paymentType: Member["paymentType"] }[]) => void;
}) {
  const [rows, setRows] = useState<StagedMemberRow[] | null>(null);
  const [headerRecognized, setHeaderRecognized] = useState(true);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError(null);
    setIsParsing(true);
    try {
      const result = await parseMemberFile(file);
      if (result.rows.length === 0) {
        setParseError("파일에서 이름을 찾지 못했어요. 이름이 있는 엑셀/CSV 파일인지 확인해주세요.");
        setRows(null);
      } else {
        setRows(markDuplicateMembers(result.rows, existingMembers));
        setHeaderRecognized(result.headerRecognized);
      }
    } catch {
      setParseError("파일을 읽는 중 문제가 발생했어요. 엑셀(.xlsx) 또는 CSV 파일인지 확인해주세요.");
      setRows(null);
    } finally {
      setIsParsing(false);
    }
  };

  const updateRow = (key: string, patch: Partial<StagedMemberRow>) => {
    setRows((prev) => (prev ? prev.map((r) => (r.key === key ? { ...r, ...patch } : r)) : prev));
  };

  const includedCount = rows?.filter((r) => r.include).length ?? 0;
  const duplicateCount = rows?.filter((r) => r.isDuplicate).length ?? 0;

  const handleImport = () => {
    if (!rows) return;
    const toImport = rows
      .filter((r) => r.include)
      .map((r) => ({ name: r.name.trim(), status: r.status, paymentType: r.paymentType }))
      .filter((r) => r.name.length > 0);
    if (toImport.length === 0) return;
    onImport(toImport);
    onClose();
  };

  const handleReset = () => {
    setRows(null);
    setFileName("");
    setParseError(null);
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
              회원 명단 일괄 등록
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
                aria-label="회원 명단 파일 선택"
              />
              <button
                type="button"
                className="modal-receipt-dropzone import-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <Text textStyle="t3Medium" color="fg.neutralMuted">
                  {isParsing ? "파일 읽는 중..." : "탭해서 기존 회원 명단 파일 선택 (.xlsx, .xls, .csv)"}
                </Text>
              </button>
              {fileName && !parseError && (
                <Text textStyle="t2Regular" color="fg.neutralMuted">
                  선택한 파일: {fileName}
                </Text>
              )}
              {parseError && (
                <Text textStyle="t2Medium" color="fg.critical">
                  {parseError}
                </Text>
              )}
              <Text textStyle="t1Regular" color="fg.neutralMuted" className="import-help-text">
                이름만 한 줄씩 나열된 파일도 되고, 이름/상태/납부방식이 표로 정리된 파일도 돼요.
                업로드 후 화면에서 내용을 확인하고 고친 다음 등록할 수 있어요.
              </Text>
            </VStack>
          )}

          {rows && (
            <>
              {!headerRecognized && (
                <Text textStyle="t2Medium" color="fg.critical" className="import-warning">
                  표 형식을 인식하지 못해서 첫 번째 칸을 이름으로 읽었어요. 아래 내용을 확인해주세요.
                </Text>
              )}
              <HStack justify="space-between" className="import-summary-row">
                <Text textStyle="t2Medium" color="fg.neutralMuted">
                  총 {rows.length}명 인식 · {duplicateCount}명 기존 회원과 이름 중복 (기본 제외됨)
                </Text>
                <ActionButton size="small" variant="ghost" onClick={handleReset}>
                  다른 파일 선택
                </ActionButton>
              </HStack>

              <div className="import-table members-import-table">
                <div className="import-table-head">
                  <span></span>
                  <span>이름</span>
                  <span>상태</span>
                  <span>납부방식</span>
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
                      aria-label={`${row.name} 등록에 포함`}
                    />
                    <input
                      type="text"
                      className="plain-input import-cell-input"
                      value={row.name}
                      onChange={(e) => updateRow(row.key, { name: e.target.value })}
                    />
                    <select
                      className="plain-input import-cell-input"
                      value={row.status}
                      onChange={(e) => updateRow(row.key, { status: e.target.value as StagedMemberRow["status"] })}
                    >
                      <option value="active">활동</option>
                      <option value="resting">휴회</option>
                    </select>
                    <select
                      className="plain-input import-cell-input"
                      value={row.paymentType}
                      onChange={(e) =>
                        updateRow(row.key, { paymentType: e.target.value as StagedMemberRow["paymentType"] })
                      }
                    >
                      <option value="monthly">월납</option>
                      <option value="annual_lump">연납</option>
                    </select>
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
              선택한 {includedCount}명 등록
            </ActionButton>
          </div>
        )}
      </div>
    </div>
  );
}
