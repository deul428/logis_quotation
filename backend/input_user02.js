/**
 * input_user02.js - User02 전용 (멀티 필드 입력)
 * 역할: 프론트에서 받은 구조화된 데이터를 파싱 없이 '파싱결과_멀티필드' 시트에 기록.
 *
 * 개선:
 * - 인덱스 기반 삽입 금지: 결과 시트는 "헤더명 기반"으로만 값 매핑해서 append
 * - 영업담당자 이름 → 영업담당자메일: '영업담당자_리스트'에서 헤더 기반 검색
 * - 상품 → (견적)담당자/담당자메일: '견적상품_견적담당자_리스트'에서 헤더 기반 검색
 */

// ⚠️ 같은 GAS 프로젝트에 SPREADSHEET_ID(const)가 이미 선언되어 있을 수 있으므로 재선언 금지
const USER02_SPREADSHEET_ID_FALLBACK =
  "1D4o0VnekYm4WwlB_nbhDzu1LJPDkkctd7e4xh-K-hl0";

function getUser02Spreadsheet() {
  const spreadsheetId =
    typeof SPREADSHEET_ID !== "undefined"
      ? SPREADSHEET_ID
      : USER02_SPREADSHEET_ID_FALLBACK;
  return SpreadsheetApp.openById(spreadsheetId);
}

const MULTI_SHEET_NAME = "파싱결과_멀티필드";

// 시트가 완전히 비어있을 때만 초기 헤더로 사용 (운영 중에는 기존 헤더를 존중)
var DEFAULT_MULTI_HEADERS = [
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

// --- 헤더 기반 컬럼 매핑 유틸 (인덱스 기반 접근 금지) ---
function normalizeHeaderUser02_(v) {
  return String(v || "").replace(/\s/g, "").trim();
}

function findHeaderIndexUser02_(headers, headerName) {
  var target = normalizeHeaderUser02_(headerName);
  for (var i = 0; i < headers.length; i++) {
    if (normalizeHeaderUser02_(headers[i]) === target) return i;
  }
  return -1;
}

function ensureHeadersUser02_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (sheet.getLastRow() === 0 || lastCol === 0) {
    sheet
      .getRange(1, 1, 1, DEFAULT_MULTI_HEADERS.length)
      .setValues([DEFAULT_MULTI_HEADERS]);
    return DEFAULT_MULTI_HEADERS;
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  // 헤더가 전부 비어있는 경우(예: 빈 시트) 기본 헤더 세팅
  var hasAny = false;
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i] || "").trim()) {
      hasAny = true;
      break;
    }
  }
  if (!hasAny) {
    sheet
      .getRange(1, 1, 1, DEFAULT_MULTI_HEADERS.length)
      .setValues([DEFAULT_MULTI_HEADERS]);
    return DEFAULT_MULTI_HEADERS;
  }
  return headers;
}

function ensureHeaderUser02_(sheet, headers, headerName) {
  if (findHeaderIndexUser02_(headers, headerName) !== -1) return headers;
  var newCol = headers.length + 1;
  sheet.getRange(1, newCol).setValue(headerName);
  return sheet.getRange(1, 1, 1, newCol).getValues()[0];
}

function ensureRequiredHeadersUser02_(sheet, headers) {
  // 운영 중 시트에 특정 컬럼이 없을 수 있으니, 없으면 끝에 추가한다.
  var required = [
    "견적번호",
    "상태",
    "영업담당자",
    "영업담당자메일",
    "상품",
    "견적담당자",
    "견적담당자메일",
    "요청일",
    "원본데이터",
  ];
  for (var i = 0; i < required.length; i++) {
    headers = ensureHeaderUser02_(sheet, headers, required[i]);
  }
  return headers;
}

function appendRowByHeadersUser02_(sheet, headers, valuesByHeader) {
  var row = new Array(headers.length).fill("");
  for (var key in valuesByHeader) {
    if (!Object.prototype.hasOwnProperty.call(valuesByHeader, key)) continue;
    var idx = findHeaderIndexUser02_(headers, key);
    if (idx !== -1) row[idx] = valuesByHeader[key];
  }
  sheet.appendRow(row);
}

function generateEstimateNumMultiUser02_(sheet, headers) {
  var idx = findHeaderIndexUser02_(headers, "견적번호");
  var col1Based = idx === -1 ? 1 : idx + 1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return "1";
  var nums = sheet
    .getRange(2, col1Based, lastRow - 1, 1)
    .getValues()
    .map(function (r) {
      return parseInt(r[0], 10);
    })
    .filter(function (n) {
      return !isNaN(n);
    });
  var max = nums.length ? Math.max.apply(null, nums) : 0;
  return String(max + 1);
}

// 영업담당자 이름 → 영업담당자메일 (영업담당자_리스트 시트에서 헤더 기반 검색)
function getSalesManagerEmailUser02_(salesManagerName) {
  var name = String(salesManagerName || "").trim();
  if (!name) return "";
  try {
    var spreadsheet = getUser02Spreadsheet();
    var sheet = spreadsheet.getSheetByName("영업담당자_리스트");
    if (!sheet) return "";
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return "";
    var headers = data[0];
    var norm = function (v) {
      return String(v || "").replace(/\s/g, "").trim();
    };
    var findCol = function (candidates) {
      for (var i = 0; i < candidates.length; i++) {
        var c = candidates[i];
        var idx = headers.findIndex(function (h) {
          return norm(h) === norm(c);
        });
        if (idx !== -1) return idx;
      }
      return -1;
    };
    var nameCol = findCol(["영업담당자", "영업담당자명", "담당자", "이름"]);
    var emailCol = findCol(["영업담당자메일", "영업담당자 메일", "메일", "이메일"]);
    if (nameCol === -1 || emailCol === -1) return "";
    var target = norm(name);
    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      var rowName = norm(row[nameCol]);
      if (!rowName) continue;
      if (rowName === target || rowName.includes(target) || target.includes(rowName)) {
        return String(row[emailCol] || "").trim();
      }
    }
    return "";
  } catch (e) {
    console.error("User02 영업담당자 메일 매핑 오류:", e);
    return "";
  }
}

// 상품명 → {담당자명, 담당자메일} (견적상품_견적담당자_리스트 시트에서 헤더 기반 검색)
function getManagerUser02_(productName) {
  var pName = String(productName || "").trim();
  if (!pName) return { name: "", email: "" };
  try {
    var spreadsheet = getUser02Spreadsheet();
    var sheet = spreadsheet.getSheetByName("견적상품_견적담당자_리스트");
    if (!sheet) return { name: "", email: "" };

    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return { name: "", email: "" };
    var headers = data[0];

    var norm = function (v) {
      return String(v || "").replace(/\s/g, "").trim();
    };
    var findCol = function (candidates) {
      for (var i = 0; i < candidates.length; i++) {
        var c = candidates[i];
        var idx = headers.findIndex(function (h) {
          return norm(h) === norm(c);
        });
        if (idx !== -1) return idx;
      }
      return -1;
    };

    var productCol = findCol(["상품명", "상품"]);
    var managerCol = findCol(["담당자", "견적담당자"]);
    var emailCol = findCol(["담당자메일", "담당자 메일", "이메일", "메일"]);

    // fallback (구형 포맷)
    var pCol = productCol !== -1 ? productCol : 0;
    var mCol = managerCol !== -1 ? managerCol : 4;
    var eCol = emailCol !== -1 ? emailCol : 5;

    var target = norm(pName);
    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      var key = norm(row[pCol]);
      if (!key) continue;
      if (key === target || target.includes(key) || key.includes(target)) {
        return {
          name: String(row[mCol] || "").trim(),
          email: String(row[eCol] || "").trim(),
        };
      }
    }
    return { name: "", email: "" };
  } catch (e) {
    console.error("User02 담당자/메일 매핑 오류:", e);
    return { name: "", email: "" };
  }
}

/**
 * User02 프론트에서 POST body 로 전달되는 데이터 형식:
 * {
 *   salesRep: string,
 *   company: string,
 *   region: string,
 *   note: string,
 *   products: [ { productName, spec, usage, amount, print } ]
 * }
 */
function user02PostEntry(data) {
  try {
    var salesRep = (data.salesRep != null ? data.salesRep : "").toString().trim();
    var company = (data.company != null ? data.company : "").toString().trim();
    var region = (data.region != null ? data.region : "").toString().trim();
    var note = (data.note != null ? data.note : "").toString().trim();
    var products = Array.isArray(data.products) ? data.products : [];

    if (products.length === 0) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: "error", message: "상품이 없습니다." })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var spreadsheet = getUser02Spreadsheet();
    var sheet = spreadsheet.getSheetByName(MULTI_SHEET_NAME);
    if (!sheet) sheet = spreadsheet.insertSheet(MULTI_SHEET_NAME);

    var headers = ensureHeadersUser02_(sheet);
    headers = ensureRequiredHeadersUser02_(sheet, headers);

    var now = new Date();
    var salesManagerEmail = getSalesManagerEmailUser02_(salesRep);
    var rawText =
      "업체명: " +
      company +
      "\n지역: " +
      region +
      "\n요청사항: " +
      note +
      "\n" +
      products
        .map(function (p, i) {
          return (
            (i + 1) +
            ". 상품: " +
            (p.productName || "") +
            " / 규격: " +
            (p.spec || "") +
            " / 사용량: " +
            (p.usage || "") +
            " / 사용금액: " +
            (p.amount || "") +
            " / 인쇄: " +
            (p.print || "")
          );
        })
        .join("\n");

    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      var estimateNum = generateEstimateNumMultiUser02_(sheet, headers);
      var manager = getManagerUser02_(p.productName);

      appendRowByHeadersUser02_(sheet, headers, {
        "견적번호": estimateNum,
        "상태": "접수전",
        "부서(팀)": "",
        "영업담당자": salesRep,
        "영업담당자메일": salesManagerEmail || "",
        "견적담당자": manager.name || "",
        "견적담당자메일": manager.email || "",
        "요청일": now,
        "회신일": "",
        "견적 유효기간": "",
        "업체명": company,
        "대분류": "",
        "상품": p.productName != null ? String(p.productName) : "",
        "규격(스팩)": p.spec != null ? String(p.spec) : "",
        "영업 정보": "",
        "견적요청비고": note,
        "추가 정보 필요사항": "",
        "샘플 필요여부": "",
        "인쇄": p.print != null ? String(p.print) : "",
        "색상,도수": "",
        "MOQ": "",
        "사용량(월평균)": p.usage != null ? String(p.usage) : "",
        "사용금액(월평균)": p.amount != null ? String(p.amount) : "",
        "지역(착지)": region,
        "기타요청": "",
        "견적가(매입)": "",
        "제안규격": "",
        "MOQ2": "",
        "공급사": "",
        "수주여부": "",
        "원본데이터": rawText,
        "견적 금액": "",
        "견적담당자 비고": "",
      });
    }

    return ContentService.createTextOutput(
      JSON.stringify({ status: "ok", message: "파싱결과_멀티필드에 저장되었습니다." })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error("user02PostEntry 오류:", err);
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: err.message || String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

