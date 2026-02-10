import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp, ArrowDown, ArrowUpDown, RotateCw, ChevronsUp, ChevronsUpIcon, RefreshCcwIcon } from "lucide-react";

import ConsoleDetail from "./ConsoleDetail";
import LoadingOverlay from "./components/LoadingOverlay";
import Button from "./components/Button";
import Pagination from "./components/Pagination";
import { getStatusColor } from "./utils/statusHelpers";
interface FetchResponse {
  status: string;
  message?: string;
  data?: string[][];
}
interface ConsoleProps {
  tabData: string;
  setTabData: React.Dispatch<React.SetStateAction<string>>;
}

const API_URL = "https://icy-sea-0bb9.kkhhsq.workers.dev";

/** 리스트에 표시할 컬럼 (배열 순서대로 노출) */
const DEFAULT_COLUMNS = [
  "견적번호",
  "영업담당자",
  "견적담당자",
  "요청일",
  "업체명",
  "상품",
  // "규격(스팩)",
  // "인쇄",
  "사용량(월평균)",
  "사용금액(월평균)",
  "지역(착지)",
  "기타요청",
  "견적가(매입)",
  // "공급사",
  "견적담당자 비고",
  "견적 금액",
];

/** 정렬 가능한 헤더 (이 배열에 있는 컬럼만 헤더 클릭 시 정렬) */
const SORTABLE_COLUMNS = [
  "견적번호",
  "영업담당자",
  "견적담당자",
  "요청일",
  "업체명",
  "상품",
  "사용금액",
  "견적가(매입)",
  // "공급사",
  "견적 금액",
];

/**
 * 상세 모달을 여는 트리거 컬럼
 * - 이 배열에 있는 "헤더(컬럼) 값"을 클릭할 때만 상세 모달을 엽니다.
 * - 쉽게 추가/삭제해서 관리하세요.
 */
const DETAIL_MODAL_TRIGGER_COLUMNS = [
  "견적번호",
  "영업담당자",
  "견적담당자"
  // "업체명",
  // "상품",
];

const Console: React.FC<ConsoleProps> = ({ tabData, setTabData }) => {
  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [activeColumns, setActiveColumns] = useState<string[]>([]);
  const [data, setData] = useState<string[][]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>("견적번호");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchManager, setSearchManager] = useState<string>("");
  const [searchSalesManager, setSearchSalesManager] = useState<string>("");
  const [searchCompany, setSearchCompany] = useState<string>("");
  const [searchReqDate, setSearchReqDate] = useState<string>("");
  const [searchStts, setSearchStts] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<Record<string, string> | null>(
    null
  );

  const [editedAmounts, setEditedAmounts] = useState<Record<string, string>>(
    {}
  );

  const [editedMemo, setEditedMemo] = useState<Record<string, string>>({});
  const location = useLocation();

  useEffect(() => {
    loadData();
    if (!sortColumn) {
      handleSort("견적번호");
      setSortDirection("desc");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchManager, searchSalesManager, searchCompany, searchReqDate, searchStts]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}?mode=console&action=readAll`);
      const text = await res.text();
      let json: FetchResponse;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("서버 응답이 JSON이 아닙니다: " + text);
      }

      if (json.status === "success" && json.data) {
        const tableData = json.data;
        setAllColumns(tableData[0]);
        setActiveColumns(
          tableData[0].filter((h) => DEFAULT_COLUMNS.includes(h))
        );

        // 데이터 로드 후 견적번호로 내림차순 정렬
        const header = tableData[0];
        const body = tableData.slice(1);
        const colIndex = header.indexOf("견적번호");

        if (colIndex !== -1) {
          const sortedBody = [...body].sort((rowA, rowB) => {
            const valA = rowA[colIndex];
            const valB = rowB[colIndex];
            const strA = String(valA ?? "");
            const strB = String(valB ?? "");

            // 숫자로 정렬 시도
            const numA = parseFloat(strA.replace(/[^0-9.-]+/g, ""));
            const numB = parseFloat(strB.replace(/[^0-9.-]+/g, ""));
            if (!isNaN(numA) && !isNaN(numB)) {
              return numB - numA; // 내림차순
            }

            // 문자열로 정렬
            return strB.localeCompare(strA, "ko"); // 내림차순
          });

          setData([header, ...sortedBody]);
          setSortColumn("견적번호");
          setSortDirection("desc");
        } else {
          setData(tableData);
        }
      }
    } catch (err) {
      console.error("loadData 오류:", err);
    } finally {
      setLoading(false);
      setEditedAmounts({});
      setEditedMemo({});
      setCurrentPage(1);
    }
  };
  // 셀 포맷
  const formatCell = (value: string | number | null | undefined): string => {
    if (!value) return "";
    const str = String(value);
    if (str.match(/^\d{4}-\d{2}-\d{2}T/)) {
      const date = new Date(str);
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}.${String(date.getDate()).padStart(2, "0")}. ${String(
        date.getHours()
      ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    }
    return str;
  };

  // 정렬
  const handleSort = (colName: string) => {
    if (!data || data.length <= 1) return;

    const header = data[0];
    const body = data.slice(1);
    const colIndex = header.indexOf(colName);
    if (colIndex === -1) return;

    const newDirection =
      sortColumn === colName && sortDirection === "asc" ? "desc" : "asc";
    setSortColumn(colName);
    setSortDirection(newDirection);

    const sortedBody = [...body].sort((rowA, rowB) => {
      const valA = rowA[colIndex];
      const valB = rowB[colIndex];
      const strA = String(valA ?? "");
      const strB = String(valB ?? "");

      // 날짜
      const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
      if (isoDatePattern.test(strA) && isoDatePattern.test(strB)) {
        const timeA = new Date(strA).getTime();
        const timeB = new Date(strB).getTime();
        return newDirection === "asc" ? timeA - timeB : timeB - timeA;
      }

      // 숫자
      const numA = parseFloat(strA.replace(/[^0-9.-]+/g, ""));
      const numB = parseFloat(strB.replace(/[^0-9.-]+/g, ""));
      if (!isNaN(numA) && !isNaN(numB)) {
        return newDirection === "asc" ? numA - numB : numB - numA;
      }

      // 문자열
      return newDirection === "asc"
        ? strA.localeCompare(strB, "ko")
        : strB.localeCompare(strA, "ko");
    });

    setData([header, ...sortedBody]);
  };

  // 견적 금액 수정
  const sendEstimate = async (
    estimateNum: string,
    pastAmount: string,
    newAmount: string
  ) => {
    if (!newAmount.toString().trim()) {
      alert("금액을 입력하세요.");
      return;
    }
    if (pastAmount.toString().trim() === newAmount.toString().trim()) {
      alert("금액을 변경해 주세요.");
      return;
    }

    const confirmSend = window.confirm(
      `${estimateNum}번 견적번호의 금액을 저장하시겠습니까?`
    );
    if (!confirmSend) return;

    setLoading(true);

    const payload = {
      mode: "console",
      action: "updateEstimate-cost",
      estimateNum,
      newAmount,
    };
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.status === "fail") {
        throw new Error(
          result.message || "금액 저장에 실패하였습니다. 관리자에게 문의하세요."
        );
      }
      setLoading(false);
    } catch (err) {
      console.error("전송 오류:", err);
      alert("❌ 서버 전송 실패");
    } finally {
      setTimeout(() => {
        loadData();
      }, 5000);
    }
  };
  const sendMemo = async (
    estimateNum: string,
    pastMemo: string,
    newMemo: string
  ) => {
    if (!newMemo.toString().trim()) {
      alert("비고를 입력하세요.");
      return;
    }
    if (pastMemo.toString().trim() === newMemo.toString().trim()) {
      alert("비고를 변경해 주세요.");
      return;
    }

    const confirmSend = window.confirm(
      `${estimateNum}번 견적번호의 비고를 저장하시겠습니까?`
    );
    if (!confirmSend) return;

    setLoading(true);

    const payload = {
      mode: "console",
      action: "updateEstimate-memo",
      estimateNum,
      newMemo,
    };
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.status === "fail") {
        throw new Error(
          result.message || "비고 저장에 실패하였습니다. 관리자에게 문의하세요."
        );
      }
      setLoading(false);
    } catch (err) {
      console.error("전송 오류:", err);
      alert("❌ 서버 전송 실패");
    } finally {
      setTimeout(() => {
        loadData();
      }, 5000);
    }
  };

  // 상세 화면: 견적 금액 + 견적담당자 비고 통합 저장
  const sendEstimateAll = async (
    estimateNum: string,
    pastAmount: string,
    newAmount: string,
    pastMemo: string,
    newMemo: string
  ) => {
    if (!newAmount.toString().trim() && !newMemo.toString().trim()) {
      alert("금액 또는 비고를 입력하세요.");
      return;
    }
    const amountSame = pastAmount.toString().trim() === newAmount.toString().trim();
    const memoSame = pastMemo.toString().trim() === newMemo.toString().trim();
    if (amountSame && memoSame) {
      alert("금액 또는 비고를 변경해 주세요.");
      return;
    }

    const confirmSend = window.confirm(
      `${estimateNum}번 견적번호의 금액/비고를 저장하시겠습니까?`
    );
    if (!confirmSend) return;

    setLoading(true);
    const payload = {
      mode: "console",
      action: "updateEstimate-all",
      estimateNum,
      newAmount,
      newMemo,
    };
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.status === "fail") {
        throw new Error(
          result.message || "저장에 실패하였습니다. 관리자에게 문의하세요."
        );
      }
      setLoading(false);
      alert("저장되었습니다.");
    } catch (err) {
      console.error("전송 오류:", err);
      alert("❌ 서버 전송 실패");
    } finally {
      // setTimeout(() => {
      setSelectedRow(null);
      loadData();
      // }, 5000);
    }
  };
  // ✅ 한글 key 정규화 함수 (공백/괄호/개행 등 제거)
  const normalizeKey = (key: string) => {
    return key
      .replace(/\s+/g, "") // 공백 제거
      .replace(/\n/g, "") // 줄바꿈 제거
      .replace(/[()]/g, "") // 괄호 제거
      .trim();
  };
  const keyMap: Record<string, string> = {};
  [
    ["견적번호", "estimateNum"],
    ["상태", "status"],
    ["부서(팀)", "department"],
    ["영업담당자", "salesManager"],
    ["견적담당자", "manager"],
    ["요청일", "requestDate"],
    ["회신일", "replyDate"],
    ["견적유효기간", "validUntil"],
    ["업체명", "company"],
    ["대분류", "category"],
    ["상품", "product"],
    ["규격스팩", "spec"],
    ["영업정보", "salesInfo"],
    ["비고", "note"],
    ["추가정보필요사항", "extraInfo"],
    ["샘플필요여부", "sampleRequired"],
    ["인쇄", "printing"],
    ["색상도수", "color"],
    ["MOQ", "moq"],
    ["사용량월평균", "monthlyUsage"],
    ["사용금액월평균", "monthlyAmount"],
    ["지역착지", "region"],
    ["기타요청", "requestNote"],
    ["견적가매입", "purchasePrice"],
    ["제안규격", "proposedSpec"],
    ["공급사", "supplier"],
    ["수주여부", "orderStatus"],
    ["원본데이터", "rawText"],
    ["견적금액", "quoteAmount"],
    ["견적담당자비고", "quoteMemo"],
    ["견적담당자메일", "managerEmail"],
    ["영업담당자메일", "salesManagerEmail"],
  ].forEach(([kor, eng]) => {
    keyMap[normalizeKey(kor)] = eng;
  });

  const header = data?.[0] ?? [];
  const filteredRows = useMemo(() => {
    const h = data?.[0] ?? [];
    const rows = data?.length ? data.slice(1) : [];
    const managerColIndex = h.indexOf("견적담당자");
    const salesManagerColIndex = h.indexOf("영업담당자");
    const companyColIndex = h.indexOf("업체명");
    const requestDateColIndex = h.indexOf("요청일");
    const statusColIndex = h.indexOf("상태");
    return rows.filter((row) => {
      if (searchManager.trim() !== "") {
        const cellValue = row[managerColIndex];
        if (!cellValue || !String(cellValue).toLowerCase().includes(searchManager.toLowerCase())) return false;
      }
      if (searchSalesManager.trim() !== "") {
        const cellValue = row[salesManagerColIndex];
        if (!cellValue || !String(cellValue).toLowerCase().includes(searchSalesManager.toLowerCase())) return false;
      }
      if (searchCompany.trim() !== "") {
        const cellValue = row[companyColIndex];
        if (!cellValue || !String(cellValue).toLowerCase().includes(searchCompany.toLowerCase())) return false;
      }
      if (searchReqDate.trim() !== "") {
        const cellValue = row[requestDateColIndex];
        if (!cellValue || !String(cellValue).toLowerCase().includes(searchReqDate.toLowerCase())) return false;
      }
      if (searchStts.trim() !== "") {
        const cellValue = row[statusColIndex];
        if (!cellValue || !String(cellValue).toLowerCase().includes(searchStts.toLowerCase())) return false;
      }
      return true;
    });
  }, [data, searchManager, searchSalesManager, searchCompany, searchReqDate, searchStts]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePage, pageSize]);

  const enabledIndexes = useMemo(
    () => (data?.[0] ?? []).map((h: string, i: number) => (activeColumns.includes(h) ? i : -1)).filter((i: number) => i >= 0),
    [data, activeColumns]
  );

  const getSortIcon = (colName: string) => {
    if (sortColumn !== colName) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-600" />
    );
  };

  const getHeaderLabel = (colName: string) => {
    const t = colName.toString().replace(/ /g, "").trim();
    if (t === "사용금액(월평균)") return "사용금액";
    if (t === "사용량(월평균)") return "사용량";
    if (t === "지역(착지)") return "도착지";
    return colName;
  };

  const statusVal = (r: string[]) => r[header.indexOf("상태")]?.toString().replace(/ /g, "").trim() || "";

  // 영업 담당자 이메일 발송 (견적 금액 자동 반영 포함)
  const sendEmailToSalesManager = async (
    rowObj: Record<string, any>,
    e: any
  ) => {
    // ✅ 안전하게 정규화된 keyMap

    // ✅ 한글 → 영문 key 변환 함수
    const convertKeysToEnglish = (obj: Record<string, any>) => {
      const result: Record<string, any> = {};
      Object.entries(obj).forEach(([key, value]) => {
        const normalizedKey = normalizeKey(key); // 💡 여기서 한글 key 정규화
        const newKey = keyMap[normalizedKey] || normalizedKey;
        result[newKey] = value;
      });
      return result;
    };

    const row = convertKeysToEnglish(rowObj);
    const estimateNum = row.estimateNum;
    const newAmount = editedAmounts[estimateNum]; // 사용자가 수정한 input 값
    const amount = row.quoteAmount || "";
    const newMemo = editedMemo[estimateNum]; // 사용자가 수정한 input 값
    const memo = row.quoteMemo || "";

    if (row.manager === "미지정" || !row.manager) {
      alert(
        "견적 담당자가 미지정 상태입니다. 견적 담당자를 먼저 지정해 주세요."
      );
      return;
    }
    if (
      (newAmount && newAmount !== amount.toString()) ||
      (newMemo && newMemo !== memo)
    ) {
      const confirmUpdate = window.confirm(
        `행에 저장되지 않은 값이 있습니다. 값을 먼저 업데이트하신 후 메일을 발송하시겠습니까?`
      );
      let action = "";
      if (newMemo && !newAmount) {
        action = "memo";
      } else if (!newMemo && newAmount) {
        action = "cost";
      } else {
        action = "all";
      }
      if (confirmUpdate) {
        try {
          const payload = {
            mode: "console",
            action: `updateEstimate-${action}`,
            estimateNum,
            newAmount: newAmount,
            newMemo: newMemo,
          };

          // 업데이트 먼저 수행
          const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const result = await res.json();
          if (result.status === "fail") {
            throw new Error(
              result.message ||
              "비고 저장에 실패하였습니다. 관리자에게 문의하세요."
            );
          }
          await new Promise((r) => setTimeout(r, 1200));
        } catch (err) {
          console.error("행 업데이트 중 오류:", err);
          alert("행 업데이트 중 오류가 발생했습니다.");
          return;
        }
      }
    }

    if (!window.confirm("영업 담당자에게 견적 확정 메일을 발송하시겠습니까?")) { 
      return;
    }
    if (!row.salesManager) {
      alert("영업 담당자가 기입되지 않았습니다.\n다시 확인해 주세요.");
      return;
    }
    // 이메일 값이 '발송 전' 등으로 잘못 매핑되면 Gmail 발송이 실패하므로 사전 검증
    const salesEmail = String(row.salesManagerEmail || "").trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(salesEmail);
    if (!emailOk) {
      alert(
        "영업 담당자 메일이 올바르지 않습니다.\n" +
        `현재 값: ${salesEmail || "(비어있음)"}\n` +
        "시트의 '영업담당자메일' 컬럼을 확인해 주세요."
      );
      return;
    }

    try {
      const cleanNewAmount = String(newAmount)
        .replace(/[^\d.-]/g, "")
        .trim();
      const cleanOldAmount = String(row.quoteAmount)
        .replace(/[^\d.-]/g, "")
        .trim();

      if (
        cleanNewAmount &&
        cleanOldAmount &&
        Number(cleanNewAmount) !== Number(cleanOldAmount)
      ) {
        row.quoteAmount = Number(cleanNewAmount);
      }
      if (row.quoteMemo !== newMemo) {
        row.quoteMemo = newMemo;
      }

      const payload = {
        mode: "console",
        action: "sendToSalesManager",
        row,
      };
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      console.log("메일 발송 응답:", result);
      // 백엔드에서 status: "error" 로 내려오는 케이스도 실패로 처리
      if (result.status !== "success") {
        throw new Error(
          result.message || "메일 발송에 실패하였습니다. 관리자에게 문의하세요."
        );
      }
      alert("메일 발송이 완료되었습니다.");
      setTimeout(() => {
        loadData();
      }, 1200);
    } catch (e) {
      alert("메일 발송 중 오류가 발생했습니다.\n" + e);
      console.error("메일 발송 오류:", e);
    }
  };

  // 테이블 렌더링
  const renderTable = () => {
    if (!data || data.length === 0) {
      return null;
    }
    const modalTriggerSet = new Set(DETAIL_MODAL_TRIGGER_COLUMNS.map((c) => c.toString().trim()));
    return (
      <div className="overflow-y-auto min-h-[400px]" ref={tableRef}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">견적 목록</h3>
          <Button type="button" variant="gray" onClick={loadData}>
            <RefreshCcwIcon className="w-4 h-4" /> 새로고침
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {enabledIndexes.map((i) => {
                    const colName = header[i];
                    const isSortable = SORTABLE_COLUMNS.includes(colName);
                    return (
                      <th
                        key={i}
                        onClick={() => isSortable && handleSort(colName)}
                        className={`max-w-[150px] px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 ${isSortable ? "cursor-pointer hover:bg-gray-100" : ""
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {getHeaderLabel(colName)}
                          {isSortable ? getSortIcon(colName) : null}
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    진행 상태
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={enabledIndexes.length + 1} className="px-3 py-8 text-center text-sm text-gray-500">
                      데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, rowIdx) => {
                    const estimateNum = row[header.indexOf("견적번호")];
                    const st = statusVal(row);
                    return (
                      <tr
                        key={estimateNum || rowIdx}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {enabledIndexes.map((i) => {
                          const colName = header[i];
                          const value = row[i];
                          const viewValue = value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") ?? "";

                          if (colName.toString().replace(/ /g, "").trim() === "견적담당자비고") {
                            const memoValue = editedMemo[estimateNum] ?? value ?? "";
                            return (
                              <td key={i} className="max-w-[150px] px-3 py-2 text-sm text-gray-900" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-1 min-w-0">
                                  <input
                                    type="text"
                                    placeholder={String(memoValue)}
                                    defaultValue={memoValue}
                                    onChange={(e) =>
                                      setEditedMemo((prev) => ({ ...prev, [estimateNum]: e.target.value }))
                                    }
                                    className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      sendMemo(estimateNum, value ?? "", editedMemo[estimateNum] ?? value ?? "");
                                    }}
                                  >
                                    저장
                                  </Button>

                                </div>
                              </td>
                            );
                          }
                          if (colName.toString().replace(/ /g, "").trim() === "견적금액") {
                            const amountValue = editedAmounts[estimateNum] ?? value ?? "";
                            return (
                              <td key={i} className="max-w-[150px] px-3 py-2 text-sm text-gray-900" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-1 min-w-0">
                                  <input
                                    type="number"
                                    placeholder={viewValue}
                                    value={amountValue}
                                    onChange={(e) =>
                                      setEditedAmounts((prev) => ({ ...prev, [estimateNum]: e.target.value }))
                                    }
                                    className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      sendEstimate(estimateNum, value ?? "", amountValue);
                                    }}
                                  >
                                    저장
                                  </Button>
                                </div>
                              </td>
                            );
                          }

                          // 특정 컬럼 값 클릭 시에만 상세 모달 오픈
                          if (modalTriggerSet.has(colName?.toString().trim())) {
                            return (
                              <td key={i} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                <Button
                                  type="button"
                                  variant="link"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rowObj = header.reduce((acc, key, idx) => {
                                      acc[key] = row[idx];
                                      return acc;
                                    }, {} as Record<string, string>);
                                    setSelectedRow(rowObj);
                                  }}
                                  title="상세 보기"
                                >
                                  <span className="line-clamp-2 break-words">{formatCell(value)}</span>
                                </Button>
                              </td>
                            );
                          }

                          return (
                            <td key={i} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              <span className="line-clamp-2 break-words">{formatCell(value)}</span>
                            </td>
                          );
                        })}

                        <td className="px-3 py-2 text-sm" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            className={`whitespace-nowrap ${getStatusColor(st)} border-0`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const rowObj = header.reduce((acc, key, idx) => {
                                acc[key] = row[idx];
                                return acc;
                              }, {} as Record<string, string>);
                              sendEmailToSalesManager(rowObj, e);
                            }}
                          >
                            {row[header.indexOf("상태")]}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {
          filteredRows.length > 0 && (
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              total={filteredRows.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSizeOptions={[10, 15, 30, 50]}
            />
          )
        }
      </div >
    );
  };

  // go to top
  const tableRef = useRef<HTMLDivElement>(null);

  const goToTop = () => {
    if (tableRef.current) {
      tableRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const clearFilter = () => {
    setSearchManager("");
    setSearchSalesManager("");
    setSearchCompany("");
    setSearchReqDate("");
    setSearchStts("");
  };
  const searchFilter = (key: any, value: string) => {
    if (key === "manager") {
      setSearchManager(value);
    } else if (key === "salesManager") {
      setSearchSalesManager(value);
    } else if (key === "company") {
      setSearchCompany(value);
    } else if (key === "requestDate") {
      setSearchReqDate(value);
    } else if (key === "status") {
      setSearchStts(value);
    }
  };
  return (
    <>
      <div id="console" className="max-w-[90dvw] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Button
          type="button"
          id="top"
          variant="outline"
          onClick={goToTop}
          className="fixed bottom-8 right-8 z-[999]  rounded-full shadow-lg"
        >
          <ChevronsUpIcon className="w-5" /></Button>
        {loading && <LoadingOverlay message="견적 목록을 불러오는 중..." />}
        {location.pathname.includes("console") ? (
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">견적 관리 (관리자)</h2>
            <p className="mt-1 text-gray-600 font-medium text-sm">견적 목록을 검색·관리할 수 있습니다.</p>
          </div>
        ) : null}
        {allColumns.length > 0 && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2   
          gap-4" style={{ gridTemplateColumns: 'repeat(5, 3fr) 1fr' }}>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">견적 담당자</label>
              <input
                data-key="manager"
                placeholder="검색"
                type="text"
                value={searchManager}
                onChange={(e) => searchFilter(e.target.dataset.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">영업 담당자</label>
              <input
                data-key="salesManager"
                placeholder="검색"
                type="text"
                value={searchSalesManager}
                onChange={(e) => searchFilter(e.target.dataset.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">요청일</label>
              <input
                data-key="requestDate"
                type="date"
                value={searchReqDate}
                onChange={(e) => searchFilter(e.target.dataset.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">업체명</label>
              <input
                data-key="company"
                placeholder="검색"
                type="text"
                value={searchCompany}
                onChange={(e) => searchFilter(e.target.dataset.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">진행 상태</label>
              <select
                data-key="status"
                value={searchStts}
                onChange={(e) => searchFilter(e.target.dataset.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">전체</option>
                <option value="접수전">접수전</option>
                <option value="접수진행중">접수진행중</option>
                <option value="발송완료">발송완료</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button type="button" variant="ghost" fullWidth onClick={clearFilter}>
                초기화
              </Button>
            </div>
          </div>
        )}

        {renderTable()}

        {selectedRow && (
          <ConsoleDetail
            formatCell={formatCell}
            row={selectedRow}
            headerOrder={data?.[0] ?? []}
            editedAmounts={editedAmounts}
            setEditedAmounts={setEditedAmounts}
            editedMemo={editedMemo}
            setEditedMemo={setEditedMemo}
            onSaveAll={sendEstimateAll}
            onClose={() => setSelectedRow(null)}
          />
        )}
      </div>
    </>
  );
};

export default Console;
