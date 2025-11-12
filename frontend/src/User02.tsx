import React, { useState } from "react";
import ci from "./assets/img/logo.svg";
import "./assets/styles/user.scss";
const User02 = () => {
  const [salesRep, setSalesRep] = useState<string>(""); // 영업담당자

  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showGuide1, setShowGuide1] = useState<boolean>(false);
  const [showGuide2, setShowGuide2] = useState<boolean>(false);

  const [inputCompany, setInputCompany] = useState<string>(``);
  const [inputRegion, setInputRegion] = useState<string>(``);
  const [inputNote, setInputNote] = useState<string>(``);
  const [content, setContent] = useState<string>("");

  // 상품 정보 타입 정의
  interface Product {
    id: number;
    productName: string;
    spec: string;
    usage: string;
    amount: string;
    print: string;
  }

  const [products, setProducts] = useState<Product[]>([
    { id: 1, productName: "", spec: "", usage: "", amount: "", print: "" },
  ]);

  // 폼 제출
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!salesRep.trim()) {
      alert("영업 담당자를 입력해 주세요.");
      return;
    }
    if (!content.trim()) {
      alert("문의 내용을 입력해 주세요.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("entry.586019235", salesRep);
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

  // 상품 추가
  const addProduct = () => {
    const newId =
      products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
    setProducts([
      ...products,
      {
        id: newId,
        productName: "",
        spec: "",
        usage: "",
        amount: "",
        print: "",
      },
    ]);
  };

  // 상품 삭제
  const removeProduct = (id: number) => {
    if (products.length > 1) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  // 상품 필드 업데이트
  const updateProduct = (id: number, field: keyof Product, value: string) => {
    setProducts(
      products.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const resetForm = () => {
    setSalesRep("");
    setInputCompany("");
    setInputRegion("");
    setInputNote("");
    setContent("");
    setProducts([
      { id: 1, productName: "", spec: "", usage: "", amount: "", print: "" },
    ]);
    setIsSubmitted(false);
  };

  return (
    <div id="user" className="user_02">
      <div className="cntnt_box user_02">
        <div className="user_header">
          <h2>로지스 유통 견적 문의</h2>
          <img className="ci" src={ci} alt="AJ 로고" />
        </div>

        {/* 입력 폼 */}
        {!isSubmitted && (
          <div id="input_area">
            <form id="customForm" onSubmit={handleSubmit}>
              <div className="input_field">
                <label>영업 담당자명</label>
                <input
                  type="text"
                  name="entry."
                  placeholder="ex) 김아주"
                  value={salesRep}
                  onChange={(e: any) => setSalesRep(e.target.value)}
                />
              </div>
              <div className="input_field">
                <label>업체명</label>
                <input
                  type="text"
                  name="entry."
                  placeholder="ex) AJ네트웍스"
                  value={inputCompany}
                  onChange={(e: any) => setInputCompany(e.target.value)}
                />
              </div>
              <div className="input_field">
                <label>지역(착지)</label>
                <input
                  type="text"
                  name="entry."
                  placeholder="ex) 서울특별시 송파구 정의로8길 9"
                  value={inputRegion}
                  onChange={(e: any) => setInputRegion(e.target.value)}
                />
              </div>
              <div className="input_field">
                <label>상품</label>
                {products.map((product, index) => (
                  <div key={product.id} className="input_product_area">
                    <div className="input_product_heading">
                      <h4>상품 {index + 1}</h4>
                      {products.length > 1 && (
                        <button
                          type="button"
                          className="danger"
                          onClick={() => removeProduct(product.id)}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <div className="input_product_field">
                      <div>
                        <label>상품명</label>
                        <input
                          type="text"
                          placeholder="ex) 박스"
                          value={product.productName}
                          onChange={(e) =>
                            updateProduct(
                              product.id,
                              "productName",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div>
                        <label>규격</label>
                        <input
                          type="text"
                          placeholder="ex) W450*H460*0.06MM"
                          value={product.spec}
                          onChange={(e) =>
                            updateProduct(product.id, "spec", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label>사용량</label>
                        <input
                          type="text"
                          placeholder="ex) 약 40,000장"
                          value={product.usage}
                          onChange={(e) =>
                            updateProduct(product.id, "usage", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label>사용 금액</label>
                        <input
                          type="text"
                          placeholder="ex) 500,000원"
                          value={product.amount}
                          onChange={(e) =>
                            updateProduct(product.id, "amount", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label>인쇄</label>
                        <input
                          type="text"
                          placeholder="ex) O 또는 X"
                          value={product.print}
                          onChange={(e) =>
                            updateProduct(product.id, "print", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" className="warning" onClick={addProduct}>
                  + 상품 추가
                </button>
              </div>
              <div className="input_field">
                <label> 요청사항</label>
                <textarea
                  name="entry."
                  rows={2}
                  placeholder="ex) 납기 일정 회신 부탁드립니다."
                  value={inputNote}
                  onChange={(e: any) => setInputNote(e.target.value)}
                />
              </div>
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
                <p>{salesRep || "미입력"}</p>
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

export default User02;
