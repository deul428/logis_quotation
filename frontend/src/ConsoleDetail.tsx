import React, { useEffect, useMemo, useState } from "react";

import Button from "./components/Button";
import { getStatusColor } from "./utils/statusHelpers";

export interface ConsoleDetailProps {
  row: Record<string, string>;
  onClose: () => void;
  formatCell: (value: string | number | null | undefined) => string;
  /** 헤더 순서(클릭한 행의 모든 컬럼 순서). 있으면 이 순서로, 없으면 row 키 순서로 렌더 */
  headerOrder?: string[];
  /** 견적 금액/비고 편집용 (상세에서 수정·저장 시 전달) */
  editedAmounts?: Record<string, string>;
  setEditedAmounts?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  editedMemo?: Record<string, string>;
  setEditedMemo?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  /** 상세 화면: 금액+비고 통합 저장 */
  onSaveAll?: (
    estimateNum: string,
    pastAmount: string,
    newAmount: string,
    pastMemo: string,
    newMemo: string
  ) => void | Promise<void>;
}

const normalizeKey = (key: string) =>
  key.replace(/\s+/g, "").replace(/\n/g, "").replace(/[()]/g, "").trim();

const ConsoleDetail: React.FC<ConsoleDetailProps> = ({
  row,
  onClose,
  formatCell,
  headerOrder,
  editedAmounts = {},
  setEditedAmounts,
  editedMemo = {},
  setEditedMemo,
  onSaveAll,
}) => {
  const estimateNum = row["견적번호"] ?? "";

  const getRowValue = (norm: string) => {
    const entry = Object.entries(row).find(([k]) => normalizeKey(k) === norm);
    return entry ? entry[1] : "";
  };

  const [localAmount, setLocalAmount] = useState(() => {
    if (editedAmounts[estimateNum] !== undefined) return editedAmounts[estimateNum];
    return getRowValue("견적금액") || (row["견적 금액"] ?? "");
  });
  const [localMemo, setLocalMemo] = useState(() => {
    if (editedMemo[estimateNum] !== undefined) return editedMemo[estimateNum];
    return getRowValue("견적담당자비고") || (row["견적담당자 비고"] ?? "");
  });

  useEffect(() => {
    const amountVal =
      editedAmounts[estimateNum] !== undefined
        ? editedAmounts[estimateNum]
        : getRowValue("견적금액") || (row["견적 금액"] ?? "");
    const memoVal =
      editedMemo[estimateNum] !== undefined
        ? editedMemo[estimateNum]
        : getRowValue("견적담당자비고") || (row["견적담당자 비고"] ?? "");
    setLocalAmount(amountVal);
    setLocalMemo(memoVal);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getRowValue derived from row
  }, [estimateNum, row, editedAmounts, editedMemo]);

  const pastAmount =
    getRowValue("견적금액") || (row["견적 금액"] ?? "");
  const pastMemo =
    getRowValue("견적담당자비고") || (row["견적담당자 비고"] ?? "");
  /** 넘어온 row의 모든 헤더(키)를 headerOrder 순서대로 정렬한 목록 (원본데이터 제외) */
  const orderedEntries = useMemo(() => {
    if (!row || Object.keys(row).length === 0) return [];
    const ordered: [string, string][] = [];
    const seen = new Set<string>();
    if (headerOrder && headerOrder.length > 0) {
      headerOrder.forEach((key) => {
        if (key !== "원본데이터" && key in row && !seen.has(key)) {
          seen.add(key);
          ordered.push([key, row[key]]);
        }
      });
    }
    Object.keys(row).forEach((key) => {
      if (key !== "원본데이터" && !seen.has(key)) ordered.push([key, row[key]]);
    });
    return ordered;
  }, [row, headerOrder]);

  const originalData = useMemo(() => row?.["원본데이터"] ?? null, [row]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-h-[80vh] w-full max-w-3xl overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">견적 상세 정보</h2>
        <div>
          {orderedEntries.length > 0 ? (
            <>
              <div className="grid grid-cols-[minmax(0,40%)_1fr] gap-0 border border-gray-200 rounded-lg overflow-hidden">
                {orderedEntries.map(([key, value]) => {
                  const nKey = normalizeKey(key);
                  if (key.trim() === "영업 담당자 사번별 이름" || key.trim() === "영업담당자 메일" || key.trim() === "견적담당자 메일") {
                    return null;
                  }

                  let displayValue: React.ReactNode = value ?? " ";

                  if (nKey === "견적금액") {
                    displayValue = (
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="number"
                          value={localAmount}
                          onChange={(e) => {
                            const v = e.target.value;
                            setLocalAmount(v);
                            setEditedAmounts?.((prev) => ({ ...prev, [estimateNum]: v }));
                          }}
                          className="flex-1 min-w-[120px] px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    );
                  } else if (nKey === "견적담당자비고") {
                    displayValue = (
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="text"
                          value={localMemo}
                          onChange={(e) => {
                            const v = e.target.value;
                            setLocalMemo(v);
                            setEditedMemo?.((prev) => ({ ...prev, [estimateNum]: v }));
                          }}
                          className="flex-1 min-w-[120px] px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    );
                  } else if (key === "요청일") {
                    displayValue = formatCell(value);
                  } else if (
                    (key === "견적 금액" || key === "사용금액(월평균)") &&
                    value
                  ) {
                    displayValue = value
                      .toString()
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                  } else if (key === "상태") {
                    const statusClass = getStatusColor((value || "").trim());
                    displayValue = (
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusClass}`}
                      >
                        {value || " "}
                      </span>
                    );
                  }

                  return (
                    <React.Fragment key={key}>
                      <div className="px-3 py-2.5 bg-gray-50 text-xs font-medium text-gray-600 border-b border-gray-200 last:border-b-0">
                        {key}
                      </div>
                      <div className="px-3 py-2.5 text-sm text-gray-900 border-b border-l border-gray-200 last:border-b-0">
                        {displayValue}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
              {originalData && (
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-3 py-2.5 bg-gray-50 text-xs font-medium text-gray-600">
                    원본데이터
                  </div>
                  <div className="px-3 py-2.5 text-sm text-gray-900 whitespace-pre-wrap break-words">
                    {originalData}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-sm">데이터가 없습니다.</p>
          )}
        </div>

        <div className="mt-6 flex gap-2 justify-between">
          <Button type="button" variant="secondary" onClick={onClose} className="min-w-[120px]" fullWidth>
            닫기
          </Button>
          {onSaveAll && (
            <Button
              type="button"
              variant="primary" 
              fullWidth
              className="min-w-[120px]"
              onClick={() => onSaveAll(estimateNum, pastAmount, localAmount, pastMemo, localMemo)}
            >
              저장
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsoleDetail;
