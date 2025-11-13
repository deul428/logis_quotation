import React, { useEffect, useMemo } from "react";
import "./assets/styles/console.scss";
import "./assets/styles/common.scss";
import "./assets/styles/console_detail.scss";

interface Props {
  row: Record<string, string>;
  onClose: () => void;
  formatCell: (value: string | number | null | undefined) => string; // ✅ 추가
}

// 필드 표시 순서 정의 (원하는 순서로 수정 가능)
const FIELD_ORDER = [
  "견적번호",
  "상태",
  "부서(팀)",
  "영업담당자",
  "영업담당자 메일",
  "견적담당자",
  "요청일",
  "회신일",
  "견적 유효기간",
  "업체명",
  "대분류",
  "상품",
  "규격(스팩)",
  "제안규격",
  "인쇄",
  "색상,도수",
  "MOQ",
  "사용량(월평균)",
  "사용금액(월평균)",
  "지역(착지)",
  "기타요청",
  "견적요청비고",
  "추가 정보 필요사항",
  "샘플 필요여부",
  "영업 정보",
  "견적가(매입)",
  "공급사",
  "수주여부",
  "견적 금액",
  "견적담당자 비고",
  "메일 발송 상태",
  "원본데이터",
  // "견적담당자 메일",
  // "영업 담당자 사번별 이름",
];

const ConsoleDetail: React.FC<Props> = ({ row, onClose, formatCell }) => {
  // 필드를 정의된 순서대로 정렬 (FIELD_ORDER에 없는 필드는 제외)
  const sortedEntries = useMemo(() => {
    if (!row || Object.keys(row).length === 0) return [];

    const entries = Object.entries(row);
    const ordered: [string, string][] = [];

    // FIELD_ORDER에 정의된 필드만 추가 (원본데이터 제외)
    FIELD_ORDER.forEach((fieldKey) => {
      if (fieldKey === "원본데이터") return; // 원본데이터는 별도 처리
      const entry = entries.find(([key]) => key === fieldKey);
      if (entry) {
        ordered.push(entry);
      }
    });

    return ordered;
  }, [row]);

  // 원본데이터 필드 추출
  const originalData = useMemo(() => {
    if (!row || !row["원본데이터"]) return null;
    return row["원본데이터"];
  }, [row]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div id="console_detail">
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()} // 내부 클릭 시 닫히지 않게
        >
          <h2>견적 상세 정보</h2>

          <div className="modal-body">
            {sortedEntries.length > 0 ? (
              <>
                <div className="table detailTable">
                  <div className="tbody">
                    {sortedEntries.map(([key, value]) => {
                      let displayValue = value || " ";

                      if (key === "요청일") {
                        displayValue = formatCell(value);
                      } else if (
                        (key === "견적 금액" || key === "사용금액(월평균)") &&
                        value
                      ) {
                        // 3자리마다 콤마 추가
                        displayValue = value
                          .toString()
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                      }

                      return (
                        <div className="field" key={key}>
                          <div className="th">{key}</div>
                          <div className="td">{displayValue}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {originalData && (
                  <div className="field full">
                    <div className="th">원본데이터</div>
                    <div className="td">{originalData}</div>
                  </div>
                )}
              </>
            ) : (
              <p>데이터가 없습니다.</p>
            )}
          </div>

          <button className="close-btn dark" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsoleDetail;
