# logis_quotation 배포 플로우

## 1. Google Apps Script (GAS) 프로젝트 구성

- **진입점**: `Code.js` (main.gs 역할) — `doGet`, `doPost` 라우팅
- **관리자 API**: `input_admin.js` — 파싱결과 시트 조회/수정
- **사용자/폼 처리**: `input_user.js` — 견적 문의 파싱, 폼 응답 트리거, 파싱결과 시트 삽입
- **스프레드시트 ID**: `Code.js` 상단 `SPREADSHEET_ID` 한 곳에서만 정의

연결 스프레드시트:  
`https://docs.google.com/spreadsheets/d/1DWMrJob6_EDVWHBIMRx3Ee67sekKQQcu8gU8ir21mc8/edit`

---

## 2. GAS 배포 절차

1. 스프레드시트에서 **확장 프로그램 → Apps Script** 로 프로젝트 열기 (또는 script.google.com 에서 새 프로젝트 생성 후 같은 스프레드시트 ID 사용).
2. 다음 파일 내용을 그대로 복사해 붙여넣기:
   - `Code.js` → 메인 파일
   - `input_admin.js`
   - `input_user.js`
3. HTML 파일이 있다면 함께 업로드: `index_user.html`, `index_admin.html` 등.
4. **배포** → **새 배포** → 유형: **웹 앱**
   - 실행 사용자: **나**
   - 앱에 액세스: **모든 사용자** (또는 조직/내부용으로 설정)
5. 배포 후 **웹 앱 URL** 복사 (형식: `https://script.google.com/macros/s/.../exec`).

---

## 3. 폼 응답 자동 처리(트리거) 설정

1. GAS 편집기에서 `input_user.js`의 **`setupFormResponseTrigger`** 함수를 한 번 실행합니다.
2. 이 함수가:
   - 기존 트리거를 모두 삭제하고
   - **onEdit** 트리거: `onFormResponseEdit` (스프레드시트 편집 시)
   - **onFormSubmit** 트리거: `onFormSubmit` (구글 폼 제출 시)
   을 생성합니다.
3. 폼 응답이 들어오는 시트 이름이 아래와 **다르면** `input_user.js` 상단의 **`FORM_RESPONSE_SHEET_NAMES`** 배열에 해당 시트 이름을 추가해야 합니다.  
   기본 지원 이름: `설문지 응답`, `Form responses 1`, `Form responses 2`, `Form_responses`

---

## 4. 스프레드시트 시트 구성

- **파싱결과**: 파싱된 견적 데이터가 쌓이는 시트. 없으면 스크립트가 자동 생성.
- **폼 응답 시트**: 구글 폼과 연결된 시트(이름은 위 `FORM_RESPONSE_SHEET_NAMES` 중 하나와 일치해야 함).
- **처리상태** 열: 폼 응답 시트에서 **헤더 이름이 정확히 `처리상태`** 인 열에만 처리완료/처리오류가 기록됩니다. (열 인덱스로 고정하지 않음.)

---

## 5. 프론트엔드 → GAS 호출 (선택: 프록시)

- 프론트는 같은 도메인/다른 도메인에서 GAS 웹 앱 URL로 직접 호출할 수 있습니다.
- **CORS** 때문에 브라우저에서 직접 호출이 막히면, `proxy.js` 같은 **프록시**를 둡니다.
- `proxy.js`: Cloudflare Worker 등에 올려 두고, 프론트는 프록시 URL로 요청 → 프록시가 `targetUrl`(GAS 배포 URL)로 전달하는 구조입니다.
- 배포 URL이 바뀌면 프록시의 `targetKey` / `targetUrl` 을 새 GAS 웹 앱 URL로 수정합니다.

---

## 6. 요약 체크리스트

| 단계 | 내용 |
|------|------|
| 1 | GAS에 Code.js, input_admin.js, input_user.js 반영 |
| 2 | SPREADSHEET_ID 가 사용 중인 스프레드시트와 일치하는지 확인 |
| 3 | 웹 앱으로 배포 후 URL 복사 |
| 4 | `setupFormResponseTrigger()` 한 번 실행해 트리거 등록 |
| 5 | 폼 응답 시트 이름이 FORM_RESPONSE_SHEET_NAMES 에 포함되는지 확인 |
| 6 | (선택) 프론트용 프록시에 GAS URL 반영 |
