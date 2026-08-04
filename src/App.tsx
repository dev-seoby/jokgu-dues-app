import { Top } from "@toss/tds-mobile";
import { useMemo, useState } from "react";
import "./App.css";

/**
 * 월별 리포트 화면
 *
 * 데이터는 Supabase 연동 전까지 목업으로 채워둠.
 * 실제 연동 시 이 파일의 MOCK_* 상수들을 fetch 결과로 교체하면 됨.
 *
 * 프론트리드 검토에서 반영한 사항:
 * - 브랜드 강조색은 sky 계열로 고정, red는 미납/지출(음수) 전용 semantic 컬러로만 사용
 * - 월별 순증감 막대그래프에 0 기준선을 명시하고, 음수는 기준선 왼쪽으로 렌더링
 * - 미납 회원 목록은 스크롤 영역(max-height)으로 제한
 * - "총 입금/총 출금"이 연간 누적 기준임을 라벨에 명시
 */

type MonthlyNet = {
  month: number;
  amount: number; // 음수 가능
};

type CategorySpend = {
  category: string;
  amount: number;
  ratio: number; // 0~1, 최대 지출 카테고리 대비 비율 (막대 길이용)
};

const MOCK_MONTHS: MonthlyNet[] = [
  { month: 3, amount: 100000 },
  { month: 4, amount: 130000 },
  { month: 5, amount: -10000 },
  { month: 6, amount: -70000 },
  { month: 7, amount: 50000 },
];

const MOCK_UNPAID_MEMBERS: string[] = [
  "김민수", "이서연", "박지훈", "최유진", "강태양", "조현우", "윤소희", "임재현",
  "오세훈", "배수빈", "신우진", "황지원", "김지우", "이나연", "박현서", "최가영",
  "강채원", "조승호", "윤민재", "임야름", "오은비", "배태호", "신민준", "황재원",
  "김도윤", "이서준", "박하람", "최예린",
];

const MOCK_CATEGORY_SPEND: CategorySpend[] = [
  { category: "구장비", amount: 90000, ratio: 1 },
  { category: "유니폼 추가비", amount: 65000, ratio: 0.72 },
];

const TOTAL_INCOME = 1180000; // 연간 누적
const TOTAL_EXPENSE = 980000; // 연간 누적
const BALANCE = TOTAL_INCOME - TOTAL_EXPENSE;

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

function App() {
  const [selectedMonth, setSelectedMonth] = useState(7);
  const [showAllUnpaid, setShowAllUnpaid] = useState(false);

  const maxAbsNet = useMemo(
    () => Math.max(...MOCK_MONTHS.map((m) => Math.abs(m.amount))),
    [],
  );

  const visibleUnpaid = showAllUnpaid
    ? MOCK_UNPAID_MEMBERS
    : MOCK_UNPAID_MEMBERS.slice(0, 12);

  return (
    <>
      <Top
        title={<Top.TitleParagraph size={22}>월별 리포트</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            조기축구팀 회비 · {selectedMonth}월 기준
          </Top.SubtitleParagraph>
        }
      />

      <div className="report-page">
        {/* 요약 카드 */}
        <section className="summary-cards">
          <div className="summary-card">
            <span className="summary-label">총 입금 (누적)</span>
            <strong className="summary-value income">{won(TOTAL_INCOME)}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">총 출금 (누적)</span>
            <strong className="summary-value expense">{won(TOTAL_EXPENSE)}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">잔액</span>
            <strong className="summary-value">{won(BALANCE)}</strong>
          </div>
        </section>

        {/* 월별 순증감 */}
        <section className="section">
          <h2 className="section-title">월별 순증감</h2>
          <div className="net-chart">
            {MOCK_MONTHS.map(({ month, amount }) => {
              const isNegative = amount < 0;
              const widthPct = maxAbsNet === 0 ? 0 : (Math.abs(amount) / maxAbsNet) * 100;
              return (
                <div className="net-row" key={month}>
                  <span className="net-month">{month}월</span>
                  <div className="net-track">
                    {/* 0 기준선: 트랙 중앙에 고정 */}
                    <div className="net-baseline" />
                    <div
                      className={`net-bar ${isNegative ? "negative" : "positive"}`}
                      style={{
                        width: `${widthPct / 2}%`,
                        // 기준선(50%)에서 좌우로 뻗어나가도록 배치
                        left: isNegative ? `${50 - widthPct / 2}%` : "50%",
                      }}
                    />
                  </div>
                  <span className={`net-amount ${isNegative ? "negative" : "positive"}`}>
                    {isNegative ? "-" : "+"}
                    {won(Math.abs(amount))}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 월 탭 (가로 스크롤 힌트 포함) */}
        <section className="section month-tabs-wrap">
          <div className="month-tabs" role="tablist" aria-label="월 선택">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <button
                key={month}
                role="tab"
                aria-selected={month === selectedMonth}
                className={`month-tab ${month === selectedMonth ? "active" : ""}`}
                onClick={() => setSelectedMonth(month)}
              >
                {month}월
              </button>
            ))}
          </div>
          {/* 스크롤 가능함을 알려주는 좌우 페이드 */}
          <div className="scroll-fade left" aria-hidden="true" />
          <div className="scroll-fade right" aria-hidden="true" />
        </section>

        {/* 미납 회원 */}
        <section className="section">
          <div className="section-header-row">
            <h2 className="section-title">{selectedMonth}월 미납 회원</h2>
            <span className="unpaid-count">{MOCK_UNPAID_MEMBERS.length}명</span>
          </div>
          <div className="unpaid-list">
            {visibleUnpaid.map((name) => (
              <span className="unpaid-pill" key={name}>
                {name}
              </span>
            ))}
          </div>
          {MOCK_UNPAID_MEMBERS.length > 12 && (
            <button
              className="show-more-btn"
              onClick={() => setShowAllUnpaid((v) => !v)}
            >
              {showAllUnpaid ? "접기" : `${MOCK_UNPAID_MEMBERS.length - 12}명 더보기`}
            </button>
          )}
        </section>

        {/* 카테고리별 지출 */}
        <section className="section">
          <h2 className="section-title">{selectedMonth}월 카테고리별 지출</h2>
          <div className="category-list">
            {MOCK_CATEGORY_SPEND.map(({ category, amount, ratio }) => (
              <div className="category-row" key={category}>
                <div className="category-row-top">
                  <span>{category}</span>
                  <span className="category-amount">{won(amount)}</span>
                </div>
                <div className="category-track">
                  <div
                    className="category-bar"
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default App;
