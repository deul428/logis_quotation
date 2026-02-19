// ============================================
// 견적 관리 자동화 시스템 - 구글 폼 응답 처리 버전
// ============================================
// 특정 스프레드시트 ID 지정
// const SPREADSHEET_ID = "1DWMrJob6_EDVWHBIMRx3Ee67sekKQQcu8gU8ir21mc8";

// 특정 스프레드시트 사용
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// 폼 응답 시트 이름 후보 (구글 폼 연결 시 시트명이 다를 수 있음)
const FORM_RESPONSE_SHEET_NAMES = ["설문지 응답", "Form responses 1", "Form responses 2", "Form_responses"];

// 폼 응답이 기록되는 시트 반환 (이름으로 검색)
function getFormResponseSheet() {
  const spreadsheet = getSpreadsheet();
  for (let i = 0; i < FORM_RESPONSE_SHEET_NAMES.length; i++) {
    const sheet = spreadsheet.getSheetByName(FORM_RESPONSE_SHEET_NAMES[i]);
    if (sheet) return sheet;
  }
  return null;
}

// 시트가 폼 응답 시트인지 여부
function isFormResponseSheet(sheetName) {
  return FORM_RESPONSE_SHEET_NAMES.some((name) => sheetName === name);
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

    // 폼 응답 시트(설문지 응답 / Form responses 1 등)의 새 응답 처리
    if (isFormResponseSheet(sheetName)) {
      console.log("폼 응답 감지, 처리 시작 시트:", sheetName);
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

    // 폼 응답 시트에서 편집 시 처리 (B열 고정이 아닌 '견적 문의 내용' 열 기준은 processFormResponse 내부에서 처리)
    if (isFormResponseSheet(sheetName)) {
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

// 헤더 이름으로 '처리상태' 열 인덱스 반환 (0-based). 없으면 열 추가 후 인덱스 반환.
function getStatusColumnIndex(sheet) {
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idx = headerRow.findIndex((h) => (h && String(h).trim()) === "처리상태");
  if (idx >= 0) return idx;
  const newCol = headerRow.length + 1;
  sheet.getRange(1, newCol).setValue("처리상태");
  return newCol - 1; // 0-based
}

// 구글 폼 응답 처리 함수
function processFormResponse(sheet, row) {
  try {
    console.log("=== 구글 폼 응답 처리 시작 ===");
    const headerRow = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    Logger.log("헤더:", headerRow);
    const normHeader = (v) => String(v || "").replace(/\s/g, "").trim();
    const getColIndex = (name) =>
      headerRow.findIndex((h) => h && normHeader(h) === normHeader(name));
    // 헤더가 '견적 문의 내용'을 포함하는 열 찾기 (폼에서 '(필수)' 등이 붙은 경우 대비)
    const getRawTextCol = () => {
      const exact = getColIndex("견적 문의 내용");
      if (exact >= 0) return exact;
      const contains = headerRow.findIndex((h) => h && String(h).trim().indexOf("견적 문의 내용") !== -1);
      if (contains >= 0) return contains;
      const fallback = headerRow.findIndex((h) => h && (String(h).indexOf("문의 내용") !== -1 || String(h).indexOf("견적") !== -1));
      if (fallback >= 0) return fallback;
      return 1; // B열(인덱스 1) 폴백: 설문지 응답에서 두 번째 열이 문의 내용인 경우
    };

    // 🔹 필요한 열 이름 지정 (헤더 명 그대로)
    const timestampIdx = getColIndex("타임스탬프") >= 0 ? getColIndex("타임스탬프") : 0;
    const rawTextIdx = getRawTextCol();
    const salesManagerNameIdx = getColIndex("영업담당자");
    const statusIdx = getColIndex("처리상태");

    // 응답 데이터 가져오기 (전체 행)
    const lastColumn = sheet.getLastColumn();
    const rowData = sheet.getRange(row, 1, 1, lastColumn).getValues()[0];

    console.log("응답 데이터:", rowData);

    // 🔹 각 열 데이터 추출
    const timestamp = timestampIdx > -1 ? rowData[timestampIdx] : "";
    const rawText = rawTextIdx > -1 ? rowData[rawTextIdx] : "";
    const salesManagerName =
      salesManagerNameIdx > -1 ? rowData[salesManagerNameIdx] : "";
    const status = statusIdx > -1 ? rowData[statusIdx] : "";

    // 처리상태 컬럼: 헤더 이름으로 찾은 열에만 업데이트 (인덱스 사용 금지)
    const statusCol = statusIdx >= 0 ? statusIdx : getStatusColumnIndex(sheet);
    sheet.getRange(row, statusCol + 1).setValue("처리중");

    console.log("데이터 파싱 시작");

    // 파싱 및 처리
    processRawData(rawText, timestamp, salesManagerName, row, sheet);
  } catch (error) {
    alert(error);
    console.error("구글 폼 응답 처리 오류:", error);

    // 오류 발생 시 처리상태 업데이트 (헤더 '처리상태' 열에 기록)
    try {
      const statusCol = getStatusColumnIndex(sheet);
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

// ============================================
// HTML 프론트 fetch() → 시트 직접 기록용 API
// ============================================
// function userPostEntry(e) {
//   try {
//     const data = JSON.parse(e.postData.contents);
//     Logger.log("✅ 요청 수신:", e.postData.contents);
//     const sheet =
//       SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("설문지 응답");
//     const timestamp = new Date();
//     const rawText = data.rawText || "";
//     const user = data.user || "";
//     const email = data.email || "";

//     // 시트에 한 줄 추가 (A: Timestamp, B: 원본텍스트, C: 처리상태)
//     const newRow = [timestamp, rawText, "대기", user, email];
//     sheet.appendRow(newRow);

//     // 새로 추가된 행 번호 가져오기
//     const lastRow = sheet.getLastRow();

//     // 폼 응답 자동 처리와 동일하게 호출
//     processFormResponse(sheet, lastRow);

//     return ContentService.createTextOutput(
//       JSON.stringify({ status: "success" })
//     )
//       .setMimeType(ContentService.MimeType.JSON)
//       .setHeader("Access-Control-Allow-Origin", "*")
//       .setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
//   } catch (error) {
//     console.error("❌ doPost 오류:", error);
//     return ContentService.createTextOutput(
//       JSON.stringify({ status: "error", message: error.toString() })
//     ).setMimeType(ContentService.MimeType.JSON);
//   }
// }
// function doOptions(e) {
//   return ContentService.createTextOutput("")
//     .setHeader("Access-Control-Allow-Origin", "*")
//     .setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
//     .setHeader("Access-Control-Allow-Headers", "Content-Type");
// }
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
    if (data.length < 2) return { name: "미지정", email: "" };

    // ⚠️ 기존에는 [상품명, ..., 담당자, 담당자메일] 처럼 '인덱스'로 꺼내서
    // 시트 컬럼이 조금만 바뀌어도 엉뚱한 값(예: 상태값/다른 주소)이 '담당자메일'로 들어갈 수 있었음.
    // → 반드시 헤더명 기반으로 컬럼을 찾아 사용한다.
    const headers = data[0];
    const norm = (v) => String(v || "").replace(/\s/g, "").trim();
    const findCol = (candidates) => {
      for (const name of candidates) {
        const idx = headers.findIndex((h) => norm(h) === norm(name));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const productCol = findCol(["상품명", "상품"]);
    const managerCol = findCol(["담당자", "견적담당자"]);
    const emailCol = findCol(["담당자메일", "담당자 메일", "이메일", "메일"]);

    // fallback (구형 시트 포맷)
    const pCol = productCol !== -1 ? productCol : 0;
    const mCol = managerCol !== -1 ? managerCol : 4;
    const eCol = emailCol !== -1 ? emailCol : 5;

    const input = norm(productName);
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const 상품명 = row[pCol];
      const 담당자 = row[mCol];
      const 담당자메일 = row[eCol];

      const key = norm(상품명);
      if (!key || !input) continue;

      // exact 우선, 그 다음 포함 매칭
      if (input === key || input.includes(key) || key.includes(input)) {
        console.log(
          `담당자 매칭: ${상품명} → ${담당자} (${담당자메일 || "메일 없음"})`
        );
        return { name: 담당자 || "미지정", email: 담당자메일 || "" };
      }
    }

    console.log("매칭되는 담당자 없음");
    return { name: "미지정", email: "" };
  } catch (error) {
    console.error("담당자 매핑 오류:", error);
    return { name: "미지정", email: "" };
  }
}

// 영업담당자 이름 → { name, email } 매핑 (영업담당자_리스트 시트에서 헤더 기반 검색)
function getSalesManagerInfo(salesManagerName) {
  const name = String(salesManagerName || "").trim();
  if (!name) return { name: "", email: "" };

  try {
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName("영업담당자_리스트");
    if (!sheet) {
      console.log("영업담당자_리스트 시트를 찾을 수 없음");
      return { name, email: "" };
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return { name, email: "" };
    const headers = data[0];

    const norm = (v) => String(v || "").replace(/\s/g, "").trim();
    const findCol = (candidates) => {
      for (const c of candidates) {
        const idx = headers.findIndex((h) => norm(h) === norm(c));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const nameCol = findCol(["영업담당자", "영업담당자명", "담당자", "이름"]);
    const emailCol = findCol(["영업담당자메일", "영업담당자 메일", "메일", "이메일"]);

    if (emailCol === -1) {
      console.log("영업담당자_리스트에서 메일 컬럼을 찾지 못함");
      return { name, email: "" };
    }

    const targetName = norm(name);

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowName = nameCol !== -1 ? norm(row[nameCol]) : "";

      // 이름 매칭
      if (targetName && rowName) {
        if (rowName === targetName || rowName.includes(targetName) || targetName.includes(rowName)) {
          return {
            name: nameCol !== -1 ? String(row[nameCol] || "").trim() : name,
            email: String(row[emailCol] || "").trim(),
          };
        }
      }
    }

    return { name, email: "" };
  } catch (e) {
    console.error("영업담당자 매핑 오류:", e);
    return { name, email: "" };
  }
}

function getSalesManagerEmail(salesManagerName) {
  const info = getSalesManagerInfo(salesManagerName);
  return info.email || "";
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
  salesManagerName,
  timestamp,
  rawText
) {
  try {
    const spreadsheet = getSpreadsheet();
    let finalSheet = spreadsheet.getSheetByName("파싱결과");

    if (!finalSheet) {
      finalSheet = spreadsheet.insertSheet("파싱결과");
    }

    // --- 헤더 기반 매핑 유틸 (인덱스 기반 접근 금지) ---
    const normalizeHeaderUser_ = (v) => String(v || "").replace(/\s/g, "").trim();
    const findHeaderIndexUser_ = (headers, headerName) => {
      const target = normalizeHeaderUser_(headerName);
      return headers.findIndex((h) => normalizeHeaderUser_(h) === target);
    };
    const ensureHeaderUser_ = (sheet, headerName) => {
      const lastCol = sheet.getLastColumn();
      const headers =
        lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
      const idx = findHeaderIndexUser_(headers, headerName);
      if (idx !== -1) return headers;
      const newCol = (headers.length || 0) + 1;
      sheet.getRange(1, newCol).setValue(headerName);
      return sheet.getRange(1, 1, 1, newCol).getValues()[0];
    };
    const ensureFinalHeadersUser_ = (sheet) => {
      // 시트가 비어 있으면 기본 헤더를 만든다.
      if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
        const baseHeaders = [
          "견적번호",
          "상태",
          "부서(팀)",
          "영업담당자",
          "영업담당자메일",
          "견적담당자",
          "견적담당자메일",
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
        ];
        sheet.getRange(1, 1, 1, baseHeaders.length).setValues([baseHeaders]);
        return baseHeaders;
      }
      // 운영 중 시트는 기존 헤더를 존중하되, 필요한 헤더가 없으면 뒤에 추가
      let headers = sheet
        .getRange(1, 1, 1, sheet.getLastColumn())
        .getValues()[0];
      [
        "견적번호",
        "상태",
        "영업담당자",
        "영업담당자메일",
        "견적담당자",
        "견적담당자메일",
        "요청일",
        "업체명",
        "상품",
        "규격(스팩)",
        "견적요청비고",
        "인쇄",
        "사용량(월평균)",
        "사용금액(월평균)",
        "지역(착지)",
        "원본데이터",
      ].forEach((h) => {
        headers = ensureHeaderUser_(sheet, h);
      });
      return headers;
    };
    const appendRowByHeadersUser_ = (sheet, headers, valuesByHeader) => {
      const row = new Array(headers.length).fill("");
      Object.keys(valuesByHeader).forEach((key) => {
        const idx = findHeaderIndexUser_(headers, key);
        if (idx !== -1) row[idx] = valuesByHeader[key];
      });
      sheet.appendRow(row);
    };
    const generateEstimateNumByHeaderUser_ = (sheet, headers) => {
      const idx = findHeaderIndexUser_(headers, "견적번호");
      const col1Based = idx === -1 ? 1 : idx + 1;
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) return "1";
      const nums = sheet
        .getRange(2, col1Based, lastRow - 1, 1)
        .getValues()
        .map((r) => parseInt(r[0], 10))
        .filter((n) => !isNaN(n));
      const max = nums.length ? Math.max.apply(null, nums) : 0;
      return String(max + 1);
    };

    const headers = ensureFinalHeadersUser_(finalSheet);
    const estimateNum = generateEstimateNumByHeaderUser_(finalSheet, headers);
    const salesInfo = getSalesManagerInfo(salesManagerName);
    const resolvedSalesManagerName = salesInfo.name || String(salesManagerName || "").trim();
    const salesManagerEmail = salesInfo.email || "";

    // 상태 열로 통합: 신규 접수는 '접수전'
    appendRowByHeadersUser_(finalSheet, headers, {
      "견적번호": estimateNum,
      "상태": "접수전",
      "부서(팀)": "",
      // 영업담당자는 "성함"을 기본 식별자로 저장합니다. (사번은 폼/시트에 남아있더라도 보조값)
      "영업담당자": resolvedSalesManagerName,
      "영업담당자메일": salesManagerEmail || "",
      "견적담당자": manager?.name || "",
      "견적담당자메일": manager?.email || "",
      "요청일": timestamp || new Date(),
      "회신일": "",
      "견적 유효기간": "",
      "업체명": parsedData["업체명"] || "",
      "대분류": parsedData["대분류"] || "",
      "상품": parsedData["상품"] || "",
      "규격(스팩)": parsedData["규격(스팩)"] || "",
      "영업 정보": "",
      "견적요청비고": parsedData["견적요청비고"] || "",
      "추가 정보 필요사항": "",
      "샘플 필요여부": "",
      "인쇄": parsedData["인쇄"] || "",
      "색상,도수": parsedData["색상,도수"] || "",
      "MOQ": parsedData["MOQ"] || "",
      "사용량(월평균)": parsedData["사용량(월평균)"] || "",
      "사용금액(월평균)": parsedData["사용금액(월평균)"] || "",
      "지역(착지)": parsedData["지역(착지)"] || "",
      "기타요청": parsedData["기타요청"] || "",
      "견적가(매입)": parsedData["견적가(매입)"] || "",
      "제안규격": "",
      "MOQ2": "",
      "공급사": parsedData["공급사"] || "",
      "수주여부": "",
      "원본데이터": rawText || "",
      "견적 금액": "",
      "견적담당자 비고": "",
    });
    console.log("데이터 삽입 완료!");

    // 담당자 이메일이 있으면 자동 메일 발송
    if (manager.email) {
      sendEmailToManager(manager, resolvedSalesManagerName, parsedData, estimateNum);
    }
  } catch (error) {
    console.error("데이터 삽입 오류:", error);
    throw error; // processRawData에서 처리오류 처리 및 처리상태 업데이트하도록 재발생
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
    <p>안녕하세요, <sdivong>${manager.name}</sdivong>님.</p>

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

// 설문지 응답 처리상태 업데이트 (헤더 '처리상태' 열에만 기록)
function updateFormResponseStatus(sheet, row, status) {
  try {
    const statusCol = getStatusColumnIndex(sheet); // 0-based, 없으면 열 추가
    sheet.getRange(row, statusCol + 1).setValue(status); // 1-based 열 번호
    console.log("처리상태 업데이트:", status);
  } catch (error) {
    console.error("처리상태 업데이트 오류:", error);
  }
}

// 원본 데이터 처리 메인 함수 (구글 폼 응답용으로 수정)
function processRawData(
  rawText,
  timestamp,
  salesManagerName,
  sourceRow,
  sourceSheet
) {
  try {
    console.log("=== 구글 폼 응답 데이터 처리 시작 ===");
    const rawStr = rawText != null ? String(rawText).trim() : "";
    console.log("원본 텍스트 길이:", rawStr.length, "첫 100자:", rawStr.slice(0, 100));

    if (!rawStr) {
      console.warn("원본 텍스트가 비어 있어 파싱/삽입을 건너뜁니다. '견적 문의 내용' 열 헤더를 확인하세요.");
      if (sourceRow && sourceSheet) {
        updateFormResponseStatus(sourceSheet, sourceRow, "처리오류");
      }
      return;
    }

    const baseData = parseKakaoText(rawStr);
    console.log("기본 정보 파싱 결과:", baseData);

    const hasMultipleProducts =
      rawStr.match(/^\d+\./m) ||
      (rawStr.match(/^상품\s*[:：]/m) && rawStr.match(/^규격/m));

    if (hasMultipleProducts) {
      const products = parseMultipleProducts(rawStr);
      console.log("분리된 상품들:", products);

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        console.log("처리 중인 상품 " + (i + 1) + ":", product);

        const rowData = mapProductData(baseData, product);
        const manager = getManager(rowData.상품);

        insertToFinalSheet(rowData, manager, salesManagerName, timestamp, rawStr);
        console.log("상품 " + (i + 1) + " 삽입 완료");
      }
    } else {
      const manager = getManager(baseData.상품);
      insertToFinalSheet(baseData, manager, salesManagerName, timestamp, rawStr);
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

// 수동 처리 함수 - 설문지 응답 시트 대상 (헤더 이름으로 열 식별)
function processAllFormResponses() {
  try {
    console.log("=== 모든 설문지 응답 처리 시작 ===");

    const responseSheet = getFormResponseSheet();
    if (!responseSheet) {
      console.error("폼 응답 시트를 찾을 수 없습니다. 시트명: 설문지 응답 / Form responses 1 / Form_responses 등 확인");
      return;
    }

    const data = responseSheet.getDataRange().getValues();
    if (data.length < 2) {
      console.log("처리할 응답 데이터가 없습니다.");
      return;
    }

    const headerRow = data[0];
    const getCol = (name) => headerRow.findIndex((h) => h && String(h).trim() === name.trim());
    const timestampIdx = getCol("타임스탬프");
    const rawTextIdx = getCol("견적 문의 내용");
    const statusIdx = getCol("처리상태");

    let processedCount = 0;
    for (let i = 1; i < data.length; i++) {
      const rowData = data[i];
      const rawText = rawTextIdx >= 0 ? rowData[rawTextIdx] : rowData[1];
      const processStatus = statusIdx >= 0 ? (rowData[statusIdx] || "") : "";

      if (rawText && String(rawText).trim() && processStatus !== "처리완료") {
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

    const responseSheet = getFormResponseSheet();
    if (!responseSheet) {
      console.error("폼 응답 시트를 찾을 수 없습니다!");
      return;
    }

    const lastColumn = responseSheet.getLastColumn();
    const headerRow = responseSheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    const rowData = responseSheet.getRange(rowNumber, 1, 1, lastColumn).getValues()[0];
    const getCol = (name) => headerRow.findIndex((h) => h && String(h).trim() === name.trim());
    const rawTextIdx = getCol("견적 문의 내용");
    const rawText = rawTextIdx >= 0 ? rowData[rawTextIdx] : rowData[1];

    console.log("테스트 데이터:", { rowNumber, rawText: rawText ? String(rawText).slice(0, 80) + "..." : "" });

    if (rawText && String(rawText).trim()) {
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
    const salesManagerName = "임민규";

    console.log("테스트할 샘플 데이터:", sampleText);
    console.log("영업담당자:", salesManagerName);

    // processRawData 함수 직접 호출
    processRawData(sampleText, timestamp, salesManagerName, null, null);

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
    const responseSheet = getFormResponseSheet();
    if (!responseSheet) {
      console.log(
        "폼 응답 시트가 없습니다. 구글 폼과 연결하거나 시트명을 설문지 응답 / Form responses 1 / Form_responses 로 확인하세요."
      );
      return;
    }

    // 처리상태 컬럼이 없으면 추가 (헤더 이름으로 검사)
    getStatusColumnIndex(responseSheet);
    console.log("처리상태 컬럼 확인/추가 완료");
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

    // 폼 응답 시트 확인
    const responseSheet = getFormResponseSheet();
    if (responseSheet) {
      console.log("=== 폼 응답 시트 정보 ===");
      console.log("시트명:", responseSheet.getName());
      console.log("마지막 행:", responseSheet.getLastRow());
      console.log("마지막 열:", responseSheet.getLastColumn());
    } else {
      console.log("폼 응답 시트가 없습니다. 구글 폼과 연결하거나 시트명을 확인해주세요.");
    }
  } catch (error) {
    console.error("스프레드시트 정보 확인 오류:", error);
  }
}
