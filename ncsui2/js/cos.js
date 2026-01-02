// 페이지 이동 (탭바용)
function goPage(path) {
  window.location.href = path;
}

// 제주 환상 자전거길 육상 5코스
// 좌표는 해안도로/도시 도로를 따라 잡아둔 예시
const courses = [
  {
    id: "course1",
    name: "제주시 해안 순환 코스",
    area: "제주시 · 용담 · 탑동",
    distance: 32,
    level: "easy",
    levelLabel: "초급",
    tags: ["도심 해안도로", "카페 스팟", "야간 라이딩"],
    path: [
      { lat: 33.5153, lng: 126.5277 }, // 탑동광장 인근 도로
      { lat: 33.5140, lng: 126.5215 }, // 탑동 해안도로
      { lat: 33.5099, lng: 126.5160 }, // 용담 해안도로
      { lat: 33.5035, lng: 126.5093 }, // 용담 도로
      { lat: 33.4962, lng: 126.4934 }, // 도두봉 입구 도로
      { lat: 33.5035, lng: 126.5093 },
      { lat: 33.5099, lng: 126.5160 },
      { lat: 33.5153, lng: 126.5277 }
    ]
  },
  {
    id: "course2",
    name: "애월 해안 카페 코스",
    area: "애월 · 곽지 · 한담",
    distance: 28,
    level: "easy",
    levelLabel: "초급",
    tags: ["해안카페", "완만한 코스", "노을뷰"],
    path: [
      { lat: 33.4610, lng: 126.3183 }, // 한담해변 도로
      { lat: 33.4595, lng: 126.3135 }, // 애월 해안도로
      { lat: 33.4564, lng: 126.3045 }, // 곽지해수욕장 진입도로
      { lat: 33.4520, lng: 126.2990 }, // 애월항 인근 도로
      { lat: 33.4564, lng: 126.3045 },
      { lat: 33.4595, lng: 126.3135 },
      { lat: 33.4610, lng: 126.3183 }
    ]
  },
  {
    id: "course3",
    name: "협재 · 한림 비치 라인",
    area: "협재 · 한림 · 비양도 뷰",
    distance: 24,
    level: "mid",
    levelLabel: "중급",
    tags: ["화이트 비치", "해안도로", "바람 주의"],
    path: [
      { lat: 33.3946, lng: 126.2395 }, // 협재 해변 도로
      { lat: 33.3983, lng: 126.2425 }, // 협재 해안도로
      { lat: 33.4100, lng: 126.2541 }, // 한림항 도로
      { lat: 33.4145, lng: 126.2595 }, // 한림공원 진입로
      { lat: 33.4100, lng: 126.2541 },
      { lat: 33.3983, lng: 126.2425 },
      { lat: 33.3946, lng: 126.2395 }
    ]
  },
  {
    id: "course4",
    name: "서귀포 해안 & 올레 코스",
    area: "서귀포시 · 법환 · 외돌개",
    distance: 36,
    level: "mid",
    levelLabel: "중급",
    tags: ["서귀포 시내", "올레길 연계", "업다운 적당"],
    path: [
      { lat: 33.2453, lng: 126.5669 }, // 서귀포항 도로
      { lat: 33.2430, lng: 126.5620 }, // 새섬 입구 도로
      { lat: 33.2364, lng: 126.5570 }, // 정방폭포 인근 도로
      { lat: 33.2338, lng: 126.5400 }, // 외돌개 해안도로
      { lat: 33.2386, lng: 126.5295 }, // 법환동 해안도로
      { lat: 33.2453, lng: 126.5669 }
    ]
  },
  {
    id: "course5",
    name: "성산 일출봉 · 표선 해안 코스",
    area: "성산 · 표선 · 남동 해안",
    distance: 40,
    level: "hard",
    levelLabel: "상급",
    tags: ["일출 뷰", "중장거리", "해안·국도 믹스"],
    path: [
      { lat: 33.4589, lng: 126.9394 }, // 성산일출봉 입구 도로
      { lat: 33.4480, lng: 126.9175 }, // 성산 해안도로
      { lat: 33.4095, lng: 126.8920 }, // 남원–표선 해안도로
      { lat: 33.3830, lng: 126.8803 }, // 표선해수욕장 진입도로
      { lat: 33.3600, lng: 126.8500 }, // 남동 해안 국도
      { lat: 33.3830, lng: 126.8803 },
      { lat: 33.4095, lng: 126.8920 },
      { lat: 33.4589, lng: 126.9394 }
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
    metaEl.textContent = `${course.area} · 약 ${course.distance}km · ${course.levelLabel} 코스 (육상 도로 기준)`;
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
          <span>카카오맵 경로 보기</span>
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
