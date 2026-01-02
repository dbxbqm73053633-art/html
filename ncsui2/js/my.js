// 간단 셀렉터
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// 더미 프로필/통계 데이터 (나중에 실제 값으로 교체 가능)
const myData = {
  name: "워런 라이더",
  level: 7,
  yearGoalKm: 1200,
  totalDistanceKm: 486,
  totalRides: 32,
  completedCourses: 8,
  completedThisMonth: 3,
  campingNights: 5,
  favoriteCampingArea: "애월 · 협재",
  weeklyTargetKm: 120,
  weeklyDoneKm: 72,
  favoriteRideArea: "애월 · 한림 해안",
  favoriteRideAreaDetail: "바닷길 위주 라이딩 14회",
  recentCourse: "애월 해안 라이딩 코스",
  recentCourseDetail: "지난주 42km, 1시간 55분",
  favoriteCampType: "해변 캠핑",
  favoriteCampTypeDetail: "해변 캠핑 4박 / 숲속 1박",
  favoriteCourses: ["애월 해안 라이딩", "표선·성산 코스", "협재·한림 코스"],
  favoriteCamps: ["협재 비치 라이더 캠프", "애월 글램핑 스테이"],
};

// 통계/텍스트 렌더링
function renderStats() {
  $("#statTotalDistance").textContent   = `${myData.totalDistanceKm}km`;
  $("#statTotalRides").textContent      = `${myData.totalRides}회 라이딩`;
  $("#statCompletedCourses").textContent= `${myData.completedCourses}코스`;
  $("#statThisMonth").textContent       = `이번 달 ${myData.completedThisMonth}코스`;
  $("#statCampingNights").textContent   = `${myData.campingNights}박`;
  $("#statFavoriteArea").textContent    = `즐겨 찾는 지역 ${myData.favoriteCampingArea}`;
}

// 주간 목표 / 진행도
function renderWeeklyGoal() {
  const target = myData.weeklyTargetKm;
  const done   = myData.weeklyDoneKm;
  const ratio  = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;

  $("#weeklyTargetLabel").textContent    = `주간 ${target}km`;
  $("#weeklyDistanceText").textContent   = `${done} / ${target}km`;
  $("#weeklyProgressLabel").textContent  = `${ratio}% 달성`;
  $("#weeklyProgressBar").style.width    = `${ratio}%`;
}

// 요약 카드
function renderSummaryCards() {
  $("#favRideArea").textContent       = myData.favoriteRideArea;
  $("#favRideAreaDetail").textContent = myData.favoriteRideAreaDetail;

  $("#recentCourse").textContent       = myData.recentCourse;
  $("#recentCourseDetail").textContent = myData.recentCourseDetail;

  $("#favCampType").textContent       = myData.favoriteCampType;
  $("#favCampTypeDetail").textContent = myData.favoriteCampTypeDetail;
}

// 즐겨찾기 요약
function renderFavorites() {
  const wrap = $("#favoritePills");
  wrap.innerHTML = "";

  const courseCount = myData.favoriteCourses.length;
  const campCount   = myData.favoriteCamps.length;
  const totalCount  = courseCount + campCount;

  $("#favoriteSummaryLabel").textContent = `${totalCount}개 저장됨`;

  myData.favoriteCourses.forEach((name) => {
    const pill = document.createElement("span");
    pill.className = "fav-pill course";
    pill.textContent = `코스 · ${name}`;
    wrap.appendChild(pill);
  });

  myData.favoriteCamps.forEach((name) => {
    const pill = document.createElement("span");
    pill.className = "fav-pill camp";
    pill.textContent = `캠핑 · ${name}`;
    wrap.appendChild(pill);
  });
}

// 코스/캠핑 즐겨찾기 바로가기 버튼
const goCourseFromMy  = $("#goCourseFromMy");
const goCampingFromMy = $("#goCampingFromMy");

if (goCourseFromMy) {
  goCourseFromMy.addEventListener("click", () => {
    window.location.href = "course.html";
  });
}

if (goCampingFromMy) {
  goCampingFromMy.addEventListener("click", () => {
    window.location.href = "camping.html";
  });
}

// 탭바 내비게이션 (전 페이지 공통 패턴)
const homeTab      = document.querySelector('[data-tab="home"]');
const communityTab = document.querySelector('[data-tab="community"]');
const courseTab    = document.querySelector('[data-tab="course"]');
const campingTab   = document.querySelector('[data-tab="camping"]');
const myTab        = document.querySelector('[data-tab="my"]');

if (homeTab) {
  homeTab.addEventListener("click", () => {
    window.location.href = "main.html";
  });
}

if (communityTab) {
  communityTab.addEventListener("click", () => {
    window.location.href = "community.html";
  });
}

if (courseTab) {
  courseTab.addEventListener("click", () => {
    window.location.href = "cos.html";
  });
}

if (campingTab) {
  campingTab.addEventListener("click", () => {
    window.location.href = "camp.html";
  });
}

// 마이는 현재 페이지
if (myTab) {
  myTab.addEventListener("click", () => {
    // 이미 my.html, 나중에 상단까지 스크롤 같은 연출 넣고 싶으면 여기서 처리
  });
}

// 초기 렌더링
renderStats();
renderWeeklyGoal();
renderSummaryCards();
renderFavorites();
