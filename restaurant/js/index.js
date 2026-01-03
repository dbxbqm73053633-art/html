let map;
let placesService;
let infoWindow;

let currentLocation = null;      // { lat, lng }
let placeResults = [];           // 원본 검색 결과 + 내부 rating
let visibleResults = [];         // 필터/정렬 적용된 결과
let markers = [];

let sortMode = "distance";
let categoryFilter = "all";
let maxDistanceKm = 3;

// 초기화
window.addEventListener("load", () => {
  initMap();
  initUI();
});

function initMap() {
  const container = document.getElementById("map");
  const center = new kakao.maps.LatLng(37.5665, 126.9780); // 서울 시청

  map = new kakao.maps.Map(container, {
    center,
    level: 5
  });

  placesService = new kakao.maps.services.Places(map);
  infoWindow = new kakao.maps.InfoWindow({ zIndex: 10 });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        currentLocation = { lat, lng };
        const loc = new kakao.maps.LatLng(lat, lng);
        map.setCenter(loc);

        new kakao.maps.Marker({ map, position: loc });

        document.getElementById("aroundMeLabel").textContent =
          "현재 위치 기준 3km 내 맛집(음식점) 랭킹";

        searchByCategory();
      },
      () => {
        document.getElementById("aroundMeLabel").textContent =
          "기본 지역(서울 시청) 기준 3km 내 맛집(음식점) 랭킹";
        searchByCategory();
      }
    );
  } else {
    document.getElementById("aroundMeLabel").textContent =
      "기본 지역(서울 시청) 기준 3km 내 맛집(음식점) 랭킹";
    searchByCategory();
  }
}

// UI 이벤트
function initUI() {
  const searchBtn = document.getElementById("searchBtn");
  const keywordInput = document.getElementById("keywordInput");
  const locateBtn = document.getElementById("locateBtn");
  const categorySelect = document.getElementById("categoryFilter");
  const distanceSelect = document.getElementById("distanceFilter");

  searchBtn.addEventListener("click", handleKeywordSearch);
  keywordInput.addEventListener("keydown", e => {
    if (e.key === "Enter") handleKeywordSearch();
  });

  locateBtn.addEventListener("click", () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      currentLocation = { lat, lng };
      const loc = new kakao.maps.LatLng(lat, lng);
      map.setCenter(loc);

      new kakao.maps.Marker({ map, position: loc });

      document.getElementById("aroundMeLabel").textContent =
        "현재 위치 기준 3km 내 맛집(음식점) 랭킹";

      searchByCategory();
    });
  });

  // 정렬 칩
  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document
        .querySelectorAll(".chip")
        .forEach(c => c.classList.remove("chip--active"));
      chip.classList.add("chip--active");

      sortMode = chip.dataset.sort || "distance";
      updateVisibleResults();
      clearMarkers();
      renderMarkers();
      renderPlaceList();
    });
  });

  // 카테고리 필터
  categorySelect.addEventListener("change", () => {
    categoryFilter = categorySelect.value;
    updateVisibleResults();
    clearMarkers();
    renderMarkers();
    renderPlaceList();
  });

  // 거리 필터
  distanceSelect.addEventListener("change", () => {
    maxDistanceKm = parseFloat(distanceSelect.value);
    if (Number.isNaN(maxDistanceKm)) maxDistanceKm = 0;
    updateVisibleResults();
    clearMarkers();
    renderMarkers();
    renderPlaceList();
  });
}

// FD6 카테고리(음식점) 검색
function searchByCategory() {
  if (!placesService) return;

  const center = currentLocation
    ? new kakao.maps.LatLng(currentLocation.lat, currentLocation.lng)
    : map.getCenter();

  const options = {
    location: center,
    radius: 3000 // 3km
  };

  placesService.categorySearch("FD6", handleSearchResult, options);
}

// 키워드 검색
function handleKeywordSearch() {
  const input = document.getElementById("keywordInput");
  const keyword = input.value.trim();

  if (!keyword) {
    document.getElementById("aroundMeLabel").textContent =
      "현재 위치 기준 3km 내 맛집(음식점) 랭킹";
    searchByCategory();
    return;
  }

  if (!placesService) return;

  const center = currentLocation
    ? new kakao.maps.LatLng(currentLocation.lat, currentLocation.lng)
    : map.getCenter();

  const options = {
    location: center,
    radius: 5000 // 5km
  };

  placesService.keywordSearch(keyword, handleSearchResult, options);

  document.getElementById("aroundMeLabel").textContent =
    `“${keyword}” 카카오맵 검색 결과 랭킹`;
}

// 검색 결과 처리
function handleSearchResult(data, status, pagination) {
  const Status = kakao.maps.services.Status;

  if (status === Status.ERROR) {
    console.log("카카오맵 검색 오류");
    return;
  }

  clearMarkers();

  if (status === Status.ZERO_RESULT) {
    placeResults = [];
    visibleResults = [];
    renderPlaceList();
    return;
  }

  placeResults = data.map(place => {
    const lat = parseFloat(place.y);
    const lng = parseFloat(place.x);

    let distanceKm = null;
    if (currentLocation) {
      distanceKm = calcDistanceKm(currentLocation.lat, currentLocation.lng, lat, lng);
    }

    // ★ 실제 서비스에서는 여기서 서버에서 받은 별점/리뷰값을 매핑하면 됨
    const internalRating = getDemoRating(place.id || place.place_name || "");

    return {
      place,
      lat,
      lng,
      distanceKm,
      rating: internalRating.rating,
      reviewCount: internalRating.reviewCount
    };
  });

  updateVisibleResults();
  renderMarkers();
  renderPlaceList();
}

// 필터 + 정렬 적용
function updateVisibleResults() {
  let list = [...placeResults];

  // 카테고리 필터
  if (categoryFilter !== "all") {
    list = list.filter(item => {
      const catName = item.place.category_name || "";
      switch (categoryFilter) {
        case "korean":
          return catName.includes("한식");
        case "japanese":
          return catName.includes("일식") || catName.includes("초밥") || catName.includes("회");
        case "chinese":
          return catName.includes("중식") || catName.includes("중국요리");
        case "western":
          return catName.includes("양식") || catName.includes("스테이크") || catName.includes("파스타");
        case "cafe":
          return catName.includes("카페") || catName.includes("디저트");
        case "pub":
          return catName.includes("호프") || catName.includes("술집") || catName.includes("바");
        default:
          return true;
      }
    });
  }

  // 거리 필터 (0 = 제한 없음)
  if (maxDistanceKm > 0 && currentLocation) {
    list = list.filter(item => {
      return item.distanceKm == null || item.distanceKm <= maxDistanceKm;
    });
  }

  // 정렬
  list.sort((a, b) => {
    if (sortMode === "rating") {
      const ra = a.rating ?? 0;
      const rb = b.rating ?? 0;
      if (rb !== ra) return rb - ra;

      const rca = a.reviewCount ?? 0;
      const rcb = b.reviewCount ?? 0;
      if (rcb !== rca) return rcb - rca;
    } else if (sortMode === "review") {
      const rca = a.reviewCount ?? 0;
      const rcb = b.reviewCount ?? 0;
      if (rcb !== rca) return rcb - rca;
    } else if (sortMode === "name") {
      const na = a.place.place_name || "";
      const nb = b.place.place_name || "";
      const cmp = na.localeCompare(nb, "ko");
      if (cmp !== 0) return cmp;
    }

    // 기본 또는 동점일 때: 거리순
    const da = a.distanceKm ?? Number.MAX_VALUE;
    const db = b.distanceKm ?? Number.MAX_VALUE;
    return da - db;
  });

  visibleResults = list;
}

// 마커 렌더링
function renderMarkers() {
  markers = [];
  const bounds = new kakao.maps.LatLngBounds();

  visibleResults.forEach((item, idx) => {
    const position = new kakao.maps.LatLng(item.lat, item.lng);
    bounds.extend(position);

    const marker = new kakao.maps.Marker({
      map,
      position
    });

    kakao.maps.event.addListener(marker, "click", () => {
      openInfoWindow(item, marker);
    });

    markers.push(marker);
  });

  if (!bounds.isEmpty()) {
    map.setBounds(bounds, 40, 40, 40, 40);
  }
}

function clearMarkers() {
  markers.forEach(m => m.setMap(null));
  markers = [];
}

// 인포 윈도우
function openInfoWindow(item, marker) {
  const { place, distanceKm, rating, reviewCount } = item;
  const distanceLabel = distanceKm ? `${distanceKm.toFixed(1)}km` : "";

  const content = `
    <div style="padding:8px 10px;min-width:190px;">
      <div style="font-weight:600;font-size:13px;margin-bottom:2px;">
        ${place.place_name}
      </div>
      <div style="font-size:11px;color:#6b7280;margin-bottom:2px;">
        ${place.road_address_name || place.address_name || ""}
      </div>
      <div style="font-size:11px;color:#fbbf24;">
        ⭐ <span style="color:#e5e7eb;">${rating.toFixed(1)}</span>
        <span style="color:#6b7280;"> · 리뷰 ${reviewCount}개</span>
      </div>
      <div style="font-size:11px;color:#6b7280;margin-top:2px;">
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

// 리스트 렌더링
function renderPlaceList() {
  const container = document.getElementById("place-list");
  if (!container) return;

  container.innerHTML = "";

  if (visibleResults.length === 0) {
    container.innerHTML =
      '<p class="section-caption">검색 결과가 없습니다.</p>';
    return;
  }

  visibleResults.forEach((item, idx) => {
    const { place, distanceKm, rating, reviewCount } = item;
    const distanceLabel = distanceKm
      ? `${distanceKm.toFixed(1)}km`
      : "거리 계산 중";

    const card = document.createElement("article");
    card.className = "card";
    card.dataset.index = idx;

    card.innerHTML = `
      <div class="card__rank">#${idx + 1}</div>
      <div class="card__body">
        <h3 class="card__title">${place.place_name}</h3>
        <p class="card__meta">
          ${place.road_address_name || place.address_name || ""}
        </p>
        <p class="rating-line">
          ⭐ <span>${rating.toFixed(1)}</span>
          <span class="dot">·</span>
          <span>리뷰 ${reviewCount}개</span>
        </p>
        <p class="card__meta">
          <strong>${place.category_group_name || "맛집"}</strong>
          <span class="dot">·</span>
          ${distanceLabel}
          ${
            place.phone
              ? `<span class="dot">·</span>${place.phone}`
              : ""
          }
        </p>
        <div class="card-actions">
          <button class="primary" data-action="focus">지도에서 보기</button>
          <a href="${place.place_url}" target="_blank" data-action="detail">카카오맵 상세/리뷰</a>
          <button data-action="route">길 안내</button>
        </div>
      </div>
    `;

    // 카드 전체 클릭 시 포커스
    card.addEventListener("click", e => {
      if (e.target.closest("button, a")) return;
      focusPlace(idx);
    });

    // 버튼 액션
    card.querySelectorAll("[data-action]").forEach(el => {
      el.addEventListener("click", e => {
        e.stopPropagation();
        const action = el.dataset.action;

        if (action === "focus") {
          focusPlace(idx);
        } else if (action === "route") {
          openRoute(item);
        }
      });
    });

    container.appendChild(card);
  });
}

function focusPlace(idx) {
  const item = visibleResults[idx];
  if (!item) return;

  const position = new kakao.maps.LatLng(item.lat, item.lng);
  map.panTo(position);

  if (markers[idx]) {
    openInfoWindow(item, markers[idx]);
  }
}

// 길 안내 (카카오 지도 링크)
function openRoute(item) {
  const { place, lat, lng } = item;
  const name = encodeURIComponent(place.place_name || "목적지");
  const url = `https://map.kakao.com/link/to/${name},${lat},${lng}`;
  window.open(url, "_blank");
}

// ===== 별점/리뷰 데모 로직 =====
// 실제 서비스에서는 이 부분을 서버에서 가져온 값으로 교체하면 됨
function getDemoRating(key) {
  const h = simpleHash(key);
  const ratingRaw = 3.3 + (h % 16) / 10;      // 3.3 ~ 4.8
  const rating = Math.min(4.9, ratingRaw);
  const reviewCount = 8 + (h % 250);          // 8 ~ 257

  return {
    rating: Number(rating.toFixed(1)),
    reviewCount
  };
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// 거리 계산 (Haversine)
function calcDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
