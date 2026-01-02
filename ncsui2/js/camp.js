// 간단 셀렉터
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// 캠핑 더미 데이터
const camps = [
  {
    id: 1,
    name: "협재 비치 라이더 캠프",
    area: "협재 · 한림",
    type: "sea", // sea | forest | auto | glamping
    tags: ["해변", "샤워실", "전기", "조용한 밤"],
    bikeStorage: "실내 거치",
    hasShower: true,
    hasElectric: true,
    petFriendly: false,
    rating: 4.8,
    available: true,
    distanceFromRoute: "코스에서 1.2km",
  },
  {
    id: 2,
    name: "비자림 포레스트 캠프",
    area: "구좌 · 비자림",
    type: "forest",
    tags: ["숲속", "힐링", "조용한 사이트"],
    bikeStorage: "야외 거치대",
    hasShower: true,
    hasElectric: false,
    petFriendly: true,
    rating: 4.6,
    available: true,
    distanceFromRoute: "코스에서 3.5km",
  },
  {
    id: 3,
    name: "성산 오토캠핑 파크",
    area: "성산 · 오조리",
    type: "auto",
    tags: ["오토캠핑", "전기", "매점"],
    bikeStorage: "사이트 내 보관",
    hasShower: true,
    hasElectric: true,
    petFriendly: true,
    rating: 4.3,
    available: false,
    distanceFromRoute: "코스에서 0.8km",
  },
  {
    id: 4,
    name: "애월 글램핑 스테이",
    area: "애월 · 곽지",
    type: "glamping",
    tags: ["글램핑", "침대", "조식 제공"],
    bikeStorage: "리셉션 보관",
    hasShower: true,
    hasElectric: true,
    petFriendly: false,
    rating: 4.9,
    available: true,
    distanceFromRoute: "코스에서 2.1km",
  },
  {
    id: 5,
    name: "표선 라이더 팝업 캠프",
    area: "표선 · 남원",
    type: "sea",
    tags: ["해변", "라이더 할인", "샤워실"],
    bikeStorage: "실외 거치대",
    hasShower: true,
    hasElectric: false,
    petFriendly: false,
    rating: 4.1,
    available: true,
    distanceFromRoute: "코스에서 1.0km",
  },
];

const campListEl       = $("#campList");
const campListCountEl  = $("#campListCount");
const availableCountEl = $("#availableCount");
const avgRatingEl      = $("#avgRating");
const favCountEl       = $("#favCount");

const searchInput = $("#campSearch");
const filterChips = $$(".chip");

let currentFilter = "all";
let favorites = new Set();

// 요약 정보 업데이트
function updateSummary() {
  const total = camps.length;
  const available = camps.filter(c => c.available).length;
  const avgRating = total
    ? (camps.reduce((sum, c) => sum + c.rating, 0) / total).toFixed(1)
    : "0.0";

  availableCountEl.textContent = available;
  avgRatingEl.textContent = avgRating;
  favCountEl.textContent = `${favorites.size}곳`;

  // 추천 캠핑: 가장 평점 높은 곳
  const featured = [...camps].sort((a,b) => b.rating - a.rating)[0];
  if (!featured) return;

  $("#featuredName").textContent   = featured.name;
  $("#featuredArea").textContent   = featured.area;
  $("#featuredRating").textContent = featured.rating.toFixed(1);
  $("#featuredBike").textContent   = featured.bikeStorage;

  const typeLabel = {
    sea:      "해변 캠핑",
    forest:   "숲속 캠핑",
    auto:     "오토캠핑",
    glamping: "글램핑",
  }[featured.type] || "캠핑";

  $("#featuredType").textContent = typeLabel;
  $("#featuredTag").textContent  = featured.petFriendly ? "반려동물 동반" : "라이더 전용";
}

// 필터링
function getFilteredCamps() {
  const keyword = (searchInput.value || "").trim().toLowerCase();

  return camps.filter((c) => {
    if (currentFilter !== "all" && c.type !== currentFilter) return false;

    if (keyword) {
      const haystack = [
        c.name,
        c.area,
        c.bikeStorage,
        ...(c.tags || [])
      ].join(" ").toLowerCase();

      if (!haystack.includes(keyword)) return false;
    }

    return true;
  });
}

// 리스트 렌더링
function renderCampList() {
  const data = getFilteredCamps();
  campListEl.innerHTML = "";

  campListCountEl.textContent = data.length;

  if (data.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "조건에 맞는 캠핑 스팟이 없습니다.";
    campListEl.appendChild(empty);
    return;
  }

  data.forEach((c) => {
    const card = document.createElement("article");
    card.className = "camp-card";

    const thumb = document.createElement("div");
    thumb.className = "camp-thumb";
    thumb.innerHTML = `<span>${c.area}<br/>캠핑 스팟</span>`;

    const main = document.createElement("div");
    main.className = "camp-main";

    const name = document.createElement("div");
    name.className = "camp-name";
    name.textContent = c.name;

    const area = document.createElement("div");
    area.className = "camp-area";
    area.textContent = c.area;

    const tagsWrap = document.createElement("div");
    tagsWrap.className = "camp-tags";

    const typeTag = document.createElement("span");
    typeTag.className = `tag tag-type-${c.type}`;
    const typeLabel = {
      sea:      "해변",
      forest:   "숲속",
      auto:     "오토캠핑",
      glamping: "글램핑",
    }[c.type] || "캠핑";
    typeTag.textContent = typeLabel;
    tagsWrap.appendChild(typeTag);

    (c.tags || []).forEach((t) => {
      const tagEl = document.createElement("span");
      tagEl.className = "tag";
      tagEl.textContent = t;
      tagsWrap.appendChild(tagEl);
    });

    const metaRow = document.createElement("div");
    metaRow.className = "camp-meta-row";
    metaRow.innerHTML = `
      <span>🧼 ${c.hasShower ? "샤워실" : "샤워 미제공"}</span>
      <span>⚡ ${c.hasElectric ? "전기" : "무전기"}</span>
      <span>🚲 ${c.bikeStorage}</span>
    `;

    const distanceRow = document.createElement("div");
    distanceRow.className = "camp-meta-row";
    distanceRow.innerHTML = `<span>🗺 ${c.distanceFromRoute}</span>`;

    main.appendChild(name);
    main.appendChild(area);
    main.appendChild(tagsWrap);
    main.appendChild(metaRow);
    main.appendChild(distanceRow);

    const side = document.createElement("div");
    side.className = "camp-side";

    const rating = document.createElement("div");
    rating.className = "rating-pill";
    rating.textContent = `★ ${c.rating.toFixed(1)}`;

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
      updateSummary();
      renderCampList();
    });

    const badge = document.createElement("div");
    badge.className = "badge-small";
    badge.textContent = c.available ? "예약 가능" : "만실";

    side.appendChild(rating);
    side.appendChild(fav);
    side.appendChild(badge);

    card.appendChild(thumb);
    card.appendChild(main);
    card.appendChild(side);

    card.addEventListener("click", () => {
      alert(`"${c.name}" 캠핑장 상세 화면은 추후 연결 예정입니다.`);
    });

    campListEl.appendChild(card);
  });
}

// 필터 버튼
filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    filterChips.forEach((c) => c.classList.remove("chip-active"));
    chip.classList.add("chip-active");
    currentFilter = chip.getAttribute("data-filter") || "all";
    renderCampList();
  });
});

// 검색
searchInput.addEventListener("input", () => {
  renderCampList();
});

// 추천 캠핑 CTA
const featuredBtn = document.querySelector("#featuredCampCard .featured-cta");
if (featuredBtn) {
  featuredBtn.addEventListener("click", () => {
    alert("추천 캠핑 상세 화면은 추후 연결 예정입니다.");
  });
}

// 탭바 내비게이션
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

// 캠핑은 현재 페이지라 이동 없음
if (campingTab) {
  campingTab.addEventListener("click", () => {
    // 이미 캠핑 페이지
  });
}

if (myTab) {
  myTab.addEventListener("click", () => {
    alert("마이 페이지는 추후 추가 예정입니다.");
  });
}

// 초기 실행
updateSummary();
renderCampList();
