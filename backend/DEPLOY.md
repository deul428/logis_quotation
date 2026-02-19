# logis_quotation 배포 플로우

## 1. Google Apps Script (GAS) 프로젝트 구성

- **진입점**: `Code.js` (main.gs 역할) — `doGet`, `doPost` 라우팅
- **관리자 API**: `input_admin.js` — 파싱결과 시트 조회/수정
- **사용자/폼 처리(기본)**: `input_user.js` — 견적 문의(단일 텍스트) 파싱, 폼 응답 트리거, 파싱결과 시트 삽입
- **사용자/폼 처리(User02 멀티필드)**: `input_user02.js` — 멀티 입력(User02) 데이터 저장(파싱결과_멀티필드)
- **스프레드시트 ID**: `Code.js` 상단 `SPREADSHEET_ID` 한 곳에서만 정의

연결 스프레드시트 
---

## 2. GAS 배포 절차

1. 스프레드시트에서 **확장 프로그램 → Apps Script** 로 프로젝트 열기 (또는 script.google.com 에서 새 프로젝트 생성 후 같은 스프레드시트 ID 사용).
2. 다음 파일 내용을 그대로 복사해 붙여넣기:
   - `Code.js` → 메인 파일
   - `input_admin.js`
   - `input_user.js`
   - `input_user02.js` (User02 기능을 쓰는 경우 필수)
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
| 1-1 | (User02 사용 시) input_user02.js 반영 |
| 2 | SPREADSHEET_ID 가 사용 중인 스프레드시트와 일치하는지 확인 |
| 3 | 웹 앱으로 배포 후 URL 복사 |
| 4 | `setupFormResponseTrigger()` 한 번 실행해 트리거 등록 |
| 5 | 폼 응답 시트 이름이 FORM_RESPONSE_SHEET_NAMES 에 포함되는지 확인 |
| 6 | (선택) 프론트용 프록시에 GAS URL 반영 |

---

## 7. (중요) “안 쓰는 코드” 판단 크로스체크 절차

문서만 보고 “안 쓴다”고 결론 내리지 말고, 아래를 먼저 확인합니다.

### 7-1) 코드 라우팅/호출 경로 확인(저장소 기준)
- **GAS 라우팅**: `Code.js`에서 `mode === "user02"` 분기가 있으면, `input_user02.js`의 `user02PostEntry()`는 호출되면 실행됩니다.
- **프론트 라우팅**: `frontend/src/App.tsx`에 `/multi` 라우트가 있으면 User02 페이지 접근 경로가 존재합니다.
- **프론트 → API payload**: `frontend/src/User02.tsx`가 `mode: 'user02'`로 POST하면, 백엔드 `user02PostEntry()`가 실제로 호출됩니다.

### 7-2) “현재 배포에서 실제로 쓰는지” 확인(운영/배포물 기준)
- **GAS 편집기(배포된 프로젝트)**에서 파일 목록에 `input_user02`가 존재하는지 확인
- **배포 버전**이 최신인지 확인(Deploy → Manage deployments → Version)
- 프록시(`proxy.js`)를 쓰면 **targetKey/targetUrl**이 최신 웹앱 URL을 가리키는지 확인
- 가능하면 **실제 요청 1건**을 보내서(예: `/multi` 제출) 시트에 기록되는지/로그가 남는지로 검증

### 7-3) 제거 기준
- 7-1/7-2에서 호출 경로가 없고, 운영에서 사용하지 않는 것이 확인되면 제거(또는 별도 백업 브랜치/태그로 보존)합니다.
