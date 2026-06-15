# LINKTOURS MES (제조실행시스템)

빌드 과정이 없는(No-build) 순수 정적 웹앱입니다. **Supabase**(PostgreSQL)를 백엔드로,
**Cloudflare Pages**(또는 Netlify)로 배포합니다. Node.js 설치나 번들링 없이 폴더째 배포하면 동작합니다.

## ✨ 특징
- **데모 모드 자동 동작**: Supabase 키가 없으면 브라우저 `localStorage`에 샘플 데이터로 즉시 사용 가능
- **2026 트렌드 UI**: 글래스모피즘 + 소프트 뉴모피즘, 라이트/다크 테마, 반응형
- **공통 CRUD 엔진**: 검색·필터·정렬·페이징·모달폼·CSV 내보내기·유효성검사 내장
- **6개 업무 모듈 / 23개 화면** 전체 구현

## 📁 메뉴 구조
| 모듈 | 화면 |
|------|------|
| 대시보드 | 종합 현황 |
| 작업 POP | 작업지시 목록 → 공정별 시작/종료(생산시점관리, 작업자 단말) |
| 기준정보관리 | 사용자·부서·거래처·품목·표준공정(공정별 사용설비 지정)·제품별표준공정(라우팅 편집)·공구·설비 |
| 영업관리 | 수주관리·납품관리 |
| 생산관리 | 생산계획·작업지시·생산실적·생산현황판(Kanban) |
| 자재관리 | 자재입고·자재반출·자재현황(실시간 재고) |
| 공구관리 | 재고관리·입출고관리·폐기관리 |
| 품질관리 | 검사기준(평가방법 정량/정성)·수입검사·부적합관리·출하검사(검사기준 기반 검사) |

## 🚀 로컬 실행
ES Module을 사용하므로 `file://`로 직접 열면 안 되고, 간단한 정적 서버가 필요합니다.

```bash
# Python 3 (설치되어 있다면)
python -m http.server 5500
# 또는 VS Code의 "Live Server" 확장 사용
```
브라우저에서 `http://localhost:5500` 접속.

## 🗄️ Supabase 연결 (실데이터 사용)
1. [supabase.com](https://supabase.com)에서 프로젝트 생성
2. **SQL Editor**에 `supabase/schema.sql` 전체를 붙여넣고 실행 (테이블·뷰·트리거·RLS 생성)
3. 이어서 `supabase/seed.sql`을 실행 → 기준정보 5건씩 + 영업·생산·자재·공구·품질 **예시 데이터** 입력 (다른 메뉴의 드롭다운에서 선택 가능해짐). 재실행해도 중복 입력되지 않습니다.
4. **Project Settings → API**에서 `Project URL`과 `anon public key` 복사
5. `js/config.js` 파일에 값 입력:
   ```js
   export const SUPABASE_URL = 'https://xxxx.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJhbGci...';
   ```
6. 저장 후 새로고침 → 상단에 "Supabase 연결됨" 표시되면 완료

### 생산 파이프라인 (수주 → 계획 → 작업지시 → POP)
업무가 단계별로 자동 연계됩니다.
1. **수주관리**에서 수주 등록 → **생산계획관리** 상단에 *"생산계획 대기 수주"* 로 표시
2. 해당 수주의 **[생산계획 생성]** 버튼 → 생산계획일·라인 지정 → 생산계획 생성
   (수주는 '생산중'으로 변경되어 대기 목록에서 사라짐)
3. 생성된 계획은 **작업지시관리** 상단에 *"작업지시 대기 계획"* 으로 표시 → **[작업지시 생성]**
   버튼으로 지시수량·완료예정일만 지정해 작업지시 생성(상태 '대기')
   - 작업자·생산라인·설비는 이 단계에서 입력하지 않습니다. (POP에서 공정별로 선택)
4. 작업지시 목록의 **[작업시작]** 버튼을 누르면 상태가 '작업중'으로 바뀌고 → **작업 POP**에 표시
5. POP에서 작업지시를 선택 → 공정별 **시작 시 작업자·설비호기를 선택**하고 종료로 실제 작업 수행

> POP에는 **'작업시작'을 누른 작업지시만** 나타납니다. ('대기' 상태는 표시되지 않음)

### 작업 POP (생산시점관리)
작업자 단말용 화면입니다.
1. **작업 POP** 메뉴 → 작업지시 카드 목록(상태별 필터). 상단에서 **작업자**를 먼저 선택합니다.
2. 작업지시 카드를 누르면 해당 품목의 **전체 공정(라우팅)** 이 자동 전개됩니다.
   (제품별표준공정에 라우팅이 없으면 작업지시의 단일 공정으로 생성)
3. 공정별 **시작 → 종료** 버튼으로 진행. (목록 화면에서 작업자를 미리 고르지 않습니다)
   - **시작** 시 해당 공정의 **작업자·설비호기**를 선택합니다.
     설비호기 후보는 **표준공정관리에서 그 공정에 지정한 설비**로 제한됩니다.
   - **종료** 시 양품·불량 수량을 입력하면:
   - 해당 공정 시작/종료 시각·작업시간 기록
   - **생산실적 자동 등록**, **작업지시 상태 자동 갱신**(대기→작업중→완료)

> POP는 추가 테이블이 필요합니다. 기존 프로젝트라면 아래 마이그레이션을 한 번 실행하세요.
> (신규로 `schema.sql` 을 실행했다면 모두 이미 포함되어 있습니다.)
> - `supabase/migration_pop.sql` — 공정 진행(시작/종료) 저장 `work_order_processes`
> - `supabase/migration_process_equipment.sql` — 공정별 사용설비 `process_equipments`
> - `supabase/migration_inspection.sql` — 검사기준 평가방법(`eval_method`) + 검사 항목별 결과 `inspection_details`
> - `supabase/migration_unique_constraints.sql` — 라우팅·공정설비 중복 방지(시드 재실행 대비, 선택)

### 검사기준 기반 품질검사
1. **검사기준관리**에서 품목별 검사항목을 등록합니다. 항목마다 **평가방법**을 선택:
   - **정량적**: 규격값 + 허용공차(숫자). 검사 시 측정값이 범위 내면 자동 합격
   - **정성적**: 판정기준(문자). 검사 시 양호/불량을 직접 판정
2. **수입검사 / 출하검사** 화면에서 **[신규 검사]** → 품목 선택 시 그 품목의 검사기준이
   자동 로드됩니다. 항목별 측정값·판정을 입력하면 **종합 판정(합격/불합격)이 자동 계산**되고,
   항목별 결과가 함께 저장됩니다. (행 클릭 시 항목별 결과 상세 확인)

### 자재입고 완료 처리
자재입고는 등록 시 **'입고예정'** 상태로 생성되며, 목록의 **[입고완료]** 버튼으로 입고를 확정합니다.

### 🧪 데모 모드 강제 전환
Supabase 키가 입력돼 있어도 UI만 빠르게 둘러보려면 주소 끝에 `?demo=1` 을 붙이세요
(`.../index.html?demo=1`). 브라우저 localStorage 샘플로 동작합니다. `?demo=0` 으로 해제합니다.

### 기준정보 연동 (드롭다운)
각 화면의 입력 폼은 기준정보를 **드롭다운으로 선택**합니다. 예: 수주 등록 시 거래처·품목을
선택하면 품명·규격·단가가 자동 입력되고, **수주 → 생산계획 → 작업지시**로 앞 단계 문서를
선택하면 품목·수량 정보가 자동으로 따라옵니다. 따라서 기준정보(품목·거래처·공정·설비·사용자
·공구)가 먼저 등록되어 있어야 다른 메뉴에서 선택할 수 있습니다.

> ⚠️ `schema.sql`의 RLS 정책은 개발 편의를 위해 **anon 전체 허용**입니다.
> 운영 배포 전 반드시 인증 기반 정책으로 강화하세요.

## ☁️ Cloudflare Pages 배포 (권장)
빌드 단계가 없으므로 설정이 매우 단순합니다. 포함된 `_redirects`, `_headers`가 자동 적용됩니다.
(빌드 없는 정적 사이트라 `wrangler.toml`은 두지 않습니다 — 있으면 Git 빌드의 deploy 단계에서 오류가 날 수 있습니다.)

**방법 A — 대시보드 직접 업로드 (가장 간단, Node 불필요)**
1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Upload assets**
2. 프로젝트 이름 입력 후 **이 폴더 전체를 드래그앤드롭**하여 업로드 → **Deploy**
3. `https://<프로젝트>.pages.dev` 주소로 접속

**방법 B — Git 연동 (자동 배포)**
1. GitHub/GitLab에 이 폴더를 push (`.gitignore` 포함됨)
2. Cloudflare Pages → **Connect to Git** → 저장소 선택
3. 빌드 설정:
   - **Framework preset**: `None`
   - **Build command**: *(비움)*
   - **Build output directory**: `/` (또는 `.`)
4. **Save and Deploy** → 이후 push할 때마다 자동 재배포

**방법 C — Wrangler CLI** (Node.js 설치 필요)
```bash
npx wrangler pages deploy . --project-name=<프로젝트명>
```

> 💡 `_headers`가 `js/`·`assets/`에 `Cache-Control: no-cache`를 적용하므로,
> 코드를 다시 배포하면 **하드 새로고침 없이도 최신 버전**이 반영됩니다.

> ⚠️ `js/config.js`의 Supabase 키는 **publishable(anon) 키**로 클라이언트 노출이 정상입니다.
> 다만 운영 시에는 `schema.sql`의 RLS 정책을 인증 기반으로 강화해야 합니다(아래 참고).

## ☁️ Netlify 배포 (대안)
**방법 A — 드래그앤드롭**: [app.netlify.com](https://app.netlify.com) → "Add new site" → "Deploy manually" → 이 폴더를 통째로 업로드

**방법 B — Git 연동**: GitHub에 push 후 Netlify에서 저장소 연결
- Build command: *(비움)*
- Publish directory: `.`
- `netlify.toml`이 이미 포함되어 있어 자동 적용됩니다.

## 🧩 구조
```
MES/
├─ index.html              # 진입점
├─ netlify.toml            # 배포 설정
├─ supabase/schema.sql     # DB 스키마 (테이블/뷰/트리거/RLS)
├─ assets/css/             # 디자인시스템·레이아웃·컴포넌트 CSS
└─ js/
   ├─ config.js            # Supabase 키 설정
   ├─ app.js               # 앱 부트스트랩·라우터·레이아웃
   ├─ routes.js            # 메뉴 트리 + 라우트 매핑
   ├─ lib/
   │  ├─ db.js             # 데이터 계층 (Supabase ↔ 데모 어댑터)
   │  ├─ crud.js           # 공통 CRUD 페이지 팩토리
   │  ├─ seed.js           # 데모 샘플 데이터
   │  └─ format.js         # 포맷·CSV·채번 유틸
   ├─ ui/                  # 아이콘·공통 컴포넌트(toast/modal/badge)
   └─ pages/               # 모듈별 화면 정의
```

## 🛠️ 새 화면 추가 방법
대부분의 관리 화면은 `createCrudPage({...})` 설정만으로 생성됩니다.
`js/pages/`에 config를 추가하고 `js/routes.js`의 `MENU`·`ROUTES`에 등록하면 끝입니다.
