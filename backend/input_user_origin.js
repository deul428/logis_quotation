// ============================================
// 견적 관리 자동화 시스템 - 구글 폼 응답 처리 버전
// ============================================


// 사번 매핑 전 성함으로 하던 버전
 
// 특정 스프레드시트 사용
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// 트리거 설정 함수 - 설문지 응답 시트 변경 감지
function setupFormResponseTrigger() {
  try {
    console.log("=== 구글 폼 응답 트리거 설정 시작 ===");

    const spreadsheet = getSpreadsheet();

    // 기존 트리거 삭제
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach((trigger) => {
      ScriptApp.deleteTrigger(trigger);
      console.log("기존 트리거 삭제됨");
    });

    // 스프레드시트 편집 트리거 생성 (설문지 응답 시트 변경 감지)
    ScriptApp.newTrigger("onFormResponseEdit")
      .forSpreadsheet(spreadsheet)
      .onEdit()
      .create();

    // 구글 폼 제출 트리거도 추가 (더 안정적인 감지를 위해)
    ScriptApp.newTrigger("onFormSubmit")
      .forSpreadsheet(spreadsheet)
      .onFormSubmit()
      .create();

    console.log("새 구글 폼 응답 트리거 설정 완료!");
    console.log("대상 스프레드시트:", spreadsheet.getName());
  } catch (error) {
    console.error("트리거 설정 오류:", error);
  }
}

// 구글 폼 제출 이벤트 처리 함수
function onFormSubmit(e) {
  try {
    console.log("=== 구글 폼 제출 이벤트 감지 ===");

    if (!e || !e.range) {
      console.log("이벤트 정보 없음");
      return;
    }

    const sheet = e.range.getSheet();
    const sheetName = sheet.getName();
    const row = e.range.getRow();

    console.log("폼 제출된 시트:", sheetName);
    console.log("제출된 행:", row);

    // "설문지 응답" 시트의 새 응답 처리
    if (sheetName === "설문지 응답") {
      console.log("설문지 응답 감지, 처리 시작");
      processFormResponse(sheet, row);
    }
  } catch (error) {
    console.error("폼 제출 이벤트 처리 오류:", error);
  }
}

// 편집 이벤트 처리 함수 (백업용)
function onFormResponseEdit(e) {
  try {
    console.log("=== 편집 이벤트 감지 ===");

    if (!e || !e.range) {
      console.log("이벤트 정보 없음");
      return;
    }

    const sheet = e.range.getSheet();
    const sheetName = sheet.getName();

    console.log("편집된 시트:", sheetName);
    console.log("편집된 범위:", e.range.getA1Notation());

    // "설문지 응답" 시트의 B열(원본텍스트) 편집만 처리
    if (sheetName === "설문지 응답" && e.range.getColumn() === 2) {
      const row = e.range.getRow();

      // 헤더 행은 제외
      if (row === 1) {
        console.log("헤더 행 편집, 무시");
        return;
      }

      console.log("원본텍스트 편집 감지, 행:", row);
      processFormResponse(sheet, row);
    }
  } catch (error) {
    console.error("편집 이벤트 처리 오류:", error);
  }
}

// ⚠️ 처리상태는 절대 하드코딩 인덱스로 쓰지 않는다. (헤더명 '처리상태'로 탐색)
function getStatusColumnIndexOrigin_(sheet) {
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idx = headerRow.findIndex((h) => h && String(h).trim() === "처리상태");
  if (idx >= 0) return idx; // 0-based
  const newCol = headerRow.length + 1;
  sheet.getRange(1, newCol).setValue("처리상태");
  return newCol - 1;
}
// 구글 폼 응답 처리 함수
function processFormResponse(sheet, row) {
  try {
    console.log("=== 구글 폼 응답 처리 시작 ===");
    const headerRow = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    Logger.log("헤더:", headerRow);
    const getColIndex = (name) =>
      headerRow.findIndex((h) => h.trim() === name.trim());

    // 🔹 필요한 열 이름 지정 (헤더 명 그대로)
    const timestampIdx = getColIndex("타임스탬프");
    const rawTextIdx = getColIndex("원본텍스트");
    const salesManagerNameIdx = getColIndex("영업담당자");
    const salesManagerNumIdx = getColIndex("영업담당자사번"); 
    const statusIdx = getColIndex("처리상태");

    // 응답 데이터 가져오기 (전체 행)
    const lastColumn = sheet.getLastColumn();
    const rowData = sheet.getRange(row, 1, 1, lastColumn).getValues()[0];
    
    console.log("응답 데이터:", rowData); 
    // 타임스탬프는 A열, 원본텍스트는 B열로 가정
    const timestamp = rowData[0];
    const rawText = rowData[1];
    // 영업담당자는 구글 폼에서 별도로 설정하거나 기본값 사용
    const salesManagerName = rowData[2] || "임민규"; // 구글 폼에서 영업담당자 정보를 가져오거나 기본값 사용
    const salesManagerNum = rowData[3] || "임민규"; // 구글 폼에서 영업담당자 정보를 가져오거나 기본값 사용

    // 원본텍스트가 있는 경우만 처리
    console.log("데이터 파싱 시작");

    // 처리상태: 헤더 '처리상태' 컬럼으로 업데이트
    const statusCol = statusIdx >= 0 ? statusIdx : getStatusColumnIndexOrigin_(sheet);
    sheet.getRange(row, statusCol + 1).setValue("처리중");

    // 파싱 및 처리
    processRawData(rawText, timestamp, salesManagerName, row, sheet);
  } catch (error) {
    alert(error);
    console.error("구글 폼 응답 처리 오류:", error);

    // 오류 발생 시 처리상태 업데이트 (헤더 기준)
    try {
      const statusCol = getStatusColumnIndexOrigin_(sheet);
      sheet.getRange(row, statusCol + 1).setValue("처리오류");
    } catch (updateError) {
      console.error("처리상태 업데이트 오류:", updateError);
    }
  }
}
/* function userGetEntry(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", message: "API alive" }))
    .setMimeType(ContentService.MimeType.JSON);
}
 */
// ✅ 스프레드시트에서 데이터 읽기
function getSheetData() {
  const sheet =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("파싱결과");
  const data = sheet.getDataRange().getValues(); // 2D 배열로 가져옴
  return data;
}
 
function extractValue(line, keywords) {
  for (let keyword of keywords) {
    const patterns = [keyword + ":", keyword + " :", keyword + "："];

    for (let pattern of patterns) {
      if (line.includes(pattern)) {
        let value = line.split(pattern)[1];
        if (value !== undefined) {
          value = value.trim();

          if (value === "") {
            return "";
          }

          // 금액/단가 → 원, 콤마 제거
          if (
            (keyword.includes("단가") ||
              keyword.includes("금액") ||
              keyword.includes("예산")) &&
            value
          ) {
            value = value.replace(/[원,\s]/g, "");
          }

          return value;
        }
      }
    }
  }

  // 콜론 기준 직접 파싱
  if (line.includes(":")) {
    const colonIndex = line.indexOf(":");
    const key = line.substring(0, colonIndex).trim();
    const value = line.substring(colonIndex + 1).trim();

    for (let keyword of keywords) {
      if (key === keyword || key.includes(keyword) || keyword.includes(key)) {
        return value;
      }
    }
  }

  return "";
}

// 🔥 재질 정보 분리 함수 수정 - 규격 패턴도 포함 (X, x 패턴 추가)
function separateMaterialInfo(specText) {
  if (!specText) return { material: "", spec: "" };

  // 1. 재질 패턴 정의 (PE필름, PVC필름, PP필름 등)
  const materialPatterns = [
    /^(PE필름|PVC필름|PP필름|PET필름|OPP필름|CPP필름)/,
    /^(PE|PVC|PP|PET|OPP|CPP)필름/,
    /^(폴리에틸렌|폴리염화비닐|폴리프로필렌)/,
  ];

  for (let pattern of materialPatterns) {
    const match = specText.match(pattern);
    if (match) {
      const material = match[1];
      const remainingSpec = specText.replace(pattern, "").trim();
      console.log("재질 분리:", material, "/ 규격:", remainingSpec);
      return { material: material, spec: remainingSpec };
    }
  }

  // 🔥 2. 텍스트+W숫자*H숫자*숫자 패턴 처리 (박스 W450*H460*0.06MM)
  const dimensionPattern =
    /^([가-힣A-Za-z\s]+)\s*(W\d+[*×xX]H?\d+[*×xX][\d.]+\w*)/i;
  const match = specText.match(dimensionPattern);
  if (match) {
    const material = match[1].trim(); // 텍스트 부분 (박스, 테이프 등)
    const spec = match[2].trim(); // 치수 부분 (W450*H460*0.06MM)
    console.log("규격 패턴 분리 - 재질:", material, "/ 규격:", spec);
    return { material: material, spec: spec };
  }

  // 🔥 3. 일반적인 숫자*숫자*숫자, 숫자X숫자X숫자, 숫자x숫자x숫자 패턴 처리
  const generalDimensionPatterns = [
    /^([가-힣A-Za-z\s]+)\s*(W?\d+[*×xX]\d+[*×xX][\d.]+\w*)/i, // W450*460*0.06MM, W450X460X0.06, W450x460x0.06
    /^([가-힣A-Za-z\s]+)\s*(\d+[*×xX]\d+[*×xX][\d.]+\w*)/i, // 450*460*0.06MM, 450X460X0.06, 450x460x0.06
  ];

  for (let pattern of generalDimensionPatterns) {
    const patternMatch = specText.match(pattern);
    if (patternMatch) {
      const material = patternMatch[1].trim();
      const spec = patternMatch[2].trim();
      console.log("일반 규격 패턴 분리 - 재질:", material, "/ 규격:", spec);
      return { material: material, spec: spec };
    }
  }

  // 🔥 4. 순수 치수만 있는 경우 (텍스트 없이 숫자만)
  const pureNumberPatterns = [
    /^(W?\d+[*×xX]H?\d+[*×xX][\d.]+\w*)\$/i, // W450*H460*0.06MM, W450X460X0.06
    /^(\d+[*×xX]\d+[*×xX][\d.]+\w*)\$/i, // 450*460*0.06MM, 450X460X0.06
  ];

  for (let pattern of pureNumberPatterns) {
    const pureMatch = specText.match(pattern);
    if (pureMatch) {
      console.log("순수 치수 패턴:", pureMatch[1]);
      return { material: "", spec: pureMatch[1] };
    }
  }

  return { material: "", spec: specText };
}

// 🔥 복합 상품 파싱 함수 수정 - 개별 요청사항 처리 추가
function parseMultipleProducts(text) {
  console.log("=== 복합 상품 파싱 (모든 케이스 지원) ===");

  const products = [];
  const lines = text.split("\n");

  let currentBaseProduct = "";

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    // 🔥 Case 2: 기본 상품명 감지 (상품: 수축필름) - 단독 라인
    if (line.match(/^상품\s*[:：]\s*(.+)\$/) && !line.includes("/")) {
      currentBaseProduct = extractValue(line, ["상품"]);
      console.log("Case 2 - 기본 상품명 설정:", currentBaseProduct);
      continue;
    }

    // 🔥 Case 2: 규격 라인 감지 (규격(스펙): 또는 규격:)
    if (
      currentBaseProduct &&
      (line.match(/^규격$스펙$\s*[:：]/) || line.match(/^규격\s*[:：]/)) &&
      line.includes("/")
    ) {
      console.log("Case 2 - 규격 라인 처리:", line);

      const product = {
        상품명: currentBaseProduct,
        규격: "",
        인쇄: "",
        사용량: "",
        사용금액: "",
        재질정보: "",
        개별요청사항: "", // 🔥 개별 요청사항 추가
      };

      const parts = line.split("/");
      for (let part of parts) {
        part = part.trim();

        if (part.includes("규격") && part.includes(":")) {
          const rawSpec = extractValue(part, ["규격(스펙)", "규격"]);
          const { material, spec } = separateMaterialInfo(rawSpec);
          product.규격 = spec;
          product.재질정보 = material;
        } else if (part.includes("인쇄:")) {
          product.인쇄 = extractValue(part, ["인쇄"]);
        } else if (part.includes("사용량") && part.includes(":")) {
          product.사용량 = extractValue(part, [
            "월 사용량",
            "사용량(월평균)",
            "사용량",
          ]);
        } else if (part.includes("사용금액") && part.includes(":")) {
          product.사용금액 = extractValue(part, [
            "월 사용금액",
            "사용금액(월평균)",
            "사용금액",
          ]);
        } else if (part.includes("요청사항") && part.includes(":")) {
          product.개별요청사항 = extractValue(part, ["요청사항", "기타요청"]);
        }
      }

      console.log("Case 2 파싱된 상품:", product);
      products.push(product);
      continue;
    }

    // 🔥 기존 번호 매김 방식 - 규격 패턴 분리 로직 추가
    const numberedMatch = line.match(/^(\d+)\.\s*(.+)/);
    if (numberedMatch) {
      const productInfo = numberedMatch[2].trim();

      // 🔥 규격: 텍스트 W숫자*숫자*숫자 형태 직접 처리
      if (productInfo.includes("규격:") && !productInfo.includes("/")) {
        const product = {
          상품명: currentBaseProduct || "",
          규격: "",
          인쇄: "",
          사용량: "",
          사용금액: "",
          재질정보: "",
          개별요청사항: "",
        };

        const rawSpec = extractValue(productInfo, ["규격"]);
        const { material, spec } = separateMaterialInfo(rawSpec);
        product.규격 = spec;
        product.재질정보 = material;

        // 사용량 추출
        if (productInfo.includes("사용량")) {
          product.사용량 = extractValue(productInfo, [
            "월 사용량",
            "사용량(월평균)",
            "사용량",
          ]);
        }

        console.log("번호 매김 + 규격 패턴 파싱된 상품:", product);
        products.push(product);
        continue;
      }

      // 기존 / 구분자 방식
      if (productInfo.includes("/")) {
        const product = {
          상품명: currentBaseProduct || "",
          규격: "",
          인쇄: "",
          사용량: "",
          사용금액: "",
          재질정보: "",
          개별요청사항: "", // 🔥 개별 요청사항 추가
        };

        const parts = productInfo.split("/");
        for (let part of parts) {
          part = part.trim();

          if (part.includes("상품:")) {
            product.상품명 = extractValue(part, ["상품"]);
          } else if (part.includes("규격") && part.includes(":")) {
            const rawSpec = extractValue(part, ["규격(스펙)", "규격"]);
            const { material, spec } = separateMaterialInfo(rawSpec);
            product.규격 = spec;
            product.재질정보 = material;
          } else if (part.includes("인쇄:")) {
            product.인쇄 = extractValue(part, ["인쇄"]);
          } else if (part.includes("사용량") && part.includes(":")) {
            product.사용량 = extractValue(part, [
              "월 사용량",
              "사용량(월평균)",
              "사용량",
            ]);
          } else if (part.includes("사용금액") && part.includes(":")) {
            product.사용금액 = extractValue(part, [
              "월 사용금액",
              "사용금액(월평균)",
              "사용금액",
            ]);
          } else if (part.includes("요청사항") && part.includes(":")) {
            // 🔥 개별 요청사항 처리
            product.개별요청사항 = extractValue(part, ["요청사항", "기타요청"]);
          }
        }

        console.log("번호 매김 방식 파싱된 상품:", product);
        products.push(product);
      }
    }
  }

  console.log("최종 상품 목록:", products);
  return products;
}

// 상품 라인 파싱 함수
function parseProductLine(line, product) {
  console.log("=== 상품 라인 파싱 시작 ===");
  console.log("입력 라인:", line);

  product.상품명 = "";
  product.규격 = "";
  product.사용량 = "";
  product.재질정보 = ""; // 🔥 재질 정보 추가

  let mainPart = line;
  let usagePart = "";

  if (line.includes("사용량")) {
    const usageIndex = line.indexOf("사용량");
    mainPart = line.substring(0, usageIndex).trim();
    usagePart = line
      .substring(usageIndex)
      .replace(/^사용량\s*[:：]?\s*/, "")
      .trim();
  }

  console.log("메인 부분:", mainPart);
  console.log("사용량 부분:", usagePart);

  const match = mainPart.match(/^([가-힣A-Za-z0-9()]+)\s*(.*)/);
  if (match) {
    product.상품명 = match[1].trim();
    const rawSpec = match[2].trim();

    // 🔥 재질 정보 분리 (규격 패턴 포함)
    const { material, spec } = separateMaterialInfo(rawSpec);
    product.규격 = spec;
    product.재질정보 = material;
  } else {
    product.상품명 = mainPart;
    product.규격 = "";
    product.재질정보 = "";
  }

  product.사용량 = usagePart;

  console.log("최종 파싱 결과:");
  console.log('- 상품명: "' + product.상품명 + '"');
  console.log('- 규격: "' + product.규격 + '"');
  console.log('- 재질정보: "' + product.재질정보 + '"');
  console.log('- 사용량: "' + product.사용량 + '"');
  console.log("=========================");
}

// 🔥 상품 매핑 로직 수정 - 개별 요청사항 처리
function mapProductData(baseData, product) {
  const rowData = { ...baseData };

  if (baseData.상품 && product.상품명 && baseData.상품 === product.상품명) {
    rowData.상품 = baseData.상품;
    rowData["규격(스팩)"] = product.규격;
    rowData["견적요청비고"] =
      product.재질정보 || baseData["견적요청비고"] || "";
  } else if (product.상품명) {
    rowData.상품 = product.상품명;
    rowData["규격(스팩)"] = product.규격;
    rowData["견적요청비고"] = product.재질정보 || "";
  } else if (baseData.상품 && !product.상품명) {
    rowData.상품 = baseData.상품;
    rowData["규격(스팩)"] = product.규격;
    rowData["견적요청비고"] =
      product.재질정보 || baseData["견적요청비고"] || "";
  }

  rowData["사용량(월평균)"] = product.사용량 || "";
  rowData["인쇄"] = product.인쇄 || baseData["인쇄"] || "";
  rowData["사용금액(월평균)"] =
    product.사용금액 || baseData["사용금액(월평균)"] || "";

  // 🔥 개별 요청사항이 있으면 우선, 없으면 전체 요청사항 사용
  if (product.개별요청사항) {
    rowData["기타요청"] = product.개별요청사항;
  } else {
    rowData["기타요청"] = baseData["기타요청"] || "";
  }

  return rowData;
}

// 기본 정보 파싱 함수 수정
function parseKakaoText(text) {
  const result = {
    업체명: "",
    "지역(착지)": "",
    상품: "",
    대분류: "",
    "규격(스팩)": "",
    "사용량(월평균)": "",
    "사용금액(월평균)": "",
    MOQ: "",
    "견적가(매입)": "",
    인쇄: "",
    "색상,도수": "",
    공급사: "",
    견적요청비고: "",
    기타요청: "",
  };

  const lines = text.split("\n");

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    console.log("처리 중인 라인:", line);

    // 🔥 번호 매김된 라인은 기본 정보 파싱에서 제외 (상품 정보이므로)
    if (line.match(/^\d+\./)) continue;

    if (
      line.includes("업체명") ||
      line.includes("상호명") ||
      line.includes("계약업체") ||
      line.includes("발주업체") ||
      line.includes("고객사") ||
      line.includes("회사명")
    ) {
      result.업체명 = extractValue(line, [
        "업체명",
        "상호명",
        "계약업체",
        "발주업체",
        "고객사",
        "회사명",
      ]);
    } else if (
      line.includes("주소") ||
      line.includes("지역") ||
      line.includes("납품지") ||
      line.includes("착지") ||
      line.includes("위치")
    ) {
      result["지역(착지)"] = extractValue(line, [
        "주소",
        "지역",
        "납품지",
        "착지",
        "지역(착지)",
        "위치",
      ]);
    } else if (line.includes("공급사") || line.includes("매입사")) {
      result.공급사 = extractValue(line, ["공급사", "매입사"]);
    } else if (
      line.includes("매입단가") ||
      line.includes("매입가") ||
      line.includes("단가") ||
      line.includes("공급가") ||
      line.includes("기준단가")
    ) {
      result["견적가(매입)"] = extractValue(line, [
        "매입단가",
        "매입가",
        "단가",
        "공급가",
        "기준단가",
      ]);
    } else if (
      line.includes("예산") ||
      line.includes("사용금액") ||
      line.includes("금액") ||
      line.includes("월 사용금액")
    ) {
      result["사용금액(월평균)"] = extractValue(line, [
        "예산",
        "사용금액",
        "금액",
        "월 사용금액",
      ]);
    } else if (line.includes("인쇄")) {
      result["인쇄"] = extractValue(line, ["인쇄", "인쇄여부"]);
    } else if (
      (line.includes("제품") ||
        line.includes("품목") ||
        line.includes("상품")) &&
      line.includes(":") &&
      !line.includes("/")
    ) {
      const productCategory = extractValue(line, [
        "제품",
        "제품명",
        "상품",
        "품목",
      ]);
      result.상품 = productCategory;
    } else if (line.includes("MOQ")) {
      result["MOQ"] = extractValue(line, ["MOQ"]);
    }
    // 🔥 요청사항 처리 개선 - 번호 매김 고려
    else if (line.includes("요청사항") && line.includes(":")) {
      // 요청사항: 으로 시작하는 라인 처리
      let requestText = extractValue(line, [
        "기타 요청사항",
        "기타요청",
        "요청사항",
      ]);

      // 다음 라인들도 확인해서 번호 매김된 요청사항들 수집
      const allLines = text.split("\n");
      const currentIndex = allLines.findIndex((l) => l.trim() === line);

      if (currentIndex !== -1) {
        for (let i = currentIndex + 1; i < allLines.length; i++) {
          const nextLine = allLines[i].trim();
          if (!nextLine) continue;

          // 번호 매김된 요청사항 (1. 2. 3. 등)
          if (
            nextLine.match(/^\d+\.\s*(.+)/) &&
            !nextLine.includes("상품:") &&
            !nextLine.includes("규격:")
          ) {
            const requestItem = nextLine.replace(/^\d+\.\s*/, "").trim();
            requestText += (requestText ? "\n" : "") + requestItem;
          } else {
            break; // 다른 형태의 라인이 나오면 중단
          }
        }
      }

      result["기타요청"] = requestText;
    }
  }

  console.log("기본 파싱 결과:", result);
  return result;
}

// 담당자 매핑 함수
// 25.10.24. 김희수: 이메일 필드와 함께 긁어옴
function getManager(productName) {
  if (!productName) {
    console.log("상품명이 없어서 담당자 미지정");
    return { name: "미지정", email: "" };
  }

  try {
    const spreadsheet = getSpreadsheet();
    const managerSheet =
      spreadsheet.getSheetByName("견적상품_견적담당자_리스트");

    if (!managerSheet) {
      console.log("견적상품_견적담당자_리스트 시트를 찾을 수 없음");
      return { name: "미지정", email: "" };
    }

    const data = managerSheet.getDataRange().getValues();
    console.log("담당자 데이터 행 수:", data.length);

    for (let i = 1; i < data.length; i++) {
      const [상품명, 중분류, 대분류, 상품별분류, 담당자, 담당자메일] = data[i];

      if (상품명 && productName) {
        if (
          productName === 상품명 ||
          productName.includes(상품명) ||
          상품명.includes(productName)
        ) {
          console.log(
            `담당자 매칭: ${상품명} → ${담당자} (${담당자메일 || "메일 없음"})`
          );
          return { name: 담당자, email: 담당자메일 || "" };
        }
      }
    }

    console.log("매칭되는 담당자 없음");
    return { name: "미지정", email: "" };
  } catch (error) {
    console.error("담당자 매핑 오류:", error);
    return { name: "미지정", email: "" };
  }
}

// 견적번호 생성
function generateEstimateNum(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return "1";

  const nums = sheet
    .getRange(2, 1, lastRow - 1, 1)
    .getValues()
    .map((r) => parseInt(r[0], 10))
    .filter((n) => !isNaN(n));

  const max = nums.length ? Math.max.apply(null, nums) : 0;
  return String(max + 1);
}

// 최종 시트에 데이터 삽입
// 25.10.24. 김희수:
// manager 파라미터 → { name, email } 구조로 받음
// 시트에 담당자 이름만 저장
// 담당자 메일이 있으면 sendEmailToManager() 호출
function insertToFinalSheet(
  parsedData,
  manager,
  salesManager,
  timestamp,
  rawText
) {
  try {
    const spreadsheet = getSpreadsheet();
    let finalSheet = spreadsheet.getSheetByName("파싱결과");

    if (!finalSheet) {
      finalSheet = spreadsheet.insertSheet("파싱결과");
    }

    if (finalSheet.getLastRow() === 0) {
      const headers = [
        "견적번호",
        "상태",
        "부서(팀)",
        "영업담당자",
        "견적담당자",
        "요청일",
        "회신일",
        "견적 유효기간",
        "업체명",
        "대분류",
        "상품",
        "규격(스팩)",
        "영업 정보",
        "견적요청비고",
        "추가 정보 필요사항",
        "샘플 필요여부",
        "인쇄",
        "색상,도수",
        "MOQ",
        "사용량(월평균)",
        "사용금액(월평균)",
        "지역(착지)",
        "기타요청",
        "견적가(매입)",
        "제안규격",
        "MOQ2",
        "공급사",
        "수주여부",
        "원본데이터",
        "견적 금액",
        "견적담당자 비고",
        "메일 발송 상태",
      ];
      finalSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    const estimateNum = generateEstimateNum(finalSheet);

    const rowData = [
      estimateNum, // 견적번호
      "접수", // 상태
      "", // 부서(팀)
      salesManager, // 영업담당자
      manager.name, // 견적담당자
      timestamp || new Date(), // 요청일
      "", // 회신일
      "", // 견적 유효기간
      parsedData["업체명"], // 업체명
      parsedData["대분류"], // 대분류
      parsedData["상품"], // 상품
      parsedData["규격(스팩)"], // 규격(스팩)
      "", // 영업 정보
      parsedData["견적요청비고"], // 견적요청비고
      "", // 추가 정보 필요사항
      "", // 샘플 필요여부
      parsedData["인쇄"], // 인쇄
      parsedData["색상,도수"], // 색상,도수
      parsedData["MOQ"], // MOQ
      parsedData["사용량(월평균)"], // 사용량(월평균)
      parsedData["사용금액(월평균)"], // 사용금액(월평균)
      parsedData["지역(착지)"], // 지역(착지)
      parsedData["기타요청"], // 기타요청
      parsedData["견적가(매입)"], // 견적가(매입)
      "", // 제안규격
      "", // MOQ2
      parsedData["공급사"], // 공급사
      "", // 수주여부
      rawText || "", // 원본데이터
      "", // 견적 금액
      "", //견적담당자 비고
      "발송 전",
    ];

    finalSheet.appendRow(rowData);
    console.log("데이터 삽입 완료!");

    // 담당자 이메일이 있으면 자동 메일 발송
    if (manager.email) {
      sendEmailToManager(manager, salesManager, parsedData, estimateNum);
    }
  } catch (error) {
    console.error("데이터 삽입 오류:", error);
  }
}
// 신규 함수: 이메일 발송
function sendEmailToManager(manager, salesManager, parsedData, estimateNum) {
  if (!manager && !salesManager && !parsedData && !estimateNum) {
    manager = { name: "김희수", email: "kimhs@ajnet.co.kr" };
    salesManager = "김희수";
    parsedData = {};
    estimateNum = 9999;
  }
  try {
    const subject = `신규 견적 요청 (#${estimateNum}) - ${
      parsedData["업체명"] || "미기입"
    }`;

    const bodyText = ``;

    const htmlBody = `
<html>
  <body
    style="font-family: 'Noto Sans KR', Pretendard, sans-serif; color: #333"
  >
    <p style="font-size: 12px; color: #777">
      본 메일은 시스템에서 자동 발송되었습니다.
    </p>
    <h2 style="color: #ef3340">신규 견적 요청 안내</h2>
    <p>안녕하세요, <b>${manager.name}</b>님.</p>

    <p>새로운 견적 요청이 접수되었습니다.</p>
    <div
      style="
        border-collapse: collapse;
        margin-top: 12px;
        width: 100%;
        font-size: 14px;
      "
    >
      <div style="margin-bottom: 12px; display: flex">
        <div style="width: 150px"><b>영업 담당자</b></div>
        <div style="width: 80%">${salesManager}</div>
      </div>
      <div style="margin-bottom: 12px; display: flex">
        <div style="width: 150px"><b>업체명</b></div>
        <div style="width: 80%">${parsedData["업체명"] || "-"}</div>
      </div>
      <div style="margin-bottom: 12px; display: flex">
        <div style="width: 150px"><b>상품</b></div>
        <div style="width: 80%">${parsedData["상품"] || "-"}</div>
      </div>
      <div style="margin-bottom: 12px; display: flex">
        <div style="width: 150px"><b>규격</b></div>
        <div style="width: 80%">${parsedData["규격(스팩)"] || "-"}</div>
      </div>
      <div style="margin-bottom: 12px; display: flex">
        <div style="width: 150px"><b>사용금액(월평균)</b></div>
        <div style="width: 80%">${parsedData["사용금액(월평균)"] || "-"}</div>
      </div>
      <div style="margin-bottom: 12px; display: flex">
        <div style="width: 150px"><b>요청일</b></div>
        <div style="width: 80%">${new Date().toLocaleString("ko-KR")}</div>
      </div>
    </div>

    <p>자세한 내용은 로지스 견적 요청 시스템에서 확인해 주시기 바랍니다.</p>
  </body>
</html>
`;
    GmailApp.sendEmail(manager.email, subject, bodyText, { htmlBody });
    Logger.log(`메일 전송 완료 → ${manager.email}`);
  } catch (error) {
    Logger.log("메일 전송 오류: " + error);
  }
}

// 설문지 응답 처리상태 업데이트
function updateFormResponseStatus(sheet, row, status) {
  try {
    const statusCol = getStatusColumnIndexOrigin_(sheet);
    sheet.getRange(row, statusCol + 1).setValue(status);
    console.log("처리상태 업데이트:", status);
  } catch (error) {
    console.error("처리상태 업데이트 오류:", error);
  }
}

// 원본 데이터 처리 메인 함수 (구글 폼 응답용으로 수정)
function processRawData(
  rawText,
  timestamp,
  salesManager,
  sourceRow,
  sourceSheet
) {
  try {
    console.log("=== 구글 폼 응답 데이터 처리 시작 ===");
    console.log("원본 텍스트:", rawText);

    const baseData = parseKakaoText(rawText);
    console.log("기본 정보 파싱 결과:", baseData);

    const hasMultipleProducts =
      rawText.match(/^\d+\./m) ||
      (rawText.match(/^상품\s*[:：]/m) && rawText.match(/^규격/m));

    if (hasMultipleProducts) {
      const products = parseMultipleProducts(rawText);
      console.log("분리된 상품들:", products);

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        console.log("처리 중인 상품 " + (i + 1) + ":", product);

        const rowData = mapProductData(baseData, product);
        const manager = getManager(rowData.상품);

        insertToFinalSheet(rowData, manager, salesManager, timestamp, rawText);
        console.log("상품 " + (i + 1) + " 삽입 완료");
      }
    } else {
      const manager = getManager(baseData.상품);
      insertToFinalSheet(baseData, manager, salesManager, timestamp, rawText);
      console.log("단일 상품 삽입 완료");
    }

    // 처리상태 업데이트
    if (sourceRow && sourceSheet) {
      updateFormResponseStatus(sourceSheet, sourceRow, "처리완료");
    }

    console.log("=== 모든 처리 완료 ===");
  } catch (error) {
    console.error("처리 오류:", error);
    console.error("오류 스택:", error.stack);

    // 오류 발생 시 처리상태 업데이트
    if (sourceRow && sourceSheet) {
      updateFormResponseStatus(sourceSheet, sourceRow, "처리오류");
    }
  }
}

// 수동 처리 함수 - 설문지 응답 시트 대상
function processAllFormResponses() {
  try {
    console.log("=== 모든 설문지 응답 처리 시작 ===");

    const spreadsheet = getSpreadsheet();
    const responseSheet = spreadsheet.getSheetByName("설문지 응답");

    if (!responseSheet) {
      console.error("설문지 응답 시트를 찾을 수 없습니다!");
      return;
    }

    const data = responseSheet.getDataRange().getValues();
    console.log("총 응답 행 수:", data.length);

    let processedCount = 0;

    for (let i = 1; i < data.length; i++) {
      const rowData = data[i];
      const timestamp = rowData[0]; // A열: 타임스탬프
      const rawText = rowData[1]; // B열: 원본텍스트
      const processStatus = rowData[2] || ""; // C열: 처리상태

      if (rawText && rawText.trim() && processStatus !== "처리완료") {
        console.log(`행 ${i + 1} 처리 중...`);
        processFormResponse(responseSheet, i + 1);
        processedCount++;
      }
    }

    console.log(`=== 처리 완료: ${processedCount}건 ===`);
  } catch (error) {
    console.error("일괄 처리 오류:", error);
  }
}

// 테스트 함수 - 특정 행 처리 (설문지 응답 시트)
function testSpecificFormResponse(rowNumber) {
  try {
    console.log("=== 특정 설문지 응답 테스트 ===");

    const spreadsheet = getSpreadsheet();
    const responseSheet = spreadsheet.getSheetByName("설문지 응답");

    if (!responseSheet) {
      console.error("설문지 응답 시트를 찾을 수 없습니다!");
      return;
    }

    const lastColumn = responseSheet.getLastColumn();
    const rowData = responseSheet
      .getRange(rowNumber, 1, 1, lastColumn)
      .getValues()[0];
    const timestamp = rowData[0];
    const rawText = rowData[1];
    const processStatus = rowData[2] || "";

    console.log("테스트 데이터:", {
      timestamp: timestamp,
      rawText: rawText,
      processStatus: processStatus,
    });

    if (rawText && rawText.trim()) {
      processFormResponse(responseSheet, rowNumber);
    } else {
      console.log("원본텍스트가 없습니다.");
    }
  } catch (error) {
    console.error("특정 행 테스트 오류:", error);
  }
}

// 테스트 함수 - 샘플 데이터로 파싱 테스트
function testParsingWithSampleData() {
  try {
    console.log("=== 샘플 데이터 파싱 테스트 ===");

    const sampleText = `업체명: AJ
지역: 서울 송파구
1. 상품: 박스 / 규격: W450*H460*0.06MM / 사용량: 약 40,000장/인쇄: 4면인쇄
2. 상품: 테이프 / 규격: W500*H600 / 사용량: 약 20,000롤 / 사용금액: 500,000원 / 인쇄: 안함
요청사항: 납기 일정 회신 부탁드립니다`;

    const timestamp = new Date();
    const salesManager = "임민규";

    console.log("테스트할 샘플 데이터:", sampleText);
    console.log("영업담당자:", salesManager);

    // processRawData 함수 직접 호출
    processRawData(sampleText, timestamp, salesManager, null, null);

    console.log("=== 샘플 데이터 테스트 완료 ===");
  } catch (error) {
    console.error("샘플 데이터 테스트 오류:", error);
  }
}

// 전체 설정 함수
function setupAll() {
  console.log("=== 구글 폼 응답 처리 시스템 설정 시작 ===");
  console.log("대상 스프레드시트 ID:", SPREADSHEET_ID);

  setupFormResponseTrigger();
  processAllFormResponses();

  console.log("=== 전체 설정 완료 ===");
}

// 설문지 응답 시트 초기화 함수
function initializeFormResponseSheet() {
  try {
    const spreadsheet = getSpreadsheet();
    let responseSheet = spreadsheet.getSheetByName("설문지 응답");

    if (!responseSheet) {
      console.log(
        "설문지 응답 시트가 없습니다. 구글 폼과 연결되면 자동 생성됩니다."
      );
      return;
    }

    // 처리상태 컬럼이 없으면 추가
    const lastColumn = responseSheet.getLastColumn();
    if (lastColumn < 4) {
      responseSheet.getRange(1, statusIndex).setValue("처리상태");
      console.log("처리상태 컬럼 추가 완료");
    }
  } catch (error) {
    console.error("설문지 응답 시트 초기화 오류:", error);
  }
}

// 스프레드시트 정보 확인 함수
function checkSpreadsheetInfo() {
  try {
    const spreadsheet = getSpreadsheet();
    console.log("=== 스프레드시트 정보 ===");
    console.log("이름:", spreadsheet.getName());
    console.log("ID:", spreadsheet.getId());
    console.log("URL:", spreadsheet.getUrl());

    console.log("=== 시트 목록 ===");
    const sheets = spreadsheet.getSheets();
    sheets.forEach((sheet, index) => {
      console.log(`${index + 1}. ${sheet.getName()}`);
    });

    // 설문지 응답 시트 확인
    const responseSheet = spreadsheet.getSheetByName("설문지 응답");
    if (responseSheet) {
      console.log("=== 설문지 응답 시트 정보 ===");
      console.log("마지막 행:", responseSheet.getLastRow());
      console.log("마지막 열:", responseSheet.getLastColumn());
    } else {
      console.log("설문지 응답 시트가 없습니다. 구글 폼과 연결해주세요.");
    }
  } catch (error) {
    console.error("스프레드시트 정보 확인 오류:", error);
  }
}
