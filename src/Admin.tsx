import React, { useEffect, useRef, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
import "./assets/styles/admin.scss";
import "./assets/styles/loader.css";
import "./assets/styles/common.scss";
import AdminDetail from "./AdminDetail.tsx";
import { BiSolidToTop } from "react-icons/bi";
import {
  MdOutlineKeyboardArrowUp,
  MdOutlineKeyboardArrowDown,
} from "react-icons/md";

interface FetchResponse {
  status: string;
  message?: string;
  data?: string[][];
}

/* interface Props {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<string>>;
} */

const API_URL = "https://icy-sea-0bb9.kkhhsq.workers.dev";

const DEFAULT_COLUMNS = [
  "견적번호",
  "상태",
  "영업담당자",
  "견적담당자",
  "요청일",
  "업체명",
  "상품",
  "규격(스팩)",
  "비고(제품 추가 정보)",
  "견적 금액",
];

const Admin: React.FC<any> = () => {
  // const navigate = useNavigate();
  // const location = useLocation();
  // const userName = localStorage.getItem("userName");

  const [status, setStatus] = useState<string>("⏳ 데이터 불러오는 중...");
  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [activeColumns, setActiveColumns] = useState<string[]>([]);
  const [data, setData] = useState<string[][]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<Record<string, string> | null>(
    null
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}?mode=admin&action=readAll`);
      const text = await res.text();
      let json: FetchResponse;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("서버 응답이 JSON이 아닙니다: " + text);
      }

      if (json.status === "success" && json.data) {
        const tableData = json.data;
        setData(tableData);
        setAllColumns(tableData[0]);
        setActiveColumns(
          tableData[0].filter((h) => DEFAULT_COLUMNS.includes(h))
        );
        setStatus("");
      } else {
        setStatus(json.message || "데이터 로드 실패");
      }
    } catch (err) {
      console.error("loadData 오류:", err);
      setStatus("❌ 데이터 불러오기 실패");
    } finally {
      setLoading(false);
    }
  };

  // 열 토글
  const toggleColumn = (col: string) => {
    setActiveColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
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

  useEffect(() => {
    console.log("loading:", loading);
  }, [loading]);
  // 견적 금액 수정
  const sendEstimate = async (estimateNum: string, newAmount: string) => {
    if (!newAmount.trim()) {
      alert("금액을 입력하세요.");
      return;
    }

    const confirmSend = window.confirm(
      `견적번호 ${estimateNum}의 금액을 ${newAmount}으로 저장할까요?`
    );
    if (!confirmSend) return;

    setLoading(true);

    const payload = {
      mode: "admin",
      action: "updateEstimate",
      estimateNum,
      newAmount,
    };
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.text();
      console.log("서버 응답:", result);
      alert("✅ 견적 저장 요청 완료");
    } catch (err) {
      console.error("전송 오류:", err);
      alert("❌ 서버 전송 실패");
    } finally {
      loadData();
    }
  };

  // 테이블 렌더링
  const renderTable = () => {
    if (!data || data.length === 0) return <p>데이터 없음</p>;

    const header = data[0];
    if (data[0][13]?.toString() === "비고(제품 추가 정보)") {
      data[0][13] = "비고";
    }
    const rows = data.slice(1);
    const enabledIndexes = header
      .map((h, i) => (activeColumns.includes(h) ? i : -1))
      .filter((i) => i >= 0);

    return (
      <div className="table-wrapper" ref={tableRef}>
        {loading ? (
          <div className="loader_area">
            <div className="loader" />
          </div>
        ) : (
          <></>
        )}

        <table id="dataTable">
          <thead>
            <tr className="th_tr">
              {enabledIndexes.map((i) => (
                <th
                  key={i}
                  onClick={() => handleSort(header[i])}
                  style={{ cursor: "pointer", userSelect: "none" }}
                >
                  {header[i]}
                  {sortColumn === header[i] &&
                    (sortDirection === "asc" ? (
                      <MdOutlineKeyboardArrowUp fontSize={"1.5rem"} />
                    ) : (
                      <MdOutlineKeyboardArrowDown fontSize={"1.5rem"} />
                    ))}
                </th>
              ))}
              <th>견적 금액 수정</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => {
              const estimateNum = row[header.indexOf("견적번호")];
              const amount = row[header.indexOf("견적 금액")];

              return (
                <tr
                  key={rowIdx}
                  onClick={() => {
                    // ✅ header와 row를 객체로 매핑
                    const rowObj = header.reduce((acc, key, idx) => {
                      acc[key] = row[idx];
                      return acc;
                    }, {} as Record<string, string>);
                    setSelectedRow(rowObj);
                  }}
                >
                  {enabledIndexes.map((i) => (
                    <td key={i}>{formatCell(row[i])}</td>
                  ))}
                  <td
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <input
                      type="number"
                      defaultValue={amount}
                      id={`amount-${estimateNum}`}
                      style={{ width: "100px" }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // 클릭 시 상세창 열리지 않게
                        const inputEl = document.getElementById(
                          `amount-${estimateNum}`
                        ) as HTMLInputElement | null;
                        sendEstimate(estimateNum, inputEl?.value || "");
                      }}
                    >
                      저장
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // go to top
  const tableRef = useRef<HTMLDivElement>(null);

  const goToTop = () => {
    if (tableRef.current) {
      tableRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div id="admin">
      <div className="header">
        <h2>견적 관리 (관리자)</h2>
        <button id="top" style={{ fontSize: "1.5rem" }} onClick={goToTop}>
          <BiSolidToTop />
        </button>
      </div>

      {status && <div id="status">{status}</div>}

      {allColumns.length > 0 && (
        <div id="columnFilter">
          <h3>표시할 열 선택</h3>
          <div className="labelArea">
            {allColumns.map((col) => (
              <label key={col}>
                <input
                  type="checkbox"
                  checked={activeColumns.includes(col)}
                  onChange={() => toggleColumn(col)}
                />
                {col}
              </label>
            ))}
          </div>
        </div>
      )}

      {renderTable()}

      {selectedRow && (
        <AdminDetail
          formatCell={formatCell}
          row={selectedRow}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </div>
  );
};

export default Admin;
