# 조기축구팀 회비관리 앱 (jokgu-dues-app)

앱인토스(Apps in Toss) 미니앱 토이프로젝트. 총무 1인 관리형으로, 엑셀로 하던 월별 회비 체크·지출/입금 기록·정산을 앱으로 옮기는 실험.

## 문서
- 기획안 (Notion): 화면 구성, 데이터 모델, 기술 스택, 검토 이슈 및 반영 사항
- 디자인 프로토타입 (Claude Design): 홈 / 거래 / 회원관리 / 리포트 4개 화면

## 사용 범위
- 총무만 로그인해서 사용 (팀원 공유 없음)
- 회비 납부는 수동 체크, 실제 송금은 계좌이체
- 거래 내역에 영수증 이미지 첨부 지원 (파일 선택 미리보기까지, 업로드 저장은 Supabase 연동 후)

## 화면 구성
- 홈 (`src/screens/Home.tsx`): 모임 잔액, 이번달 입출금, 입금/출금 빠른 추가, 최근 내역, 미납 현황 요약
- 거래 (`src/screens/Transactions.tsx`): 입출금 내역 필터·리스트, 플로팅 버튼으로 거래 추가
- 회원관리 (`src/screens/Members.tsx`): 월별 납부 그리드, 검색, 회원 추가, 전체 납부완료/초기화(확인 다이얼로그 포함), 휴식 전환
- 리포트 (`src/screens/Report.tsx`): 누적 입출금 요약, 월별 순증감(0 기준선), 월별 미납 회원, 카테고리별 지출

4개 화면은 하단 탭(`src/components/BottomNav.tsx`)으로 전환하며, 상태는 `src/App.tsx`에서 관리해 화면 간 데이터가 함께 갱신됨 (거래 추가 → 홈/리포트에 즉시 반영 등).

## 데이터 모델 (요약)
- Member: 이름, 상태(active/resting), payment_type(monthly/annual_lump), 월별 납부 현황
- Transaction: 유형(입금/지출), 날짜, 금액, 항목, 메모, 영수증 이미지

목업 데이터는 `src/data/mock.ts`에 있음. Supabase 연동 시 이 파일의 export를 쿼리 훅으로 교체.

## 기술 스택
- 프론트: 앱인토스 WebView SDK (`create-ait-app react-ts` + TDS) + React + TypeScript + Vite
- 백엔드: Supabase (Postgres + Storage) — 아직 미연동
- 인증: 토스 로그인 SDK (총무 1인) — 아직 미연동

## 로컬 실행
\`\`\`bash
npm install
npm run dev
\`\`\`

## 상태
- [x] 기획 및 프로토타입 검토
- [x] 4개 화면 코드 빌드 (목업 데이터, 화면 간 상태 연동)
- [ ] Supabase 연동 (실 데이터, 영수증 이미지 저장)
- [ ] 토스 로그인 연동
- [ ] 앱인토스 콘솔 등록 및 검수
