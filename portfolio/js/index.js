// ----- 샘플 데이터: 시도별 좌표 + 세대수(예시) -----
const regionData = [
  { name: "서울", value: 412300, lat: 37.5665, lng: 126.9780 },
  { name: "인천", value: 159874, lat: 37.4563, lng: 126.7052 },
  { name: "경기", value: 1921410, lat: 37.4138, lng: 127.5183 },
  { name: "강원", value: 159187, lat: 37.8228, lng: 128.1555 },
  { name: "충북", value: 227610, lat: 36.8000, lng: 127.7000 },
  { name: "충남", value: 168923, lat: 36.5184, lng: 126.8 },
  { name: "대전", value: 147579, lat: 36.3504, lng: 127.3845 },
  { name: "전북", value: 93370, lat: 35.7175, lng: 127.153 },
  { name: "광주", value: 142854, lat: 35.1595, lng: 126.8526 },
  { name: "전남", value: 55862, lat: 34.8161, lng: 126.463 },
  { name: "대구", value: 291599, lat: 35.8714, lng: 128.6014 },
  { name: "경북", value: 189734, lat: 36.4919, lng: 128.8889 },
  { name: "부산", value: 188917, lat: 35.1796, lng: 129.0756 },
  { name: "울산", value: 65286, lat: 35.5384, lng: 129.3114 },
  { name: "경남", value: 297631, lat: 35.4606, lng: 128.2132 },
  { name: "제주", value: 12509, lat: 33.4996, lng: 126.5312 },
];

let map;
let overlays = [];

// ---------- 지도 초기화 ----------
function initMap() {
  const container = document.getElementById("map");
  if (!container) return;

  const options = {
    center: new kakao.maps.LatLng(36.5, 127.8),
    level: 13,
  };

  map = new kakao.maps.Map(container, options);

  drawRegionOverlays(regionData);
}

// 시도별 파란 박스 오버레이
function drawRegionOverlays(data) {
  // 기존 오버레이 제거
  overlays.forEach((ov) => ov.setMap(null));
  overlays = [];

  data.forEach((region) => {
    const pos = new kakao.maps.LatLng(region.lat, region.lng);

    const content = document.createElement("div");
    content.className = "region-overlay";

    const top = document.createElement("div");
    top.className = "region-overlay-top";
    top.textContent = region.name;

    const bottom = document.createElement("div");
    bottom.className = "region-overlay-bottom";
    bottom.textContent = region.value.toLocaleString() + "세대";

    content.appendChild(top);
    content.appendChild(bottom);

    const overlay = new kakao.maps.CustomOverlay({
      position: pos,
      content,
      yAnchor: 1.0,
    });

    overlay.setMap(map);
    overlays.push(overlay);

    // 클릭 시 해당 지역으로 확대
    content.addEventListener("click", () => {
      map.setCenter(pos);
      map.setLevel(9);
      highlightSelectedRegion(region.name);
      document.getElementById("selectedRegionLabel").textContent =
        `${region.name} 시/도 데이터`;
    });
  });
}

// UI에서 시도 버튼 하이라이트
function highlightSelectedRegion(name) {
  document
    .querySelectorAll(".sb-grid-item")
    .forEach((btn) => btn.classList.remove("active"));

  document.querySelectorAll(".sb-grid-item").forEach((btn) => {
    if (btn.dataset.sido && btn.dataset.sido.includes(name)) {
      btn.classList.add("active");
    }
  });
}

// ---------- DomContentLoaded ----------
document.addEventListener("DOMContentLoaded", () => {
  // 카카오맵 로드
  if (window.kakao && window.kakao.maps) {
    kakao.maps.load(initMap);
  }

  // 시도 버튼 클릭 이벤트
  document.querySelectorAll(".sb-grid-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sido = btn.dataset.sido;
      document
        .querySelectorAll(".sb-grid-item")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // 대응되는 regionData 찾기
      const found = regionData.find((r) => sido.includes(r.name));
      if (found && map) {
        const pos = new kakao.maps.LatLng(found.lat, found.lng);
        map.setCenter(pos);
        map.setLevel(9);
        highlightSelectedRegion(found.name);
        document.getElementById("selectedRegionLabel").textContent =
          `${sido} 데이터`;
      }
    });
  });

  // 상단 칩 클릭
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document
        .querySelectorAll(".chip")
        .forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      // TODO: 선택된 필터에 따라 다른 지표로 바꿀 수 있음.
    });
  });

  // 왼쪽 수직 칩
  document.querySelectorAll(".v-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document
        .querySelectorAll(".v-chip")
        .forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      // TODO: 카테고리별 다른 API 호출/지표 표시
    });
  });

  // 지도 상단 우측 탭
  document.querySelectorAll(".legend-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".legend-tab")
        .forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      // TODO: 시도/시군구/읍면동 레벨별 데이터切替
    });
  });

  // 검색창 엔터 입력 (나중에 실데이터와 연결)
  const searchInput = document.getElementById("searchComplex");
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        // TODO: 단지명 검색 기능 연동
        // console.log("search:", searchInput.value);
      }
    });
  }
});

// ---------- 지도 오버레이 스타일 (JS에서 동적 삽입) ----------
const style = document.createElement("style");
style.innerHTML = `
.region-overlay {
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.3);
  cursor: pointer;
  font-family: -apple-system, BlinkMacSystemFont, "Noto Sans KR", system-ui;
}

.region-overlay-top {
  background-color: #0760ff;
  color: #ffffff;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
}

.region-overlay-bottom {
  background-color: #ffffff;
  color: #111827;
  padding: 2px 8px;
  font-size: 11px;
  text-align: center;
  white-space: nowrap;
}
`;
document.head.appendChild(style);
