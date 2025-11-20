/**
 * input_admin.js - 관리자용 데이터 조회 및 수정
 * 구글 앱스 스크립트용 (웹앱으로 배포)
 */

// 스프레드시트 접근 함수
function getSpreadsheet() {
  Logger.info(SpreadsheetApp.openById(SPREADSHEET_ID));
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// ============================================
// 진입점 함수들 (웹앱 배포용)
// ============================================

/**
 * GET 요청 처리 - HTML 페이지 제공 또는 데이터 조회
 */
function adminGetEntry(e) {
  try {
    const action = e.parameter.action;

    // // 액션이 없으면 HTML 페이지 제공
    // if (!action) {
    //   return HtmlService.createHtmlOutputFromFile('index_admin')
    //     .setTitle('견적 관리 시스템 - 관리자')
    //     .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    // }

    // 액션별 처리
    switch (action) {
      case "readAll":
        return handleReadRequest();
      case "readSpecific":
        return handleReadSpecific(e.parameter.estimateNum);
      case "readFiltered":
        return handleReadFiltered(e.parameter);
      default:
        return errorResponse("doGetAdmin Invalid action: " + action);
    }
  } catch (error) {
    console.error("doGetAdmin 오류:", error);
    return errorResponse("서버 오류: " + error.toString());
  }
}

/**
 * POST 요청 처리 - 데이터 수정
 */
function adminPostEntry(data) {
  try {
    const action = data.action;
    if (!action) return errorResponse("Action is required");

    if (action.includes("updateEstimate")) {
      return updateAdminValue(data);
    } else if (action.includes("sendToSalesManager")) {
      return sendEmailToSalesManager(data);
    } else if (action.includes("updateStatus")) {
      return handleUpdateStatus(data);
    } else if (action.includes("updateManager")) {
      return handleUpdateManager(data);
    } else {
      return errorResponse("adminPostEntry Invalid action: " + action);
    }
  } catch (error) {
    console.error("adminPostEntry 오류:", error);
    return errorResponse("서버 오류: " + error.toString());
  }
}

/**
 * OPTIONS 요청(CORS 프리플라이트) 허용
 */

// ============================================
// 데이터 조회 함수들 (admin.js 기반)
// ============================================

/**
 * 전체 데이터 조회
 */
function handleReadRequest() {
  try {
    const sheet = getSpreadsheet().getSheetByName("파싱결과");
    if (!sheet) {
      throw new Error("파싱결과 시트를 찾을 수 없습니다.");
    }

    const data = sheet.getDataRange().getValues();
    console.log("전체 데이터 조회 완료:", data.length, "행");

    return jsonResponse({
      status: "success",
      data: data,
      count: data.length - 1, // 헤더 제외
    });
  } catch (error) {
    console.error("데이터 조회 오류:", error);
    return errorResponse("시트 조회 오류: " + error.toString());
  }
}

/**
 * 특정 견적 조회
 */
function handleReadSpecific(estimateNum) {
  try {
    if (!estimateNum) {
      return errorResponse("견적번호가 필요합니다.");
    }

    const sheet = getSpreadsheet().getSheetByName("파싱결과");
    if (!sheet) {
      throw new Error("파싱결과 시트를 찾을 수 없습니다.");
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const estimateNumCol = headers.indexOf("견적번호");

    if (estimateNumCol === -1) {
      return errorResponse("견적번호 열을 찾을 수 없습니다.");
    }

    // 견적번호로 검색
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][estimateNumCol]) === String(estimateNum)) {
        const rowData = data[i];
        const result = {};

        // 헤더와 매핑하여 객체 생성
        headers.forEach((header, index) => {
          result[header] = rowData[index];
        });

        return jsonResponse({
          status: "success",
          data: result,
        });
      }
    }

    return errorResponse("견적번호를 찾을 수 없습니다: " + estimateNum);
  } catch (error) {
    console.error("특정 견적 조회 오류:", error);
    return errorResponse("조회 오류: " + error.toString());
  }
}

/**
 * 필터링된 데이터 조회
 */
function handleReadFiltered(params) {
  try {
    const sheet = getSpreadsheet().getSheetByName("파싱결과");
    if (!sheet) {
      throw new Error("파싱결과 시트를 찾을 수 없습니다.");
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const filteredData = [headers]; // 헤더 포함

    // 필터 조건 적용
    for (let i = 1; i < data.length; i++) {
      let match = true;
      const row = data[i];

      // 상태 필터
      if (params.status) {
        const statusCol = headers.indexOf("상태");
        if (statusCol !== -1 && row[statusCol] !== params.status) {
          match = false;
        }
      }

      // 업체명 필터
      if (params.company && match) {
        const companyCol = headers.indexOf("업체명");
        if (
          companyCol !== -1 &&
          !row[companyCol].toString().includes(params.company)
        ) {
          match = false;
        }
      }

      // 담당자 필터
      if (params.manager && match) {
        const managerCol = headers.indexOf("견적담당자");
        if (
          managerCol !== -1 &&
          !row[managerCol].toString().includes(params.manager)
        ) {
          match = false;
        }
      }

      if (match) {
        filteredData.push(row);
      }
    }

    console.log("필터링된 데이터 조회 완료:", filteredData.length - 1, "행");

    return jsonResponse({
      status: "success",
      data: filteredData,
      count: filteredData.length - 1,
    });
  } catch (error) {
    console.error("필터링 조회 오류:", error);
    return errorResponse("필터링 조회 오류: " + error.toString());
  }
}

// ============================================
// 데이터 수정 함수들 (admin.js 기반)
// ============================================

/**
 * 견적 금액 업데이트 (admin.js 로직 활용)
 */
function updateAdminValue(data) {
  try {
    const estimateNum = data.estimateNum;
    if (!estimateNum) {
      return jsonResponse({
        status: "error",
        message: "견적번호가 필요합니다.",
      });
    }

    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName("파싱결과");

    if (!sheet) {
      return jsonResponse({
        status: "error",
        message: "파싱결과 시트를 찾을 수 없습니다.",
      });
    }

    // 헤더 행 찾기
    const headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    const estimateNumColIndex = headers.indexOf("견적번호") + 1;
    if (estimateNumColIndex === 0) {
      return jsonResponse({
        status: "error",
        message: "견적번호 열을 찾을 수 없습니다.",
      });
    }

    // 견적번호로 행 찾기
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    let targetRow = -1;

    for (let i = 1; i < values.length; i++) {
      if (String(values[i][estimateNumColIndex - 1]) === String(estimateNum)) {
        targetRow = i + 1; // 시트 행 번호는 1부터 시작
        break;
      }
    }

    if (targetRow === -1) {
      return jsonResponse({
        status: "error",
        message: "견적번호를 찾을 수 없습니다: " + estimateNum,
      });
    }

    let msg = "";
    const statusColIndex = headers.indexOf("상태") + 1;

    const newAmount = data.newAmount || "";
    const newMemo = data.newMemo || "";
    let shouldUpdateStatus = false; // 상태 업데이트 여부 플래그
    
    if (data.action.includes("cost")) {
      const amountColIndex = headers.indexOf("견적 금액") + 1;

      // 견적 금액 업데이트
      if (newAmount !== "" && amountColIndex > 0) {
        sheet.getRange(targetRow, amountColIndex).setValue(newAmount);
        msg = "견적 금액 업데이트 완료";
        shouldUpdateStatus = true;
      }
    } else if (data.action.includes("memo")) {
      const memoColIndex = headers.indexOf("견적담당자 비고") + 1;
      // 견적담당자 비고 업데이트
      if (newMemo !== "" && memoColIndex > 0) {
        sheet.getRange(targetRow, memoColIndex).setValue(newMemo);
        msg = "견적 비고 업데이트 완료";
        shouldUpdateStatus = true;
      }
    } else if (data.action.includes("all")) {
      const amountColIndex = headers.indexOf("견적 금액") + 1;
      const memoColIndex = headers.indexOf("견적담당자 비고") + 1;
      if (
        newAmount !== "" &&
        amountColIndex > 0 &&
        newMemo !== "" &&
        memoColIndex > 0
      ) {
        // 견적 금액 및 견적담당자 비고 업데이트
        if (newMemo !== "" && memoColIndex > 0) {
          sheet.getRange(targetRow, amountColIndex).setValue(newAmount);
          sheet.getRange(targetRow, memoColIndex).setValue(newMemo);
          msg = "견적 금액 및 비고 업데이트 완료";
          shouldUpdateStatus = true;
        }
      }
    }
    
    // 견적 금액 또는 비고 입력 후 메일 발송하지 않은 경우 상태를 "접수진행중"으로 업데이트
    // (메일 발송은 별도 함수에서 처리하므로, 여기서는 입력만 했을 때 상태 업데이트)
    if (shouldUpdateStatus && statusColIndex > 0) {
      const currentStatus = sheet.getRange(targetRow, statusColIndex).getValue();
      // 현재 상태가 "접수 전"이거나 빈 값인 경우에만 "접수진행중"으로 업데이트
      // (이미 "발송완료"인 경우는 유지)
      if (!currentStatus || currentStatus === "접수 전" || currentStatus === "") {
        sheet.getRange(targetRow, statusColIndex).setValue("접수진행중");
        Logger.log(
          `견적번호 ${estimateNum} 행(${targetRow})에 상태를 '접수진행중'으로 업데이트 완료`
        );
      }
    }

    return jsonResponse({
      status: "success",
      message: msg,
      estimateNum: estimateNum,
      newAmount: newAmount || undefined,
      newMemo: newMemo || undefined,
    });
  } catch (error) {
    console.error("updateAdminValue 오류:", error);
    return jsonResponse({
      status: "error",
      message: "관리자 요청 값 업데이트 오류: " + error.message,
    });
  }
}

/* function handleUpdateEstimate(data) {
  try {
    // 입력 검증
    const validation = validateEstimateUpdate(data);
    if (!validation.valid) {
      return errorResponse(validation.message);
    }

    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("파싱결과");
    const all = sheet.getDataRange().getValues();
    const headers = all[0];

    const numCol = headers.indexOf("견적번호") + 1;
    const amountCol = headers.indexOf("견적 금액") + 1;

    if (!numCol || !amountCol) {
      throw new Error("견적번호 또는 견적 금액 열을 찾을 수 없습니다.");
    }

    for (let i = 1; i < all.length; i++) {
      if (String(all[i][numCol - 1]) === String(data.estimateNum)) {
        sheet.getRange(i + 1, amountCol).setValue(data.newAmount);

        console.log(
          "견적 금액 업데이트 완료:",
          data.estimateNum,
          "→",
          data.newAmount
        );

        return jsonResponse({
          status: "success",
          message: "견적 금액 업데이트 완료",
          estimateNum: data.estimateNum,
          newAmount: data.newAmount,
        });
      }
    }

    return errorResponse("견적번호를 찾을 수 없습니다: " + data.estimateNum);
  } catch (error) {
    console.error("견적 금액 업데이트 오류:", error);
    return errorResponse("견적 업데이트 오류: " + error.toString());
  }
} */

/**
 * 상태 업데이트
 */
function handleUpdateStatus(data) {
  try {
    // 입력 검증
    const validation = validateStatusUpdate(data);
    if (!validation.valid) {
      return errorResponse(validation.message);
    }

    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("파싱결과");
    const all = sheet.getDataRange().getValues();
    const headers = all[0];

    const numCol = headers.indexOf("견적번호") + 1;
    const statusCol = headers.indexOf("상태") + 1;

    if (!numCol || !statusCol) {
      throw new Error("견적번호 또는 상태 열을 찾을 수 없습니다.");
    }

    for (let i = 1; i < all.length; i++) {
      if (String(all[i][numCol - 1]) === String(data.estimateNum)) {
        sheet.getRange(i + 1, statusCol).setValue(data.newStatus);

        console.log(
          "상태 업데이트 완료:",
          data.estimateNum,
          "→",
          data.newStatus
        );

        return jsonResponse({
          status: "success",
          message: "상태 업데이트 완료",
          estimateNum: data.estimateNum,
          newStatus: data.newStatus,
        });
      }
    }

    return errorResponse("견적번호를 찾을 수 없습니다: " + data.estimateNum);
  } catch (error) {
    console.error("상태 업데이트 오류:", error);
    return errorResponse("상태 업데이트 오류: " + error.toString());
  }
}

/**
 * 담당자 업데이트
 */
function handleUpdateManager(data) {
  try {
    // 입력 검증
    const validation = validateManagerUpdate(data);
    if (!validation.valid) {
      return errorResponse(validation.message);
    }

    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("파싱결과");
    const all = sheet.getDataRange().getValues();
    const headers = all[0];

    const numCol = headers.indexOf("견적번호") + 1;
    const managerCol = headers.indexOf("견적담당자") + 1;

    if (!numCol || !managerCol) {
      throw new Error("견적번호 또는 견적담당자 열을 찾을 수 없습니다.");
    }

    for (let i = 1; i < all.length; i++) {
      if (String(all[i][numCol - 1]) === String(data.estimateNum)) {
        sheet.getRange(i + 1, managerCol).setValue(data.newManager);

        console.log(
          "담당자 업데이트 완료:",
          data.estimateNum,
          "→",
          data.newManager
        );

        return jsonResponse({
          status: "success",
          message: "담당자 업데이트 완료",
          estimateNum: data.estimateNum,
          newManager: data.newManager,
        });
      }
    }

    return errorResponse("견적번호를 찾을 수 없습니다: " + data.estimateNum);
  } catch (error) {
    console.error("담당자 업데이트 오류:", error);
    return errorResponse("담당자 업데이트 오류: " + error.toString());
  }
}

// ============================================
// 유틸리티 함수들
// ============================================

/**
 * JSON 응답 생성
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data));
  // .setMimeType(ContentService.MimeType.JSON)
  // .setHeader('Access-Control-Allow-Origin', '*')
  // .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  // .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * 에러 응답 생성
 */
function errorResponse(message) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "error",
      message: message,
    })
  );
  // .setMimeType(ContentService.MimeType.JSON)
  // .setHeader('Access-Control-Allow-Origin', '*');
}

/**
 * 견적 금액 업데이트 검증
 */
function validateEstimateUpdate(data) {
  if (!data.estimateNum) {
    return { valid: false, message: "견적번호가 필요합니다." };
  }
  if (!data.newAmount) {
    return { valid: false, message: "새 금액이 필요합니다." };
  }
  if (isNaN(Number(data.newAmount))) {
    return { valid: false, message: "금액은 숫자여야 합니다." };
  }
  return { valid: true };
}

/**
 * 상태 업데이트 검증
 */
function validateStatusUpdate(data) {
  if (!data.estimateNum) {
    return { valid: false, message: "견적번호가 필요합니다." };
  }
  if (!data.newStatus) {
    return { valid: false, message: "새 상태가 필요합니다." };
  }

  const validStatuses = ["접수 전", "접수진행중", "발송완료", "접수", "진행중", "완료", "보류", "취소"];
  if (!validStatuses.includes(data.newStatus)) {
    return {
      valid: false,
      message:
        "유효하지 않은 상태입니다. 가능한 상태: " + validStatuses.join(", "),
    };
  }

  return { valid: true };
}

/**
 * 담당자 업데이트 검증
 */
function validateManagerUpdate(data) {
  if (!data.estimateNum) {
    return { valid: false, message: "견적번호가 필요합니다." };
  }
  if (!data.newManager) {
    return { valid: false, message: "새 담당자가 필요합니다." };
  }
  return { valid: true };
}

// ✅ 신규 함수: 이메일 발송 및 상태 업데이트
function sendEmailToSalesManager(data) {
  if (!data) {
    data = {
      row: {
        estimateNum: 96,
        status: "접수",
        department: "",
        salesManager: "김희수",
        manager: "임민규",
        requestDate: "2025-11-12T02:02:50.049Z",
        replyDate: "",
        validUntil: "",
        company: "AJ 네트웍스",
        category: "",
        product: "테이프",
        spec: "W500*H600",
        salesInfo: "",
        견적요청비고: "",
        extraInfo: "",
        sampleRequired: "",
        printing: "안함",
        "색상,도수": "",
        moq: "",
        monthlyUsage: "약 20,000롤",
        monthlyAmount: 500000,
        region: "서울 송파구",
        requestNote: '납기 일정 회신 부탁드립니다."',
        purchasePrice: "",
        proposedSpec: "",
        supplier: "",
        orderStatus: "",
        rawText:
          ' "업체명: AJ 네트웍스\n지역: 서울 송파구\n1. 상품: 박스 / 규격: W450*H460*0.06MM / 사용량: 약 40,000장\n2. 상품: 테이프 / 규격: W500*H600 / 사용량: 약 20,000롤 / 사용금액: 500,000원 / 인쇄: 안함\n요청사항: 납기 일정 회신 부탁드립니다."',
        quoteAmount: 99999,
        mailStatus: "발송 전",
      },
    };
  }
  if (data?.row.requestDate) {
    const isoString = data.row.requestDate;
    const date = new Date(isoString);

    // 한국 시간 기준(UTC+9)으로 변환
    const formatted = date.toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // "2025. 09. 17. 13:55" 형태 → yyyy-mm-dd hh:mm 로 변경
    const result = formatted
      .replace(/\.\s/g, "-") // 점과 공백 → 하이픈으로
      .replace(/-\s/g, "-") // 남은 공백 제거
      .replace(/\.$/, "") // 마지막 점 제거
      .slice(0, 16)
      .replace(/\./g, "") // 혹시 남은 점 제거
      .replace(/\s/, " "); // 공백 1개 유지
    data.row.requestDate = result;
  }
  try {
    // ✅ 메일 내용 구성
    if (!data.row.salesManagerEmail) {
      return jsonResponse({
        status: "fail",
        message: `영업 담당자 정보가 없습니다.`,
      });
    }
    const subject = `신규 견적 요청 접수 확인 (#${data.row.estimateNum})`;
    const bodyText = "";

    const quoteAmountFormatted = data.row.quoteAmount
      ? data.row.quoteAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      : null;
    const htmlBody = `
     <html>
  <body
    style="font-family: 'Noto Sans KR', Pretendard, sans-serif; color: #333"
  >
    <p style="font-size: 12px; color: #777">
      본 메일은 시스템에서 자동 발송되었습니다.
    </p>
    <h2 style="color: #ef3340">신규 견적 요청 확인 안내</h2>
    <p>안녕하세요, <strong>${data.row.salesManager || ""}</strong>님.</p>
    <p>요청하신 ${data.row.estimateNum}번 견적 요청이 접수되었습니다.</p>

    <div
      style="margin-top: 12px; width: 100%; font-size: 14px; overflow: hidden"
    >
      <h3 style="font-weight: bold; margin: 0">견적 요청 본문</h3>
      <div style="margin-bottom: 12px; display: flex; flex-direction: column">
        <div
          style="white-space: pre-wrap; overflow: visible; text-overflow: unset"
        >
          ${data.row.rawText || ""}
        </div>
      </div>
      <div style="margin-bottom: 12px">
        <h3 style="font-weight: bold; margin: 0">견적 담당자</h3>
        <div style="">${data.row.manager || ""}</div>
      </div>

      <div style="margin-bottom: 12px">
        <h3 style="font-weight: bold; margin: 0">견적 요청일</h3>
        <div style="">${data.row.requestDate || ""}</div>
      </div>

      <div style="margin-bottom: 12px">
        <h3 style="font-weight: bold; margin: 0">견적담당자 비고</h3>
        <div style="">${data.row.quoteMemo || ""}</div>
      </div>

      <div style="">
        <h3 style="font-weight: bold; margin: 0">견적 금액</h3>
        <div style="">${quoteAmountFormatted + "원" || ""}</div>
      </div>
    </div>

    <p style="margin-top: 16px">기타 사항은 견적 담당자에게 문의해 주십시오.</p>
  </body>
</html>
`;

    Logger.log(`이메일 발송 준비 ${htmlBody}`);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("파싱결과"); // ⚠️ 시트명 확인 필요

    if (!sheet) {
      throw new Error("시트 '파싱결과'을 찾을 수 없습니다.");
    }

    const sheetData = sheet.getDataRange().getValues();
    const headers = sheetData[0];
    const estimateNumCol = headers.indexOf("견적번호");
    const mailSttsCol = headers.indexOf("메일 발송 상태");
    const statusCol = headers.indexOf("상태");
    // const amountCol = headers.indexOf("견적 금액");

    if (estimateNumCol === -1 || mailSttsCol === -1) {
      throw new Error(
        "'견적번호' 또는 '메일 발송 상태' 열을 찾을 수 없습니다."
      );
    }

    const recipient = data.row.salesManagerEmail || "kimhs@ajnet.co.kr";
    GmailApp.sendEmail(recipient, subject, bodyText, { htmlBody });
    // ✅ 행 탐색 및 상태 업데이트
    for (let i = 1; i < sheetData.length; i++) {
      const rowEstimate = String(sheetData[i][estimateNumCol]).trim();
      if (rowEstimate === String(data.row.estimateNum).trim()) {
        // 메일 발송 상태 업데이트
        sheet.getRange(i + 1, mailSttsCol + 1).setValue("발송 완료");
        
        // 상태를 "발송완료"로 업데이트
        if (statusCol !== -1) {
          sheet.getRange(i + 1, statusCol + 1).setValue("발송완료");
          Logger.log(
            `견적번호 ${data.row.estimateNum} 행(${
              i + 1
            })에 상태를 '발송완료'로 업데이트 완료`
          );
        }
        
        Logger.log(
          `견적번호 ${data.row.estimateNum} 행(${
            i + 1
          })에 메일 상태 업데이트 완료, ${recipient}`
        );
        return jsonResponse({
          status: "success",
          message: "메일 전송 및 상태 업데이트 완료",
          estimateNum: data.row.estimateNum,
          recipient: recipient,
        });
      }
    }
    Logger.log({
      status: "fail",
      message: `견적번호 ${data.row.estimateNum}에 해당하는 행을 찾을 수 없습니다.`,
    });
    return jsonResponse({
      status: "fail",
      message: `견적번호 ${data.row.estimateNum}에 해당하는 행을 찾을 수 없습니다.`,
    });
  } catch (error) {
    return errorResponse(`메일 발송 오류: ${error.message}`);
  }
}
// ============================================
// 테스트 함수들
// ============================================

/**
 * 전체 시스템 테스트
 */
function testAdminSystem() {
  console.log("=== 관리자 시스템 테스트 시작 ===");

  try {
    // 1. 전체 데이터 조회 테스트
    console.log("1. 전체 데이터 조회 테스트");
    const readResult = handleReadRequest();
    console.log("전체 데이터 조회 결과:", readResult.getContent());

    // 2. 필터링 조회 테스트
    console.log("2. 필터링 조회 테스트");
    const filterResult = handleReadFiltered({ status: "접수" });
    console.log("필터링 조회 결과:", filterResult.getContent());

    console.log("=== 관리자 시스템 테스트 완료 ===");
  } catch (error) {
    console.error("테스트 오류:", error);
  }
}
