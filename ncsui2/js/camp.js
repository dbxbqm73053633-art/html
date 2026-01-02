// === 제주 유명 캠핑장 5곳 데이터 ===
const CAMPS = [
  {
    id: "geumneung",
    name: "금능해수욕장 야영장",
    keyword: "금능해수욕장 야영장",
    shortAddr: "제주시 한림읍 금능해변",
  },
  {
    id: "platinum",
    name: "제주플래티늄카라반",
    keyword: "제주플래티늄카라반",
    shortAddr: "제주시 애월읍 하귀미수포길 5-8",
  },
  {
    id: "stabil",
    name: "스타빌 캠핑장",
    keyword: "스타빌 캠핑장 제주",
    shortAddr: "서귀포시 안덕면 광평로 34-154",
  },
  {
    id: "pyoseon",
    name: "표선해수욕장 야영장",
    keyword: "표선해수욕장 야영장",
    shortAddr: "서귀포시 표선해수욕장 일대",
  },
  {
    id: "dain",
    name: "다인리조트 카라반",
    keyword: "다인리조트 카라반",
    shortAddr: "제주시 애월읍 애월해안로 400-9",
  },
];

let map;
let infoWindow;
let placesService;

window.addEventListener("DOMContentLoaded", () => {
  // 카카오맵 SDK 로드
  if (window.kakao && window.kakao.maps && kakao.maps.load) {
    kakao.maps.load(initMap);
  }

  initTabbarNav();
  initCampListClick();
});

// 지도 초기화
function initMap() {
  const mapContainer = document.getElementById("map");
  if (!mapContainer) return;

  const center = new kakao.maps.LatLng(33.3899, 126.535); // 제주 중앙 근처

  map = new kakao.maps.Map(mapContainer, {
    center,
    level: 9,
  });

  infoWindow = new kakao.maps.InfoWindow({ zIndex: 1 });
  placesService = new kakao.maps.services.Places();

  CAMPS.forEach((camp, index) => {
    searchAndCreateMarker(camp, index);
  });
}

// 장소 검색 + 마커 생성
function searchAndCreateMarker(camp, index) {
  if (!placesService) return;

  placesService.keywordSearch(camp.keyword, (data, status) => {
    if (status !== kakao.maps.services.Status.OK || !data.length) {
      console.log("검색 실패:", camp.keyword, status);
      return;
    }

    const place = data[0];
    const position = new kakao.maps.LatLng(place.y, place.x);

    camp.position = position;
    camp.place = place;

    const marker = new kakao.maps.Marker({
      map,
      position,
    });
    camp.marker = marker;

    const iwContent = `
      <div class="map-iw">
        <div class="map-iw-title">${camp.name}</div>
        <div class="map-iw-addr">${camp.shortAddr}</div>
        <div class="map-iw-link">
          <a href="https://map.kakao.com/link/to/${encodeURIComponent(
            camp.name
          )},${place.y},${place.x}" target="_blank" rel="noopener">
            카카오맵 길찾기 열기
          </a>
        </div>
      </div>
    `;

    kakao.maps.event.addListener(marker, "click", () => {
      showCampOnMap(camp, iwContent);
      activateCampListItem(camp.id);
    });

    // 첫 번째 캠핑장은 초기 포커스
    if (index === 0) {
      map.setCenter(position);
      infoWindow.setContent(iwContent);
      infoWindow.open(map, marker);
    }
  });
}

// 지도에서 캠핑장 보여주기
function showCampOnMap(camp, iwContent) {
  if (!camp.position || !camp.marker) return;

  map.panTo(camp.position);
  infoWindow.setContent(iwContent);
  infoWindow.open(map, camp.marker);
}

// 리스트 클릭 이벤트
function initCampListClick() {
  const items = document.querySelectorAll(".camp-item");

  items.forEach((item) => {
    item.addEventListener("click", () => {
      const campId = item.dataset.id;
      const camp = CAMPS.find((c) => c.id === campId);
      if (!camp || !camp.position || !camp.marker || !camp.place) return;

      const place = camp.place;
      const iwContent = `
        <div class="map-iw">
          <div class="map-iw-title">${camp.name}</div>
          <div class="map-iw-addr">${camp.shortAddr}</div>
          <div class="map-iw-link">
            <a href="https://map.kakao.com/link/to/${encodeURIComponent(
              camp.name
            )},${place.y},${place.x}" target="_blank" rel="noopener">
              카카오맵 길찾기 열기
            </a>
          </div>
        </div>
      `;

      showCampOnMap(camp, iwContent);
      activateCampListItem(campId);
    });
  });
}

// 리스트 active 스타일 토글
function activateCampListItem(campId) {
  const items = document.querySelectorAll(".camp-item");
  items.forEach((item) => {
    if (item.dataset.id === campId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

// 탭바 네비게이션 – 전부 클릭하면 이동
function initTabbarNav() {
  const tabRoute = {
    home: "main.html",
    community: "community.html",
    course: "course.html",
    camping: "camp.html",       // 캠핑 메인 페이지로 이동하도록 설정
    my: "my.html",
  };

  const tabs = document.querySelectorAll(".tabbar .tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const key = tab.dataset.tab;
      const target = tabRoute[key];
      if (!target) return;

      window.location.href = target;
    });
  });
}
