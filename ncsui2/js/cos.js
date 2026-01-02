// 페이지 이동 (탭바용)
function goPage(path) {
  window.location.href = path;
}

// 제주 환상 자전거길 "내륙 육상" 5코스
// 절대 바닷가 근처로 가지 않고, 시내/농로/숲길 위주의 도로 좌표만 사용
const courses = [
  {
    id: "course1",
    name: "제주시 내륙 순환 코스",
    area: "제주시청 · 노형 · 연동",
    distance: 25,
    level: "easy",
    levelLabel: "초급",
    tags: ["도심 라이딩", "신호등 많은 구간", "카페·편의시설 풍부"],
    path: [
      { lat: 33.4885, lng: 126.5240 }, // 제주시청 인근 도로 (내륙)
      { lat: 33.4860, lng: 126.5125 }, // 연동 도심 도로
      { lat: 33.4830, lng: 126.5000 }, // 연동·노형 사이 도로
      { lat: 33.4855, lng: 126.4895 }, // 노형동 주거지역 도로
      { lat: 33.4910, lng: 126.4920 }, // 노형동 상권 도로
      { lat: 33.4935, lng: 126.5060 }, // 연동 내륙 도로
      { lat: 33.4885, lng: 126.5240 }  // 다시 제주시청 쪽으로
    ]
  },
  {
    id: "course2",
    name: "한라 수목원 · 노형 고지 코스",
    area: "한라수목원 · 노형 오르막",
    distance: 30,
    level: "mid",
    levelLabel: "중급",
    tags: ["완만한 업힐", "숲길 분위기", "도심 인접"],
    path: [
      { lat: 33.4690, lng: 126.5150 }, // 한라수목원 입구 도로
      { lat: 33.4745, lng: 126.5075 }, // 수목원 서쪽 내륙 도로
      { lat: 33.4800, lng: 126.5010 }, // 노형 고지 방향 도로
      { lat: 33.4860, lng: 126.4975 }, // 노형 고지 주거단지 도로
      { lat: 33.4905, lng: 126.5015 }, // 내륙 이면도로
      { lat: 33.4815, lng: 126.5080 }, // 다시 수목원 방향 도로
      { lat: 33.4690, lng: 126.5150 }  // 한라수목원 쪽으로 복귀
    ]
  },
  {
    id: "course3",
    name: "조천·아라 농로 링 코스",
    area: "조천 내륙 · 아라동 · 번영로 인근",
    distance: 34,
    level: "mid",
    levelLabel: "중급",
    tags: ["내륙 농로", "차량 적은 편", "바람 영향 적음"],
    path: [
      { lat: 33.4970, lng: 126.5850 }, // 아라동 내륙 도로
      { lat: 33.5070, lng: 126.5925 }, // 조천 방향 내륙 도로
      { lat: 33.5150, lng: 126.6060 }, // 조천 읍내 쪽 내륙 도로
      { lat: 33.5085, lng: 126.6150 }, // 번영로 인근 내륙 도로
      { lat: 33.4985, lng: 126.6110 }, // 아라동 농로
      { lat: 33.4920, lng: 126.6000 }, // 아라동 고지 농지 도로
      { lat: 33.4970, lng: 126.5850 }  // 시작점으로 복귀
    ]
  },
  {
    id: "course4",
    name: "서귀포 내륙 언덕 코스",
    area: "서귀포 시내 고지 · 중산간도로 인근",
    distance: 38,
    level: "mid",
    levelLabel: "중급",
    tags: ["언덕 반복", "도시·주거 혼합", "중간 휴식 포인트 많음"],
    path: [
      { lat: 33.2550, lng: 126.5580 }, // 서귀포 시내 내륙 도로
      { lat: 33.2625, lng: 126.5530 }, // 고지 주거지역 도로
      { lat: 33.2690, lng: 126.5455 }, // 서귀포 고지 순환로
      { lat: 33.2760, lng: 126.5380 }, // 중산간 방향 도로
      { lat: 33.2805, lng: 126.5495 }, // 중간 고지 내륙 도로
      { lat: 33.2700, lng: 126.5575 }, // 시내 쪽으로 내려오는 도로
      { lat: 33.2550, lng: 126.5580 }  // 시작점 복귀
    ]
  },
  {
    id: "course5",
    name: "한라 중산간 숲길 코스",
    area: "한라산 중산간 · 1100도로 인근 내륙",
    distance: 42,
    level: "hard",
    levelLabel: "상급",
    tags: ["장거리", "중·고도 업다운", "숲길 라이딩"],
    path: [
      { lat: 33.3610, lng: 126.5010 }, // 중산간 내륙 도로 시작점
      { lat: 33.3540, lng: 126.4850 }, // 1100도로 인근 내륙 구간
      { lat: 33.3460, lng: 126.4720 }, // 더 안쪽 중산간 도로
      { lat: 33.3380, lng: 126.4600 }, // 숲길 분위기의 내륙 도로
      { lat: 33.3450, lng: 126.4485 }, // 내륙 고지 도로
      { lat: 33.3550, lng: 126.4560 }, // 다시 1100도로 인근
      { lat: 33.3610, lng: 126.5010 }  // 시작점 복귀
    ]
  }
];

let map;
let currentPolyline = null;
let currentMarkers = [];

// 카카오맵 초기화
function initMap() {
  const container = document.getElementById("map");
  if (!container) return;

  // 제주도 중앙 근처
  const center = new kakao.maps.LatLng(33.38, 126.53);

  map = new kakao.maps.Map(container, {
    center,
    level: 9
  });

  // 첫 코스 기본 표시
  if (courses.length > 0) {
    showCourseOnMap(courses[0]);
    activateCourseCard(courses[0].id);
  }
}

// 선택 코스를 지도에 그리기 (육상 경로)
function showCourseOnMap(course) {
  if (!map || !course || !course.path || course.path.length === 0) return;

  // 이전 라인, 마커 제거
  if (currentPolyline) {
    currentPolyline.setMap(null);
    currentPolyline = null;
  }
  currentMarkers.forEach(m => m.setMap(null));
  currentMarkers = [];

  const pathLatLng = course.path.map(
    p => new kakao.maps.LatLng(p.lat, p.lng)
  );

  // 폴리라인 생성
  currentPolyline = new kakao.maps.Polyline({
    map,
    path: pathLatLng,
    strokeWeight: 6,
    strokeColor: "#2563eb",
    strokeOpacity: 0.9,
    strokeStyle: "solid"
  });

  // 시작 / 종료 마커
  const startMarker = new kakao.maps.Marker({
    map,
    position: pathLatLng[0],
    title: `${course.name} 시작`
  });

  const endMarker = new kakao.maps.Marker({
    map,
    position: pathLatLng[pathLatLng.length - 1],
    title: `${course.name} 종료`
  });

  currentMarkers.push(startMarker, endMarker);

  // 전체 경로가 화면에 들어오도록 bounds 맞추기
  const bounds = new kakao.maps.LatLngBounds();
  pathLatLng.forEach(ll => bounds.extend(ll));
  map.setBounds(bounds, 40, 40, 40, 40); // 여백

  // 선택 코스 정보 업데이트
  const nameEl = document.getElementById("selectedCourseName");
  const metaEl = document.getElementById("selectedCourseMeta");

  if (nameEl) nameEl.textContent = course.name;
  if (metaEl) {
    metaEl.textContent = `${course.area} · 약 ${course.distance}km · ${course.levelLabel} 코스 (내륙 육상 도로 기준)`;
  }
}

// 코스 리스트 렌더링
function renderCourseList(filter = "all") {
  const listEl = document.getElementById("courseList");
  if (!listEl) return;

  listEl.innerHTML = "";

  const filtered = courses.filter(c => {
    if (filter === "all") return true;
    return c.level === filter;
  });

  filtered.forEach(course => {
    const card = document.createElement("article");
    card.className = "course-card";
    card.dataset.courseId = course.id;

    card.innerHTML = `
      <div class="course-topline">
        <div>
          <div class="course-name">${course.name}</div>
          <div class="course-area">${course.area}</div>
        </div>
        <div class="course-arrow">➜</div>
      </div>
      <div class="course-tags">
        <span class="tag level-${course.level}">${course.levelLabel}</span>
        ${course.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
      </div>
      <div class="course-meta-row">
        <div class="course-meta">
          <span>거리 <strong>${course.distance}km</strong></span>
        </div>
        <div class="course-meta">
          <span>내륙 육상 경로 · 카카오맵 기준</span>
        </div>
      </div>
    `;

    card.addEventListener("click", () => {
      showCourseOnMap(course);
      activateCourseCard(course.id);
    });

    listEl.appendChild(card);
  });

  const countEl = document.getElementById("courseCount");
  if (countEl) countEl.textContent = courses.length;

  updateSummaryMetrics();
}

// 코스 카드 active 표시
function activateCourseCard(courseId) {
  const cards = document.querySelectorAll(".course-card");
  cards.forEach(card => {
    if (card.dataset.courseId === courseId) {
      card.classList.add("active");
    } else {
      card.classList.remove("active");
    }
  });
}

// 평균 거리 / 난이도 표시
function updateSummaryMetrics() {
  const avgDist =
    courses.reduce((sum, c) => sum + c.distance, 0) / courses.length;

  const levelScore = { easy: 1, mid: 2, hard: 3 };
  const scoreLabel = { 1: "초급 위주", 2: "중급 위주", 3: "상급 위주" };
  const avgScore =
    courses.reduce((sum, c) => sum + (levelScore[c.level] || 2), 0) /
    courses.length;

  const distEl = document.getElementById("avgDistance");
  const levelEl = document.getElementById("avgLevel");

  if (distEl) distEl.textContent = `${avgDist.toFixed(1)}km`;
  if (levelEl) levelEl.textContent = scoreLabel[Math.round(avgScore)] || "-";
}

// 필터 칩 이벤트
function setupFilterChips() {
  const chips = document.querySelectorAll(".chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("chip-active"));
      chip.classList.add("chip-active");

      const filter = chip.dataset.filter || "all";
      renderCourseList(filter);
    });
  });
}

// 초기화
window.addEventListener("load", () => {
  // 카카오맵 로드 확인
  if (window.kakao && kakao.maps) {
    initMap();
  } else {
    const interval = setInterval(() => {
      if (window.kakao && kakao.maps) {
        clearInterval(interval);
        initMap();
      }
    }, 200);
    setTimeout(() => clearInterval(interval), 5000);
  }

  renderCourseList("all");
  setupFilterChips();
});
