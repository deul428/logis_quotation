import React, { useEffect } from "react";
import "./assets/styles/console.scss";
import "./assets/styles/common.scss";
import "./assets/styles/console_detail.scss";

interface Props {
  row: Record<string, string>;
  onClose: () => void;
  formatCell: (value: string | number | null | undefined) => string; // ✅ 추가
}

const ConsoleDetail: React.FC<Props> = ({ row, onClose, formatCell }) => {
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
            {row && Object.keys(row).length > 0 ? (
              <table className="detail-table">
                <tbody>
                  {Object.entries(row).map(([key, value]) => {
                    let displayValue = value || " ";

                    if (key === "요청일") {
                      displayValue = formatCell(value);
                    } else if (key === "견적 금액" && value) {
                      // 3자리마다 콤마 추가
                      displayValue = value
                        .toString()
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    }

                    return (
                      <tr key={key}>
                        <th>{key}</th>
                        <td>{displayValue}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p>데이터가 없습니다.</p>
            )}
          </div>

          <button className="close-btn" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsoleDetail;
