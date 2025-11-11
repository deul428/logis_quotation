import React, { useEffect, useRef, useState } from "react";
import "./assets/styles/console.scss";
import "./assets/styles/loader.css";
import "./assets/styles/common.scss";
import ConsoleDetail from "./ConsoleDetail.tsx";
import { MdKeyboardDoubleArrowUp } from "react-icons/md";
import {
  MdOutlineKeyboardArrowUp,
  MdOutlineKeyboardArrowDown,
  MdLogout,
} from "react-icons/md";
import { IoReload } from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./Header.tsx";
interface FetchResponse {
  status: string;
  message?: string;
  data?: string[][];
}
interface ChildProps {
  tabData: string;
  setTabData: React.Dispatch<React.SetStateAction<string>>;
}

const API_URL = "https://icy-sea-0bb9.kkhhsq.workers.dev";

const DEFAULT_COLUMNS = [
  "견적번호",
  // "상태",
  "영업담당자",
  "견적담당자",
  "요청일",
  "업체명",
  "상품",
  "규격(스팩)",
  // "견적요청비고",
  "인쇄",
  "사용량(월평균)",
  "사용금액(월평균)",
  "지역(착지)",
  "기타요청",
  "견적가(매입)",
  "공급사",
  "견적담당자 비고",
  "견적 금액",
];

const Console: React.FC<any> = ({ ChildProps: tabData, setTabData }) => {
  // const navigate = useNavigate();
  // const location = useLocation();
  // const userName = localStorage.getItem("userName");

  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [activeColumns, setActiveColumns] = useState<string[]>([]);
  const [data, setData] = useState<string[][]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>("견적번호");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchManager, setSearchManager] = useState<string>("");
  const [searchSalesManager, setSearchSalesManager] = useState<string>("");
  const [searchCompany, setSearchCompany] = useState<string>("");
  const [searchReqDate, setSearchReqDate] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<Record<string, string> | null>(
    null
  );

  const [editedAmounts, setEditedAmounts] = useState<Record<string, string>>(
    {}
  );

  const [editedMemo, setEditedMemo] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const loggedIn = localStorage.getItem("isLoggedIn");
  const userId = localStorage.getItem("userId");
  const location = useLocation();
  useEffect(() => {
    loadData();

    if (!sortColumn) {
      handleSort("견적번호");
      setSortDirection("desc");
    }
  }, []);

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
  const sendEstimate = async (
    estimateNum: string,
    pastAmount: string,
    newAmount: string
  ) => {
    console.log(estimateNum, pastAmount, newAmount);
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
      const result = await res.text();
      console.log("서버 응답:", result);
      alert("✅ 견적 저장 요청 완료");
    } catch (err) {
      console.error("전송 오류:", err);
      alert("❌ 서버 전송 실패");
    } finally {
      setLoading(false);
      setTimeout(() => {
        loadData();
      }, 3000);
    }
  };
  const sendMemo = async (
    estimateNum: string,
    pastMemo: string,
    newMemo: string
  ) => {
    console.log(estimateNum, pastMemo, newMemo);
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
      const result = await res.text();
      console.log("서버 응답:", result);
      alert("✅ 비고 저장 완료");
    } catch (err) {
      console.error("전송 오류:", err);
      alert("❌ 서버 전송 실패");
    } finally {
      setLoading(false);
      setTimeout(() => {
        loadData();
      }, 3000);
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
    ["메일발송상태", "mailStatus"],
  ].forEach(([kor, eng]) => {
    keyMap[normalizeKey(kor)] = eng;
  });

  useEffect(() => {
    console.log(editedMemo, editedAmounts);
  }, [editedMemo, editedAmounts]);
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

    // 1️⃣ 견적 금액 자동 반영 로직
    /*     if (inputValue && inputValue !== amount) {
      const confirmUpdate = window.confirm(
        `견적 금액을 저장한 후 메일을 발송할까요?`
      );
      if (confirmUpdate) {
        try {
          const payload = {
            mode: "console",
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
    }
 */
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
          const text = await res.text();
          alert("행 업데이트가 반영되었습니다.");

          // ⚠️ 백엔드(GAS) 반영 대기
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

    try {
      if (Number(newAmount) !== Number(row.quoteAmount)) {
        row.quoteAmount = Number(newAmount);
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

      const result = await res.text();
      console.log("메일 발송 응답:", result);
    } catch (e) {
      alert("메일 발송 중 오류가 발생했습니다. " + e);
      console.error("메일 발송 오류:", e);
    } finally {
      alert("📩 메일 발송이 완료되었습니다.");
      // 데이터 갱신
      setTimeout(() => {
        loadData();
      }, 1200);
    }
  };

  // 테이블 렌더링
  const renderTable = () => {
    if (!data || data.length === 0) {
      return;
    }
    const header = data[0];
    const rows = data.slice(1);

    // ✅ 각 필터에 해당하는 열 인덱스 찾기
    const managerColIndex = header.indexOf("견적담당자");
    const salesManagerColIndex = header.indexOf("영업담당자");
    const companyColIndex = header.indexOf("업체명");
    const reqDateColIndex = header.indexOf("요청일");

    // ✅ 여러 검색어가 있으면 AND 조건으로 필터링
    const filteredRows = rows.filter((row) => {
      // 견적 담당자 필터
      if (searchManager.trim() !== "") {
        const cellValue = row[managerColIndex];
        if (!cellValue) return false;
        if (
          !String(cellValue).toLowerCase().includes(searchManager.toLowerCase())
        ) {
          return false;
        }
      }

      // 영업 담당자 필터
      if (searchSalesManager.trim() !== "") {
        const cellValue = row[salesManagerColIndex];
        if (!cellValue) return false;
        if (
          !String(cellValue)
            .toLowerCase()
            .includes(searchSalesManager.toLowerCase())
        ) {
          return false;
        }
      }

      // 업체명 필터
      if (searchCompany.trim() !== "") {
        const cellValue = row[companyColIndex];
        if (!cellValue) return false;
        if (
          !String(cellValue).toLowerCase().includes(searchCompany.toLowerCase())
        ) {
          return false;
        }
      }
      // 요청일 필터
      if (searchReqDate.trim() !== "") {
        const cellValue = row[reqDateColIndex];
        console.log(searchReqDate);
        if (!cellValue) return false;
        if (
          !String(cellValue).toLowerCase().includes(searchReqDate.toLowerCase())
        ) {
          return false;
        }
      }

      return true;
    });

    const enabledIndexes = header
      .map((h, i) => (activeColumns.includes(h) ? i : -1))
      .filter((i) => i >= 0);
    return (
      <div className="table_wrapper" ref={tableRef}>
        {/* {loading ? (
          <div className="loader_area">
            <div className="loader" />
          </div>
        ) : (
          <></>
        )} */}
        <div className="list_info">
          <h3>견적 목록</h3>
          <button className="reload info" onClick={loadData}>
            <IoReload />
          </button>
        </div>

        <div className="dataTable">
          <div className="thead">
            <div className="tr th_tr">
              {enabledIndexes.map((i) => {
                const colName = header[i];
                const engKey = keyMap[normalizeKey(colName)] || "unknown";
                return (
                  <div
                    className={`th ${engKey}`}
                    key={i}
                    onClick={() => handleSort(header[i])}
                    style={{ cursor: "pointer", userSelect: "none" }}
                  >
                    {header[i].toString().replace(/ /g, "").trim() ===
                    "사용금액(월평균)"
                      ? "사용금액"
                      : header[i].toString().replace(/ /g, "").trim() ===
                        "사용량(월평균)"
                      ? "사용량"
                      : header[i].toString().replace(/ /g, "").trim() ===
                        "지역(착지)"
                      ? "도착지"
                      : header[i]}
                    {sortColumn === header[i] &&
                      (sortDirection === "asc" ? (
                        <MdOutlineKeyboardArrowUp fontSize={"1.5rem"} />
                      ) : (
                        <MdOutlineKeyboardArrowDown fontSize={"1.5rem"} />
                      ))}
                  </div>
                );
              })}
              <div className="th sendMail">메일 발송</div>
            </div>
          </div>
          <div className="tbody">
            {filteredRows.map((row, rowIdx) => {
              const estimateNum = row[header.indexOf("견적번호")];
              const amount = row[header.indexOf("견적 금액")];

              return (
                <div
                  className="tr"
                  key={estimateNum || rowIdx}
                  onClick={() => {
                    const rowObj = header.reduce((acc, key, idx) => {
                      acc[key] = row[idx];
                      return acc;
                    }, {} as Record<string, string>);
                    setSelectedRow(rowObj);
                  }}
                >
                  {enabledIndexes.map((i) => {
                    const colName = header[i];
                    const value = row[i];
                    const engKey = keyMap[normalizeKey(colName)] || "unknown";

                    const viewValue = value
                      .toString()
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

                    // ✅ "견적 금액" 열일 때만 input + 저장 버튼 포함
                    if (
                      colName.toString().replace(/ /g, "").trim() ===
                      "견적담당자비고"
                    ) {
                      const memoValue = editedMemo[estimateNum] ?? value ?? "";
                      return (
                        <div
                          className="td quoteMemo"
                          key={i}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            placeholder={memoValue}
                            defaultValue={memoValue}
                            onChange={(e) =>
                              setEditedMemo((prev) => ({
                                ...prev,
                                [estimateNum]: e.target.value,
                              }))
                            }
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newMemo =
                                editedMemo[estimateNum] ?? value ?? "";
                              sendMemo(estimateNum, value, newMemo);
                            }}
                          >
                            저장
                          </button>
                        </div>
                      );
                    }
                    if (
                      colName.toString().replace(/ /g, "").trim() === "견적금액"
                    ) {
                      const amountValue =
                        editedAmounts[estimateNum] ?? value ?? "";
                      return (
                        <div
                          className="td quoteAmount"
                          key={i}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="number"
                            placeholder={viewValue}
                            defaultValue={amountValue}
                            onChange={(e) =>
                              setEditedAmounts((prev) => ({
                                ...prev,
                                [estimateNum]: e.target.value,
                              }))
                            }
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newAmount = amountValue;
                              sendEstimate(estimateNum, value, newAmount);
                            }}
                          >
                            저장
                          </button>
                        </div>
                      );
                    }

                    // ✅ 나머지 열은 기존대로 출력
                    return (
                      <div key={i} className={`td ${engKey}`}>
                        {formatCell(value)}
                      </div>
                    );
                  })}

                  <div
                    className={`td sendMail`}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <button
                      className="warning"
                      style={
                        row[header.indexOf("메일 발송 상태")]
                          .toString()
                          .replace(/ /g, "")
                          .trim() === "발송완료"
                          ? { background: "#f8b568ff", color: "#402200ff" }
                          : { background: "#fd9823ff" }
                      }
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

  const clearFilter = () => {
    setSearchManager("");
    setSearchSalesManager("");
    setSearchCompany("");
    setSearchReqDate("");
  };
  const searchFilter = (key: any, value: string) => {
    console.log(value);
    if (key === "manager") {
      setSearchManager(value);
    } else if (key === "salesManager") {
      setSearchSalesManager(value);
    } else if (key === "company") {
      setSearchCompany(value);
    } else if (key === "requestDate") {
      setSearchReqDate(value);
    }
  };
  return (
    <>
      <Header tabData={tabData} setTabData={setTabData} />
      <div id="console">
        <button id="top" className="info" onClick={goToTop}>
          <MdKeyboardDoubleArrowUp />
        </button>

        {loading ? (
          <div className="loader_area">
            <div className="loader" />
          </div>
        ) : (
          <></>
        )}
        {location.pathname.includes("console") ? (
          <h2>견적 관리 (관리자)</h2>
        ) : (
          <></>
        )}
        {allColumns.length > 0 && (
          <div id="search_area">
            {/* <h3>검색</h3> */}
            <div className="search_box">
              <div className="th">
                <label key="manager">견적 담당자</label>
              </div>
              <div className="td">
                <input
                  data-key="manager"
                  placeholder="견적 담당자 검색"
                  type="text"
                  value={searchManager}
                  onChange={(e) =>
                    searchFilter(e.target.dataset.key, e.target.value)
                  }
                />
              </div>
            </div>
            <div className="search_box">
              <div className="th">
                <label key="salesManager">영업 담당자</label>
              </div>
              <div className="td">
                <input
                  data-key="salesManager"
                  placeholder="영업 담당자 검색"
                  type="text"
                  value={searchSalesManager}
                  onChange={(e) =>
                    searchFilter(e.target.dataset.key, e.target.value)
                  }
                />
              </div>
            </div>
            <div className="search_box">
              <div className="th">
                <label key="requestDate">요청일</label>
              </div>
              <div className="td">
                <input
                  data-key="requestDate"
                  placeholder="요청일 검색"
                  type="date"
                  value={searchReqDate}
                  onChange={(e) =>
                    searchFilter(e.target.dataset.key, e.target.value)
                  }
                />
              </div>
            </div>
            <div className="search_box">
              <div className="th">
                <label key="company">업체명</label>
              </div>
              <div className="td">
                <input
                  data-key="company"
                  placeholder="업체명 검색"
                  type="text"
                  value={searchCompany}
                  onChange={(e) =>
                    searchFilter(e.target.dataset.key, e.target.value)
                  }
                />
              </div>
            </div>

            <button className='clear dark' onClick={() => clearFilter()}>초기화</button>

            {/* <h3>표시할 열 선택</h3>
            {allColumns.map((col) => (
              <label key={col}>
                <input
                  type="checkbox"
                  checked={activeColumns.includes(col)}
                  onChange={() => toggleColumn(col)}
                />
                {col}
              </label>
            ))}  */}
          </div>
        )}

        {renderTable()}

        {selectedRow && (
          <ConsoleDetail
            formatCell={formatCell}
            row={selectedRow}
            onClose={() => setSelectedRow(null)}
          />
        )}
      </div>
    </>
  );
};

export default Console;
