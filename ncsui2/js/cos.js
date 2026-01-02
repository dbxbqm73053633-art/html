// 간단 셀렉터
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// 더미 코스 데이터
const courses = [
  {
    id: 1,
    name: "애월 해안 라이딩 코스",
    area: "애월 · 한담 해변",
    distance: 22,
    time: "1h 40m",
    elevation: 210,
    levelLabel: "중급 라이더",
    diff: "normal",    // easy | normal | hard
    tags: ["해안", "카페거리", "노을맛집"],
    type: "sea",
    completed: true
  },
  {
    id: 2,
    name: "구좌 · 세화 해안 코스",
    area: "구좌 · 세화 해변",
    distance: 28,
    time: "2h 10m",
    elevation: 260,
    levelLabel: "입문·중급",
    diff: "easy",
    tags: ["해안", "플랫", "감성카페"],
    type: "sea",
    completed: false
  },
  {
    id: 3,
    name: "1100고지 오름 업힐 코스",
    area: "한라산 1100고지",
    distance: 35,
    time: "2h 40m",
    elevation: 780,
    levelLabel: "상급 라이더",
    diff: "hard",
    tags: ["오름", "업힐", "체력강화"],
    type: "oreum",
    completed: false
  },
  {
    id: 4,
    name: "협재 · 한림 코스",
    area: "협재 · 한림 해변",
    distance: 18,
    time: "1h 15m",
    elevation: 130,
    levelLabel: "입문자",
    diff: "easy",
    tags: ["해안", "가족", "플랫"],
    type: "sea",
    completed: true
  },
  {
    id: 5,
    name: "표선 · 성산 올레 코스",
    area: "표선 · 성산일출봉",
    distance: 32,
    time: "2h 20m",
    elevation: 340,
    levelLabel: "중급 라이더",
    diff: "normal",
    tags: ["해안", "오름", "일출"],
    type: "sea",
    completed: false
  }
];

// DOM 요소
const listEl          = $("#courseList");
const countEl         = $("#listCount");
const completeCountEl = $("#completeCount");
const totalCountEl    = $("#totalCount");
const avgDistanceEl   = $("#avgDistance");
const avgTimeEl       = $("#avgTime");
const totalDistEl     = $("#totalDistance");

const searchInput = $("#courseSearch");
const filterChips = $$(".chip");

let currentFilter = "all";
let favorites = new Set();

// 난이도 라벨
function diffLabel(diff) {
  if (diff === "easy")   return "입문";
  if (diff === "normal") return "중급";
  if (diff === "hard")   return "상급";
  return "";
}

// 요약 정보 업데이트
function updateSummary() {
  const total = courses.length;
  const completed = courses.filter(c => c.completed).length;
  const sumDist = courses.reduce((sum, c) => sum + c.distance, 0);
  const avgDist = total ? Math.round((sumDist / total) * 10) / 10 : 0;

  totalCountEl.textContent    = total;
  completeCountEl.textContent = completed;
  totalDistEl.textContent     = `${sumDist}km`;
  avgDistanceEl.textContent   = `${avgDist}km`;
  avgTimeEl.textContent       = "2h 10m"; // 간단히 고정값, 나중에 계산 로직 넣어도 됨

  // 오늘의 추천은 첫 번째 코스
  const today = courses[0];
  $("#todayCourseName").textContent  = today.name;
  $("#todayCourseInfo").textContent  = `${today.distance}km · 약 ${today.time}`;
  $("#featuredName").textContent     = today.name;
  $("#featuredDesc").textContent     = "해안 카페와 바다를 동시에 즐길 수 있는 라이딩 루트입니다.";
  $("#featuredTag").textContent      = today.type === "sea" ? "해안 코스" : "오름 코스";
  $("#featuredDiff").textContent     = `난이도 · ${diffLabel(today.diff)}`;
  $("#featuredDistance").textContent = `${today.distance}km`;
  $("#featuredTime").textContent     = today.time;
  $("#featuredElevation").textContent= `${today.elevation}m`;
}

// 필터 결과 가져오기
function getFilteredCourses() {
  const keyword = (searchInput.value || "").trim().toLowerCase();

  return courses.filter((c) => {
    // 난이도/타입 필터
    if (currentFilter === "easy"   && c.diff !== "easy")   return false;
    if (currentFilter === "normal" && c.diff !== "normal") return false;
    if (currentFilter === "hard"   && c.diff !== "hard")   return false;
    if (currentFilter === "sea"    && c.type !== "sea")    return false;
    if (currentFilter === "oreum"  && c.type !== "oreum")  return false;

    // 검색어 필터
    if (keyword) {
      const haystack = [
        c.name,
        c.area,
        ...(c.tags || [])
      ].join(" ").toLowerCase();

      if (!haystack.includes(keyword)) return false;
    }

    return true;
  });
}

// 리스트 렌더링
function renderList() {
  const data = getFilteredCourses();
  listEl.innerHTML = "";
  countEl.textContent = data.length;

  if (data.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "조건에 맞는 코스가 없습니다.";
    listEl.appendChild(empty);
    return;
  }

  data.forEach((c) => {
    const card = document.createElement("article");
    card.className = "course-card";

    const main = document.createElement("div");
    main.className = "course-main";

    const name = document.createElement("div");
    name.className = "course-name";
    name.textContent = c.name;

    const area = document.createElement("div");
    area.className = "course-area";
    area.textContent = c.area;

    const tagsWrap = document.createElement("div");
    tagsWrap.className = "course-tags";

    const diffTag = document.createElement("span");
    diffTag.className = `tag diff-${c.diff}`;
    diffTag.textContent = `난이도 ${diffLabel(c.diff)}`;
    tagsWrap.appendChild(diffTag);

    (c.tags || []).forEach((t) => {
      const tagEl = document.createElement("span");
      tagEl.className = "tag";
      tagEl.textContent = t;
      tagsWrap.appendChild(tagEl);
    });

    const metaRow = document.createElement("div");
    metaRow.className = "course-meta-row";
    metaRow.innerHTML = `
      <span>📏 ${c.distance}km</span>
      <span>⏱ ${c.time}</span>
      <span>⛰ ${c.elevation}m</span>
    `;

    main.appendChild(name);
    main.appendChild(area);
    main.appendChild(tagsWrap);
    main.appendChild(metaRow);

    const side = document.createElement("div");
    side.className = "course-side";

    const level = document.createElement("div");
    level.className = "level-pill";
    level.textContent = c.levelLabel;

    const fav = document.createElement("button");
    fav.className = "favorite-btn";
    if (favorites.has(c.id)) fav.classList.add("on");
    fav.innerHTML = favorites.has(c.id) ? "★" : "☆";
    fav.addEventListener("click", (e) => {
      e.stopPropagation();
      if (favorites.has(c.id)) {
        favorites.delete(c.id);
      } else {
        favorites.add(c.id);
      }
      renderList();
    });

    const badge = document.createElement("div");
    badge.className = "badge-small";
    badge.textContent = c.completed ? "완주" : "예정";

    side.appendChild(level);
    side.appendChild(fav);
    side.appendChild(badge);

    card.appendChild(main);
    card.appendChild(side);

    // 카드 클릭 → 상세로 갈 자리 (지금은 안내만)
    card.addEventListener("click", () => {
      alert(`"${c.name}" 코스 상세 화면은 추후 연결 예정입니다.`);
    });

    listEl.appendChild(card);
  });
}

// 필터 버튼 클릭
filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    filterChips.forEach((c) => c.classList.remove("chip-active"));
    chip.classList.add("chip-active");
    currentFilter = chip.getAttribute("data-filter") || "all";
    renderList();
  });
});

// 검색 입력
searchInput.addEventListener("input", () => {
  renderList();
});

// 추천 코스 CTA
const featuredCard = $("#featuredCard");
const featuredBtn  = featuredCard.querySelector(".featured-cta");
featuredBtn.addEventListener("click", () => {
  alert("추천 코스 상세 화면은 추후 연결 예정입니다.");
});

// ───────── 탭바 내비게이션 (홈/커뮤니티 이동) ─────────
// main.html 과 community.html 파일명 기준으로 연결 
// 탭 버튼들 가져오기
const homeTab      = document.querySelector('[data-tab="home"]');
const communityTab = document.querySelector('[data-tab="community"]');
const courseTab    = document.querySelector('[data-tab="course"]');
const campingTab   = document.querySelector('[data-tab="camping"]');
const myTab        = document.querySelector('[data-tab="my"]');

// 홈 버튼 클릭 → main.html 로 이동
if (homeTab) {
  homeTab.addEventListener('click', () => {
    window.location.href = 'main.html';
  });
}

// 커뮤니티 버튼 클릭 → community.html 로 이동
if (communityTab) {
  communityTab.addEventListener('click', () => {
    window.location.href = 'community.html';
  });
}

// 코스 버튼 클릭 → course.html 로 이동
if (courseTab) {
  courseTab.addEventListener('click', () => {
    window.location.href = 'cos.html';
  });
}

// 캠핑 버튼 클릭 → camping.html 로 이동
if (campingTab) {
  campingTab.addEventListener('click', () => {
    window.location.href = 'camp.html';
  });
}

if (myTab) {
  myTab.addEventListener('click', () => {
    window.location.href = 'my.html';
  });
}


// 초기 실행
updateSummary();
renderList();
