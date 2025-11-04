import React, { useEffect } from "react";
import "./assets/styles/admin.scss";
import "./assets/styles/common.scss";
import "./assets/styles/admin_detail.scss";

interface Props {
  row: Record<string, string>;
  onClose: () => void;
  formatCell: (value: string | number | null | undefined) => string; // ✅ 추가
}

const AdminDetail: React.FC<Props> = ({ row, onClose,formatCell }) => {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]); 

  return (
    <div id="admin_detail">
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
                  {Object.entries(row).map(([key, value]) => (
                    <tr key={key}>
                      <th>{key}</th>
                      <td>{key === '요청일' ? formatCell(value): value || " "}</td>
                    </tr>
                  ))}
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

export default AdminDetail;
