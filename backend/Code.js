/***************************************************
 * main.gs
 * 역할: 외부 요청(사용자/관리자)의 단일 진입점 + 라우팅만 담당 
 ***************************************************/ 

const SPREADSHEET_ID = "1DWMrJob6_EDVWHBIMRx3Ee67sekKQQcu8gU8ir21mc8";

// CORS/공통 응답 유틸
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    // .setHeader("Access-Control-Allow-Origin", "*");
}

function errorResponse(msg) {
  return jsonResponse({ status: "error", message: msg });
}

// function doOptions(e) {
//   return ContentService.createTextOutput('')
//     .setMimeType(ContentService.MimeType.TEXT)
//     .setHeader('Access-Control-Allow-Origin', '*')
//     .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
//     .setHeader('Access-Control-Allow-Headers', 'Content-Type');
// }

/**
 * GET 라우터
 * - mode=user      → 고객 입력 화면(index_user.html) 내려주기
 * - mode=console     → 관리자 화면(index_admin.html) OR 데이터 조회(JSON) 위임
 * - 그 외          → error
 */
function doGet(e) {
  try {
    const mode = e?.parameter?.mode || "user";   // "user" | "console"
    const action = e?.parameter?.action || "";       // 조회 등 console 전용

    // 1) 사용자 화면
    if (mode === "user") {
      // 사용자 쪽은 기본적으로 화면만 내려주고,
      // 실제 데이터 저장은 POST(user)에서 처리
      return HtmlService
        .createHtmlOutputFromFile("index_user")
        .setTitle("로지스 유통 견적 문의"); // index_user.html 제목과 맞춤:contentReference[oaicite:2]{index=2}
    }

    // 2) 관리자 모드
    if (mode === "console") {
      // action 없으면 그냥 관리자 UI 페이지 내려줌
      if (!action) {
        return HtmlService
          .createHtmlOutputFromFile("index_admin")
          .setTitle("견적 관리 시스템 - 관리자")
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      }

      // action 있으면, 그건 JSON 조회 같은 API 호출이니까
      // admin 모듈에게 위임
      //
      // ⚠ 중요: 이 함수는 input_admin.js에 우리가 추가할 adminGetEntry()를 호출한다.
      return adminGetEntry(e);
    }

    return errorResponse("Invalid mode in GET");
  } catch (err) {
    console.error("doGet(main) 오류:", err);
    return errorResponse("서버 오류: " + err.message);
  }
}


/**
 * POST 라우터
 * - body.mode === "user"  → 고객 견적 문의 1건 전체 텍스트(rawText 등)를 파싱해서 시트 적재하고 담당자에게 메일 보내기 (=  processRawData() 파이프라인 호출)
 * - body.mode === "console" → 관리자 페이지에서 금액/상태/담당자 갱신
 */
function doPost(e) {
  try {
    const bodyText = e.postData && e.postData.contents ? e.postData.contents : "{}";
    const data = JSON.parse(bodyText);

    const mode = data.mode || "user"; // "user" | "console"
    if (data.action === 'readAll') {
      return handleReadRequest();
    }
    // 1) 사용자 제출 라우팅 (단일 문의내용 → 파싱 후 파싱결과 시트)
    if (mode === "user") {
      return userPostEntry(data);
    }

    // 1-2) User02 전용: 멀티 필드 제출 → 파싱 없이 파싱결과_멀티필드 시트에만 기록
    if (mode === "user02") {
      return user02PostEntry(data);
    }

    // 2) 관리자 라우팅
    if (mode === "console") {
      // 실제 로직은 input_admin.js의 adminPostEntry() 쪽으로 넘긴다.
      return adminPostEntry(data);
    }

    return errorResponse("Invalid mode in POST");
  } catch (err) {
    console.error("doPost(main) 오류:", err);
    return errorResponse("서버 오류: " + err.message);
  }
}
