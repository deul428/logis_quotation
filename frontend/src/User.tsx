import React, { useState } from "react";
import ci from "./assets/img/logo.svg";
import "./assets/styles/user.scss";
const User = () => {
  const [salesManagerName, setSalesManagerName] = useState<string>(""); // 영업담당자 이름
  const [salesManagerNum, setSalesManagerNum] = useState<string>(""); // 영업담당자 사번
  const fieldMsg: string = `업체명: 
  
지역: 

1. 상품: / 규격: / 사용량: / 사용금액: / 인쇄:

2. 상품: / 규격: / 사용량: / 사용금액: / 인쇄:

요청사항: `;
  const [content, setContent] = useState(fieldMsg);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showGuide1, setShowGuide1] = useState<boolean>(false);
  const [showGuide2, setShowGuide2] = useState<boolean>(false);

  // 폼 제출
  const handleSubmit = async (e: any) => {
    e.preventDefault();

/*     if (!salesManagerName.trim()) {
      alert("영업 담당자를 입력해 주세요.");
      return;
    } */
    if (!content.trim()) {
      alert("문의 내용을 입력해 주세요.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("entry.586019235", salesManagerName);
      formData.append("entry.1839132968", salesManagerNum);
      formData.append("entry.1271596132", content);

      await fetch(
        "https://docs.google.com/forms/d/e/1FAIpQLSctYhlQvrIz8v9g041upLmtKANxDG6vHa8Y23l9VD59j1U1fg/formResponse",
        {
          method: "POST",
          body: formData,
          mode: "no-cors",
        }
      );

      setIsSubmitted(true);
    } catch (err) {
      alert("오류가 발생했습니다. 관리자에게 문의해 주세요.");
      console.error(err);
    }
  };

  const resetForm = () => {
    setSalesManagerName("");
    setContent(fieldMsg);
    setIsSubmitted(false);
  };

  return (
    <div id="user">
      <div className="cntnt_box">
        <div className="user_header">
          <h2>로지스 유통 견적 문의</h2>
          <img className="ci" src={ci} alt="AJ 로고" />
        </div>

        {/* 입력 폼 */}
        {!isSubmitted && (
          <div id="input_area">
            <form id="customForm" onSubmit={handleSubmit}>
             {/*  <input
                type="number"
                name="entry.1839132968"
                placeholder="영업 담당자 사번"
                value={salesManagerNum}
                onChange={(e: any) => setSalesManagerNum(e.target.value)}
              /> */}
              <input
                type="text"
                name="entry.586019235"
                placeholder="영업 담당자 성함"
                value={salesManagerName}
                onChange={(e: any) => setSalesManagerName(e.target.value)}
              />
              <textarea
                name="entry.1271596132"
                rows={12}
                placeholder={`예시)
업체명: AJ
지역: 서울 송파구
1. 상품: 박스 / 규격: W450*H460*0.06MM / 사용량: 약 40,000장
2. 상품: 테이프 / 규격: W500*H600 / 사용량: 약 20,000롤 / 사용금액: 500,000원
요청사항: 납기 일정 회신 부탁드립니다.

※ 정보가 없을 경우, 입력하지 않으셔도 됩니다.`}
                value={content}
                onChange={(e: any) => setContent(e.target.value)}
              />
              <button type="submit">문의 요청</button>
            </form>
          </div>
        )}

        {/* 결과 표시 영역 */}
        {isSubmitted && (
          <div id="result_area">
            <h2>접수가 완료되었습니다.</h2>
            <div id="submittedData" className="card">
              <div className="rows row_01">
                <h3>영업담당자</h3>
                <p>{salesManagerNum|| salesManagerName}</p>
              </div>
              <div className="rows row_02">
                <h3>견적 문의 내용</h3>
                <p>{content}</p>
              </div>
            </div>
            <button id="newResponseLink" onClick={resetForm}>
              신규 접수하기
            </button>
          </div>
        )}

        {/* 설명 영역 */}
        {!isSubmitted && (
          <div id="desc_area">
            <div>
              <button
                className="toggle toggle_01"
                onClick={() => setShowGuide1(!showGuide1)}
              >
                📋 견적 요청 입력 가이드 보기/숨기기
              </button>
              {showGuide1 && (
                <div id="guideBox_01" className="desc_box open card">
                  <div id="guide_01" className="desc ">
                    <p>
                      업체명: [회사명]
                      <br />
                      지역: [납품지역]
                      <br />
                    </p>
                    <p>
                      1. 상품: [상품명] / 규격: [상품의 규격] / 사용량: [월 예상
                      사용량] / 사용금액: [월 예상 사용금액] / 인쇄: [O/X]
                      <br />
                      2. 상품: [상품명] / 규격: [상품의 규격] / 사용량: [월 예상
                      사용량] / 사용금액: [월 예상 사용금액] / 인쇄: [O/X]
                      <br />
                      3. 상품: [상품명] / 규격: [상품의 규격] / 사용량: [월 예상
                      사용량] / 사용금액: [월 예상 사용금액] / 인쇄: [O/X]
                    </p>
                    <p>요청사항: [납기, 샘플 등 요청사항]</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <button
                className="toggle toggle_02"
                onClick={() => setShowGuide2(!showGuide2)}
              >
                ⚠️ 입력 주의사항 보기/숨기기
              </button>
              {showGuide2 && (
                <div id="guideBox_02" className="desc_box open card">
                  <div id="guide_02" className="desc">
                    <p>
                      1. 번호 표기 필수
                      <br />- 상품/규격별 정보는 반드시 1., 2., 3. 번호를 붙여
                      구분합니다.
                      <br />
                      2. 상품명 표기
                      <br />- 동일 상품 + 여러 규격 → 상품:은 한 번만 쓰고,
                      아래에 규격을 나열해도 가능
                      <br />- 서로 다른 상품 → 각 번호마다 반드시 개별 상품:을
                      함께 작성
                      <br />
                      3. 필수/선택 항목
                      <br />- 업체명, 지역, 상품은 필수
                      <br />- 규격, 사용량, 사용금액, 인쇄, 요청사항 등은 선택
                      (없는 값은 생략 가능)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default User;
