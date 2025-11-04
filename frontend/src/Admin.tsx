import React, { useEffect, useRef, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
import "./assets/styles/admin.scss";
import "./assets/styles/loader.css";
import "./assets/styles/common.scss";
import AdminDetail from "./AdminDetail.tsx";
import { MdKeyboardDoubleArrowUp } from "react-icons/md";
import {
  MdOutlineKeyboardArrowUp,
  MdOutlineKeyboardArrowDown,
} from "react-icons/md";
import { IoReload } from "react-icons/io5";
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
  /*   "비고" ||  */ "비고(제품 추가 정보)",
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
  const [sortColumn, setSortColumn] = useState<string | null>("요청일");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [isSend, setIsSend] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<Record<string, string> | null>(
    null
  );

  const [editedAmounts, setEditedAmounts] = useState<Record<string, string>>(
    {}
  );
  useEffect(() => {
    loadData();

    if (!sortColumn) {
      handleSort("요청일");
      setSortDirection("desc");
    }
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
        // setTimeout(() => handleSort("요청일"), 0);
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
  useEffect(() => {
    console.log("data:", data);
    if (data.length > 1) {
      renderTable();
    }
  }, [data]);
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
    console.log("colName", colName);

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
      setLoading(true);
      setTimeout(() => {
        loadData();
      }, 3000);
    }
  };

  // 영업 담당자 이메일 발송
  // const sendEmailToSalesManager = async (rowObj: object, e: any) => {
  //   // key 변환 매핑 테이블
  //   const keyMap: Record<string, string> = {
  //     견적번호: "estimateNum",
  //     상태: "status",
  //     "부서(팀)": "department",
  //     영업담당자: "salesManager",
  //     견적담당자: "manager",
  //     요청일: "requestDate",
  //     회신일: "replyDate",
  //     "견적 유효기간": "validUntil",
  //     업체명: "company",
  //     대분류: "category",
  //     상품: "product",
  //     "규격(스팩)": "spec",
  //     "영업 정보": "salesInfo",
  //     비고: "note",
  //     "추가 정보 필요사항": "extraInfo",
  //     "샘플 필요여부": "sampleRequired",
  //     인쇄: "printing",
  //     "색상,도수": "color",
  //     MOQ: "moq",
  //     "사용량\n (月 평균)": "monthlyUsage",
  //     "사용금액\n (月 평균)": "monthlyAmount",
  //     "지역(착지)": "region",
  //     기타요청: "requestNote",
  //     "견적가(매입)": "purchasePrice",
  //     제안규격: "proposedSpec",
  //     공급사: "supplier",
  //     수주여부: "orderStatus",
  //     원본데이터: "rawText",
  //     "견적 금액": "quoteAmount",
  //     "메일 발송 상태": "mailStatus",
  //   };
  //   function convertKeysToEnglish(obj: Record<string, any>) {
  //     const result: Record<string, any> = {};
  //     Object.entries(obj).forEach(([key, value]) => {
  //       const newKey = keyMap[key] || key;
  //       result[newKey] = value;
  //     });
  //     return result;
  //   }
  //   const row = convertKeysToEnglish(rowObj);

  //   if (!row.salesManager) {
  //     alert("영업 담당자가 기입되지 않았습니다.\n다시 확인해 주세요.");
  //     return;
  //   }
  //   // console.log(row, row.estimateNum, row.salesManager);
  //   if (!window.confirm("영업 담당자에게 견적 확정 메일을 발송하시겠습니까?")) {
  //     return;
  //   } else {
  //     console.log(editedAmounts[row.estimateNum])
  //     if (editedAmounts[row.estimateNum] && editedAmounts[row.estimateNum] !== row.quoteAmount) {
  //       row.quoteAmount = editedAmounts[row.estimateNum];
  //     }
  //     try {
  //       const payload = {
  //         mode: "admin",
  //         action: "sendToSalesManager",
  //         row,
  //       };
  //       const res = await fetch(API_URL, {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify(payload),
  //       });

  //       alert("발송이 완료되었습니다.");
  //       setIsSend(true);
  //       console.log("res:", res);
  //     } catch (e) {
  //       alert("오류가 발생했습니다. " + e);
  //       throw new Error("오류가 발생했습니다. " + e);
  //     } finally {
  //       setLoading(true);
  //       setTimeout(() => {
  //         loadData();
  //       }, 2000);
  //     }
  //   }
  // };
  // 영업 담당자 이메일 발송 (견적 금액 자동 반영 포함)
  const sendEmailToSalesManager = async (
    rowObj: Record<string, any>,
    e: any
  ) => {
    const keyMap: Record<string, string> = {
      견적번호: "estimateNum",
      상태: "status",
      "부서(팀)": "department",
      영업담당자: "salesManager",
      견적담당자: "manager",
      요청일: "requestDate",
      회신일: "replyDate",
      "견적 유효기간": "validUntil",
      업체명: "company",
      대분류: "category",
      상품: "product",
      "규격(스팩)": "spec",
      "영업 정보": "salesInfo",
      비고: "note",
      "추가 정보 필요사항": "extraInfo",
      "샘플 필요여부": "sampleRequired",
      인쇄: "printing",
      "색상,도수": "color",
      MOQ: "moq",
      "사용량\n (月 평균)": "monthlyUsage",
      "사용금액\n (月 평균)": "monthlyAmount",
      "지역(착지)": "region",
      기타요청: "requestNote",
      "견적가(매입)": "purchasePrice",
      제안규격: "proposedSpec",
      공급사: "supplier",
      수주여부: "orderStatus",
      원본데이터: "rawText",
      "견적 금액": "quoteAmount",
      "메일 발송 상태": "mailStatus",
    };

    // 한글 → 영문 key 변환
    const convertKeysToEnglish = (obj: Record<string, any>) => {
      const result: Record<string, any> = {};
      Object.entries(obj).forEach(([key, value]) => {
        const newKey = keyMap[key] || key;
        result[newKey] = value;
      });
      return result;
    };

    const row = convertKeysToEnglish(rowObj);
    const estimateNum = row.estimateNum;
    const inputValue = editedAmounts[estimateNum]; // 사용자가 수정한 input 값
    const amount = row.quoteAmount || "";

    // 1️⃣ 견적 금액 자동 반영 로직
    if (inputValue && inputValue !== amount) {
      const confirmUpdate = window.confirm(
        `견적 금액(${inputValue})을 저장한 후 메일을 발송할까요?`
      );
      if (!confirmUpdate) return;

      try {
        const payload = {
          mode: "admin",
          action: "updateEstimate",
          estimateNum,
          newAmount: inputValue,
        };

        // 금액 업데이트 먼저 수행
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const text = await res.text();
        console.log("견적 금액 업데이트 응답:", text);
        alert("견적 금액이 먼저 저장되었습니다.");

        // ⚠️ 백엔드(GAS) 반영 대기
        await new Promise((r) => setTimeout(r, 1200));
      } catch (err) {
        console.error("견적 금액 저장 중 오류:", err);
        alert("견적 금액 저장 중 오류가 발생했습니다.");
        return;
      }
    }

    if (!row.quoteAmount) {
      if (
        !window.confirm(
          "견적 금액이 기입되지 않았습니다. 이대로 영업 담당자에게 발송하시겠습니까?"
        )
      ) {
        return;
      }
    } else {
      if (
        !window.confirm("영업 담당자에게 견적 확정 메일을 발송하시겠습니까?")
      ) {
        return;
      }
    } 
    if (!row.salesManager) {
      alert("영업 담당자가 기입되지 않았습니다.\n다시 확인해 주세요.");
      return;
    }

    try {
      const payload = {
        mode: "admin",
        action: "sendToSalesManager",
        row,
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.text();
      console.log("메일 발송 응답:", result);
      alert("📩 메일 발송이 완료되었습니다.");

      // 데이터 갱신
      setTimeout(() => {
        loadData();
      }, 1200);
    } catch (e) {
      alert("메일 발송 중 오류가 발생했습니다. " + e);
      console.error("메일 발송 오류:", e);
    }
  };

  // 테이블 렌더링
  const renderTable = () => {
    if (!data || data.length === 0) {
      if (status !== "⏳ 데이터 불러오는 중...") {
        return <p>데이터 없음</p>;
      }
      return;
    }
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

        <div id="dataTable">
          <div className="thead">
            <div className="tr th_tr">
              {enabledIndexes.map((i) => (
                <div
                  className="th"
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
                </div>
              ))}
              <div className="th">견적 금액 수정</div>
              <div className="th">메일 발송</div>
            </div>
          </div>
          <div className="tbody">
            {rows.map((row, rowIdx) => {
              const estimateNum = row[header.indexOf("견적번호")];
              const amount = row[header.indexOf("견적 금액")];
              return (
                <div
                  className="tr"
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
                    <div className="td" key={i}>
                      {formatCell(row[i])}
                    </div>
                  ))}
                  <div
                    className="td"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <input
                      type="number"
                      value={editedAmounts[estimateNum] ?? amount ?? ""} // ✅ data와 상태 동기화
                      onChange={(e) => {
                        setEditedAmounts((prev) => ({
                          ...prev,
                          [estimateNum]: e.target.value,
                        }));
                      }}
                      style={{ width: "100px" }}
                    />

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newAmount =
                          editedAmounts[estimateNum] ?? amount ?? "";
                        sendEstimate(estimateNum, newAmount);
                      }}
                    >
                      저장
                    </button>
                    {/* 
                    <input
                      type="number"
                      defaultValue={amount}
                      id={`amount-${estimateNum}`}
                      style={{ width: "100px" }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const inputEl = document.getElementById(
                          `amount-${estimateNum}`
                        ) as HTMLInputElement | null;
                        sendEstimate(estimateNum, inputEl?.value || "");
                      }}
                    >
                      저장
                    </button> */}
                  </div>
                  <div
                    className="td"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <button
                      className="warning"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rowObj = header.reduce((acc, key, idx) => {
                          acc[key] = row[idx];
                          return acc;
                        }, {} as Record<string, string>);
                        // setSelectedRow(rowObj);
                        sendEmailToSalesManager(rowObj, e);
                      }}
                    >
                      {row[header.indexOf("메일 발송 상태")]}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
      <div className="admin_header">
        <h2>견적 관리 (관리자)</h2>
        <button className="reload info" onClick={loadData}>
          <IoReload />
          {/* 표 새로고침 */}
        </button>
      </div>
      <button id="top" onClick={goToTop}>
        <MdKeyboardDoubleArrowUp />
      </button>

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
