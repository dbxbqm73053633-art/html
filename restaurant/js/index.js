// -------------------------------
// 전역 상태
// -------------------------------
let map;
let placesService;
let infoWindow;

let currentLocation = null;     // { lat, lng }
let nearbyPlaces = [];          // 마지막 검색 결과
let nearbyMarkers = [];         // 지도 위 마커들

// 전국 TOP1000 랭킹 데모 데이터
// 실제 서비스에서는 이 자리에 서버에서 내려주는 실시간 랭킹 JSON 바인딩
const mockRanking = [
  {
    id: 1,
    name: "광장시장 육회골목",
    city: "서울 종로",
    category: "한식 · 육회",
    score: 98,
    rating: 4.8,
    reviewCount: 12890,
    priceLevel: "₩₩",
    tags: ["줄서서먹는", "시장투어 필수", "야식맛집"]
  },
  {
    id: 2,
    name: "부산 암남동 돼지국밥",
    city: "부산 서구",
    category: "한식 · 국밥",
    score: 96,
    rating: 4.7,
    reviewCount: 8421,
    priceLevel: "₩",
    tags: ["현지인맛집", "24시간", "해장최강"]
  },
  {
    id: 3,
    name: "제주 애월 흑돼지 그릴",
    city: "제주 애월",
    category: "한식 · 흑돼지",
    score: 95,
    rating: 4.8,
    reviewCount: 6144,
    priceLevel: "₩₩₩",
    tags: ["뷰맛집", "가족모임", "관광필수"]
  },
  {
    id: 4,
    name: "대구 동인동 찜갈비 거리",
    city: "대구 중구",
    category: "한식 · 갈비",
    score: 93,
    rating: 4.6,
    reviewCount: 4970,
    priceLevel: "₩₩",
    tags: ["로컬맛집", "단체모임", "매운맛주의"]
  },
  {
    id: 5,
    name: "강릉 안목해변 카페거리",
    city: "강릉",
    category: "카페 · 디저트",
    score: 92,
    rating: 4.6,
    reviewCount: 9832,
    priceLevel: "₩₩",
    tags: ["뷰맛집", "브런치", "데이트코스"]
  },
  {
    id: 6,
    name: "성수 수제버거 라인",
    city: "서울 성동",
    category: "수제버거",
    score: 90,
    rating: 4.5,
    reviewCount: 4320,
    priceLevel: "₩₩",
    tags: ["핫플레이스", "감성인테리어"]
  }
];

let currentRankingSort = "score";

// -------------------------------
// 초기화
// -------------------------------

window.addEventListener("load", () => {
  initMap();
  initUIEvents();
  renderRankingList();
});

// -------------------------------
// 지도 초기화 + 내 위치 기반 FD6 검색
// -------------------------------

function initMap() {
  const container = document.getElementById("map");

  const initialCenter = new kakao.maps.LatLng(37.5665, 126.9780); // 서울 시청 근처
  const options = {
    center: initialCenter,
    level: 5
  };

  map = new kakao.maps.Map(container, options);
  infoWindow = new kakao.maps.InfoWindow({ zIndex: 10 });
  placesService = new kakao.maps.services.Places(map);

  // 내 위치 확인
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        currentLocation = { lat, lng };

        const loc = new kakao.maps.LatLng(lat, lng);
        map.setCenter(loc);

        // 내 위치 마커
        const myMarker = new kakao.maps.Marker({
          map,
          position: loc
        });

        document.getElementById("aroundMeLabel").textContent =
          "현재 위치 기준 3km 내 맛집";

        searchNearbyByCategory();
      },
      () => {
        document.getElementById("aroundMeLabel").textContent =
          "기본 지역(서울 시청) 기준 3km 내 맛집";
        searchNearbyByCategory();
      }
    );
  } else {
    document.getElementById("aroundMeLabel").textContent =
      "기본 지역(서울 시청) 기준 3km 내 맛집";
    searchNearbyByCategory();
  }
}

// FD6(음식점) 카테고리 검색 (내 주변)
function searchNearbyByCategory() {
  if (!placesService) return;

  const center = currentLocation
    ? new kakao.maps.LatLng(currentLocation.lat, currentLocation.lng)
    : map.getCenter();

  const options = {
    location: center,
    radius: 3000 // 3km
    // 추가 옵션 필요하면 여기에서 확장
  };

  placesService.categorySearch("FD6", placesSearchCallback, options);
}

function placesSearchCallback(data, status, pagination) {
  const Status = kakao.maps.services.Status;

  if (status === Status.ERROR) {
    console.log("카카오 장소 검색 오류");
    return;
  }

  clearNearbyMarkers();

  if (status === Status.ZERO_RESULT) {
    nearbyPlaces = [];
    renderNearbyList();
    return;
  }

  // data = 검색된 place 배열
  nearbyPlaces = data.map((place, index) => {
    const lat = parseFloat(place.y);
    const lng = parseFloat(place.x);

    const distanceKm = currentLocation
      ? calcDistanceKm(currentLocation.lat, currentLocation.lng, lat, lng)
      : null;

    return {
      index,
      place,
      lat,
      lng,
      distanceKm
    };
  });

  renderNearbyMarkers();
  renderNearbyList();
}

// -------------------------------
// UI 이벤트
// -------------------------------

function initUIEvents() {
  const searchBtn = document.getElementById("searchBtn");
  const keywordInput = document.getElementById("keywordInput");
  const nearbyReloadBtn = document.getElementById("nearbyReloadBtn");

  searchBtn.addEventListener("click", () => handleKeywordSearch());
  keywordInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      handleKeywordSearch();
    }
  });

  if (nearbyReloadBtn) {
    nearbyReloadBtn.addEventListener("click", () => {
      searchNearbyByCategory();
    });
  }

  // 정렬 칩
  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document
        .querySelectorAll(".chip")
        .forEach(c => c.classList.remove("chip--active"));
      chip.classList.add("chip--active");

      const sort = chip.dataset.sort;

      if (sort === "score" || sort === "rating" || sort === "review") {
        currentRankingSort = sort;
        renderRankingList();
      } else if (sort === "distance") {
        sortNearbyByDistance();
      }
    });
  });
}

// 키워드 검색 (지역/가게명/메뉴 등)
function handleKeywordSearch() {
  const keywordInput = document.getElementById("keywordInput");
  const keyword = keywordInput.value.trim();

  if (!keyword) {
    searchNearbyByCategory();
    return;
  }

  if (!placesService) return;

  const center = currentLocation
    ? new kakao.maps.LatLng(currentLocation.lat, currentLocation.lng)
    : map.getCenter();

  const options = {
    location: center,
    radius: 5000 // 5km
    // keywordSearch는 옵션으로 category_group_code 등을 줄 수 있음
    // category_group_code: 'FD6' // 레스토랑만
  };

  placesService.keywordSearch(keyword, placesSearchCallback, options);

  document.getElementById("aroundMeLabel").textContent =
    `“${keyword}” 검색 결과`;
}

// -------------------------------
// 전국 랭킹 렌더링 (TOP1000 구조)
// -------------------------------

function renderRankingList() {
  const container = document.getElementById("ranking-list");
  if (!container) return;

  const sorted = [...mockRanking].sort((a, b) => {
    if (currentRankingSort === "rating") {
      return b.rating - a.rating;
    }
    if (currentRankingSort === "review") {
      return b.reviewCount - a.reviewCount;
    }
    // 기본: score (실시간 인기 점수)
    return b.score - a.score;
  });

  container.innerHTML = "";

  sorted.forEach((item, idx) => {
    const card = document.createElement("article");
    card.className = "card card--ranking";

    card.innerHTML = `
      <div class="card__rank">#${idx + 1}</div>
      <div class="card__body">
        <h3 class="card__title">${item.name}</h3>
        <p class="card__meta">${item.city} · ${item.category}</p>
        <p class="card__meta">
          <span class="rating">${item.rating.toFixed(1)}★</span>
          <span class="dot">·</span>
          리뷰 ${item.reviewCount.toLocaleString()}개
          <span class="dot">·</span>
          인기점수 ${item.score}
        </p>
        <p class="card__tags">
          ${item.tags.map(t => `<span class="tag">${t}</span>`).join("")}
        </p>
      </div>
    `;

    container.appendChild(card);
  });
}

// -------------------------------
// 내 주변 리스트 + 마커 렌더링
// -------------------------------

function renderNearbyMarkers() {
  const bounds = new kakao.maps.LatLngBounds();

  nearbyMarkers = [];

  nearbyPlaces.forEach((item, idx) => {
    const position = new kakao.maps.LatLng(item.lat, item.lng);
    bounds.extend(position);

    const marker = new kakao.maps.Marker({
      map,
      position
    });

    kakao.maps.event.addListener(marker, "click", () => {
      openInfoWindow(item, marker);
    });

    nearbyMarkers.push(marker);
  });

  if (!bounds.isEmpty()) {
    map.setBounds(bounds, 40, 40, 40, 40);
  }
}

function clearNearbyMarkers() {
  nearbyMarkers.forEach(m => m.setMap(null));
  nearbyMarkers = [];
}

function renderNearbyList() {
  const container = document.getElementById("nearby-list");
  if (!container) return;

  container.innerHTML = "";

  if (nearbyPlaces.length === 0) {
    container.innerHTML =
      '<p class="section-caption">조건에 맞는 주변 맛집이 없습니다.</p>';
    return;
  }

  nearbyPlaces.forEach((item, idx) => {
    const { place, distanceKm } = item;
    const card = document.createElement("article");
    card.className = "card card--nearby";
    card.dataset.index = idx;

    const distanceLabel = distanceKm
      ? `${distanceKm.toFixed(1)}km`
      : "거리 계산 중";

    card.innerHTML = `
      <div class="card__rank card__rank--nearby">#${idx + 1}</div>
      <div class="card__body">
        <h3 class="card__title">${place.place_name}</h3>
        <p class="card__meta">
          ${place.road_address_name || place.address_name || ""}
        </p>
        <p class="card__meta">
          <strong>${place.category_group_name || "맛집"}</strong>
          <span class="dot">·</span>
          ${distanceLabel}
          ${
            place.phone
              ? `<span class="dot">·</span> ${place.phone}`
              : ""
          }
        </p>
        <div class="card-actions">
          <button class="primary" data-action="focus">지도에서 보기</button>
          <a href="${place.place_url}" target="_blank" data-action="detail">리뷰 보러가기</a>
          <button data-action="route">길 안내</button>
        </div>
      </div>
    `;

    // 카드 전체 클릭 시 지도 포커스
    card.addEventListener("click", e => {
      // 버튼 클릭은 개별로 처리
      if (e.target.closest("button, a")) return;
      focusPlace(idx);
    });

    // 버튼 개별 액션
    const buttons = card.querySelectorAll("[data-action]");
    buttons.forEach(btn => {
      btn.addEventListener("click", e => {
        const action = btn.dataset.action;
        e.stopPropagation();

        if (action === "focus") {
          focusPlace(idx);
        } else if (action === "route") {
          openRoute(item);
        }
        // detail은 a 태그 자체 링크로 이동
      });
    });

    container.appendChild(card);
  });
}

function focusPlace(index) {
  const item = nearbyPlaces[index];
  if (!item) return;

  const position = new kakao.maps.LatLng(item.lat, item.lng);
  map.panTo(position);

  if (nearbyMarkers[index]) {
    openInfoWindow(item, nearbyMarkers[index]);
  }
}

function openInfoWindow(item, marker) {
  const { place, distanceKm } = item;
  const distanceLabel = distanceKm
    ? `${distanceKm.toFixed(1)}km`
    : "";

  const content = `
    <div style="padding:8px 10px;min-width:180px;">
      <div style="font-weight:600;font-size:13px;margin-bottom:2px;">
        ${place.place_name}
      </div>
      <div style="font-size:11px;color:#6b7280;margin-bottom:2px;">
        ${place.road_address_name || place.address_name || ""}
      </div>
      <div style="font-size:11px;color:#6b7280;">
        ${place.phone || ""}
        ${
          distanceLabel
            ? `<span style="margin-left:4px;">· ${distanceLabel}</span>`
            : ""
        }
      </div>
    </div>
  `;

  infoWindow.setContent(content);
  infoWindow.open(map, marker);
}

// 카카오 길찾기 URL 열기
function openRoute(item) {
  const { place, lat, lng } = item;
  const name = encodeURIComponent(place.place_name || "목적지");

  // 목적지만 지정한 길찾기 URL
  const url = `https://map.kakao.com/link/to/${name},${lat},${lng}`;
  window.open(url, "_blank");
}

// -------------------------------
// 거리 계산 (Haversine)
// -------------------------------

function calcDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 거리순 정렬 (내 주변 리스트만)
function sortNearbyByDistance() {
  if (!currentLocation || nearbyPlaces.length === 0) return;

  nearbyPlaces.sort((a, b) => {
    const da = a.distanceKm ?? Number.MAX_VALUE;
    const db = b.distanceKm ?? Number.MAX_VALUE;
    return da - db;
  });

  renderNearbyList();
}
