// 페이지 이동 (탭바용)
function goPage(path) {
  // 실제 파일 구조에 맞게 수정해서 사용
  window.location.href = path;
}

// 제주 환상 자전거길 5개 코스 (샘플 좌표)
// 실제 길과 100% 일치하지 않아도, 카카오맵에서 대략적인 동선 확인용으로 사용 가능
const courses = [
  {
    id: "course1",
    name: "제주시 해안 순환 코스",
    area: "제주시 · 용담 · 탑동",
    distance: 32,
    level: "easy",
    levelLabel: "초급",
    tags: ["도심 해안", "카페 스팟", "야간 라이딩"],
    // 간단 지도용 path (대략 좌표)
    path: [
      { lat: 33.5130, lng: 126.5263 }, // 탑동광장
      { lat: 33.5097, lng: 126.5194 }, // 용담 해안
      { lat: 33.5062, lng: 126.5140 }, // 용담해안도로
      { lat: 33.4999, lng: 126.5070 }, // 이호테우
      { lat: 33.4942, lng: 126.4913 }, // 도두봉 인근
      { lat: 33.5130, lng: 126.5263 }  // 다시 탑동
    ]
  },
  {
    id: "course2",
    name: "애월 해안 카페 코스",
    area: "애월 · 곽지 · 한담",
    distance: 28,
    level: "easy",
    levelLabel: "초급",
    tags: ["해안 절경", "카페 거리", "완만한 코스"],
    path: [
      { lat: 33.4563, lng: 126.3096 }, // 애월항
      { lat: 33.4566, lng: 126.3131 }, // 곽지해수욕장
      { lat: 33.4590, lng: 126.3188 }, // 한담해변 산책로
      { lat: 33.4622, lng: 126.3230 }, // 해안 도로
      { lat: 33.4707, lng: 126.3401 }  // 해안 북쪽 방향
    ]
  },
  {
    id: "course3",
    name: "협재 · 한림 비치 라인",
    area: "협재 · 한림 · 비양도 뷰",
    distance: 24,
    level: "mid",
    levelLabel: "중급",
    tags: ["화이트 비치", "비양도 전망", "바람 많은 구간"],
    path: [
      { lat: 33.3940, lng: 126.2392 }, // 협재해수욕장
      { lat: 33.3974, lng: 126.2412 }, // 인근 해안도로
      { lat: 33.4120, lng: 126.2520 }, // 한림항 방향
      { lat: 33.4137, lng: 126.2615 }, // 한림공원 인근
      { lat: 33.3940, lng: 126.2392 }  // 협재로 회귀
    ]
  },
  {
    id: "course4",
    name: "서귀포 해안 & 올레 코스",
    area: "서귀포시 · 법환 · 외돌개",
    distance: 36,
    level: "mid",
    levelLabel: "중급",
    tags: ["서귀포 시내", "올레길 연계", "완만+업다운"],
    path: [
      { lat: 33.2462, lng: 126.5627 }, // 서귀포항
      { lat: 33.2392, lng: 126.5581 }, // 새섬 인근
      { lat: 33.2360, lng: 126.5305 }, // 외돌개
      { lat: 33.2388, lng: 126.5191 }, // 법환동
      { lat: 33.2462, lng: 126.5627 }  // 다시 서귀포항
    ]
  },
  {
    id: "course5",
    name: "성산 일출봉 · 표선 해안 코스",
    area: "성산 · 표선 · 남동 해안",
    distance: 40,
    level: "hard",
    levelLabel: "상급",
    tags: ["일출 뷰", "중장거리", "바람·업다운"],
    path: [
      { lat: 33.4590, lng: 126.9393 }, // 성산일출봉 입구
      { lat: 33.3826, lng: 126.8806 }, // 표선해수욕장 방향
      { lat: 33.3335, lng: 126.8394 }, // 남동 해안
      { lat: 33.3826, lng: 126.8806 }, // 표선
      { lat: 33.4590, lng: 126.9393 }  // 성산으로 회귀
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

  // 기본 중심 (제주시 근처)
  map = new kakao.maps.Map(container, {
    center: new kakao.maps.LatLng(33.4996, 126.5312),
    level: 10
  });

  // 첫 코스 표시
  if (courses.length > 0) {
    showCourseOnMap(courses[0]);
    activateCourseCard(courses[0].id);
  }
}

// 지도에 코스 그리기
function showCourseOnMap(course) {
  if (!map || !course || !course.path || course.path.length === 0) return;

  // 이전 라인, 마커 제거
  if (currentPolyline) {
    currentPolyline.setMap(null);
    currentPolyline = null;
  }
  currentMarkers.forEach(m => m.setMap(null));
  currentMarkers = [];

  // path → kakao LatLng 객체 배열
  const path = course.path.map(p => new kakao.maps.LatLng(p.lat, p.lng));

  // 폴리라인 생성
  currentPolyline = new kakao.maps.Polyline({
    path,
    strokeWeight: 6,
    strokeColor: "#1D4ED8",
    strokeOpacity: 0.9,
    strokeStyle: "solid"
  });
  currentPolyline.setMap(map);

  // 시작 / 끝 마커
  if (path.length > 0) {
    const startMarker = new kakao.maps.Marker({
      position: path[0],
      title: `${course.name} 시작`
    });
    const endMarker = new kakao.maps.Marker({
      position: path[path.length - 1],
      title: `${course.name} 종료`
    });
    startMarker.setMap(map);
    endMarker.setMap(map);
    currentMarkers.push(startMarker, endMarker);
  }

  // bounds 맞추기
  const bounds = new kakao.maps.LatLngBounds();
  path.forEach(p => bounds.extend(p));
  map.setBounds(bounds, 40, 40, 40, 40); // 상/우/하/좌 padding

  // 하단 텍스트 업데이트
  const nameEl = document.getElementById("selectedCourseName");
  const metaEl = document.getElementById("selectedCourseMeta");

  if (nameEl) nameEl.textContent = course.name;
  if (metaEl) {
    metaEl.textContent = `${course.area} · 약 ${course.distance}km · ${course.levelLabel} 코스`;
  }
}

// 코스 카드 렌더링
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
        ${course.tags
          .map(tag => `<span class="tag">${tag}</span>`)
          .join("")}
      </div>
      <div class="course-meta-row">
        <div class="course-meta">
          <span>거리 <strong>${course.distance}km</strong></span>
        </div>
        <div class="course-meta">
          <span>지도 보기</span>
        </div>
      </div>
    `;

    card.addEventListener("click", () => {
      showCourseOnMap(course);
      activateCourseCard(course.id);
    });

    listEl.appendChild(card);
  });

  // 전체 코스 수 표기
  const countEl = document.getElementById("courseCount");
  if (countEl) {
    countEl.textContent = courses.length;
  }

  // 평균 거리 / 난이도 계산
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

// 평균 정보 갱신
function updateSummaryMetrics() {
  const avgDist =
    courses.reduce((sum, c) => sum + c.distance, 0) / courses.length;

  const levelScores = { easy: 1, mid: 2, hard: 3 };
  const scoreMap = { 1: "초급 위주", 2: "중급 위주", 3: "상급 위주" };
  const avgScore =
    courses.reduce((sum, c) => sum + (levelScores[c.level] || 2), 0) /
    courses.length;

  const avgDistanceEl = document.getElementById("avgDistance");
  const avgLevelEl = document.getElementById("avgLevel");

  if (avgDistanceEl) {
    avgDistanceEl.textContent = `${avgDist.toFixed(1)}km`;
  }
  if (avgLevelEl) {
    const rounded = Math.round(avgScore);
    avgLevelEl.textContent = scoreMap[rounded] || "-";
  }
}

// 필터 버튼 세팅
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

// DOM 로드 후 실행
window.addEventListener("load", () => {
  // 카카오맵이 전역으로 로드되었는지 확인 후 초기화
  if (window.kakao && window.kakao.maps) {
    initMap();
  } else {
    // 혹시라도 sdk 로드 타이밍이 느릴 때 대비
    const interval = setInterval(() => {
      if (window.kakao && window.kakao.maps) {
        clearInterval(interval);
        initMap();
      }
    }, 200);
    setTimeout(() => clearInterval(interval), 5000); // 5초 이후에는 포기
  }

  renderCourseList("all");
  setupFilterChips();
});
