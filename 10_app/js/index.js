// 공공데이터포털 부산 맛집 API
const API_URL = "https://apis.data.go.kr/6260000/FoodService/getFoodKr";
const API_KEY =
  "37441f86a6fdf7eed59e7a176e50c990c64d651d3fb878215ba1972265e1028a";

// DOM 엘리먼트
const mapContainer = document.getElementById("map");
const recenterBtn = document.getElementById("recenterBtn");

const locationStatusEl = document.getElementById("locationStatus");
const keywordInput = document.getElementById("keywordInput");
const radiusSelect = document.getElementById("radiusSelect");
const restaurantListEl = document.getElementById("restaurantList");

// 바텀시트
const sheetEl = document.getElementById("bottomSheet");
const closeSheetBtn = document.getElementById("closeSheetBtn");
const toastEl = document.getElementById("toast");

const bsTitleEl = document.getElementById("bsTitle");
const bsDistanceEl = document.getElementById("bsDistance");
const bsImageEl = document.getElementById("bsImage");
const bsAddressEl = document.getElementById("bsAddress");
const bsDescEl = document.getElementById("bsDesc");
const bsMenuEl = document.getElementById("bsMenu");
const bsTelEl = document.getElementById("bsTel");
const bsTimeEl = document.getElementById("bsTime");
const bsCallBtn = document.getElementById("bsCallBtn");
const bsHomepageBtn = document.getElementById("bsHomepageBtn");

// 상태
let mapInstance = null;
let userMarker = null;
let poiMarker = null;
let userPos = null;

let allItems = []; // 원본 + distance
let viewItems = []; // 검색/필터 적용 후

// ----------------------- 초기 로딩 ------------------------ //

window.addEventListener("load", () => {
  initMap();
  fetchRestaurants();
  requestUserLocation();
});

// ----------------------- 지도 초기화 ---------------------- //

function initMap() {
  const center = new kakao.maps.LatLng(35.1796, 129.0756); // 부산 시청 근처
  mapInstance = new kakao.maps.Map(mapContainer, {
    center,
    level: 6
  });

  userMarker = new kakao.maps.Marker({
    map: mapInstance,
    position: center
  });

  poiMarker = new kakao.maps.Marker({
    map: mapInstance,
    position: center
  });
  poiMarker.setMap(null); // 처음엔 숨김
}

// ----------------------- 데이터 로딩 ---------------------- //

async function fetchRestaurants() {
  try {
    const params = new URLSearchParams({
      serviceKey: API_KEY,
      numOfRows: "200",
      pageNo: "1",
      resultType: "json"
    });

    const res = await fetch(`${API_URL}?${params.toString()}`);
    const data = await res.json();

    const items = data.getFoodKr?.item || [];
    const arr = Array.isArray(items) ? items : [items];

    allItems = arr.map((item) => ({
      ...item,
      distance: null // 나중에 계산
    }));

    applyFilterAndRender();
  } catch (e) {
    console.error(e);
    restaurantListEl.innerHTML =
      '<li class="restaurant-item"><div class="item-main-title">데이터를 불러오지 못했습니다.</div></li>';
  }
}

// ----------------------- 위치 권한 ------------------------ //

function requestUserLocation() {
  if (!navigator.geolocation) {
    locationStatusEl.textContent = "위치 서비스를 지원하지 않는 기기입니다.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      userPos = { lat, lng };

      locationStatusEl.textContent = "현 위치 기준 정렬 완료";
      locationStatusEl.classList.add("chip-strong");

      updateUserMarker();
      recenterMap();

      recomputeDistances();
      applyFilterAndRender();
      showToast("현 위치를 기준으로 가까운 맛집부터 보여줍니다.");
    },
    () => {
      locationStatusEl.textContent = "위치 권한이 꺼져 있어 기본 정렬로 표시됩니다.";
      showToast("위치 권한 허용 시 거리 기준 정렬이 활성화됩니다.");
    },
    {
      enableHighAccuracy: true,
      timeout: 7000
    }
  );
}

function updateUserMarker() {
  if (!userPos || !mapInstance) return;
  const pos = new kakao.maps.LatLng(userPos.lat, userPos.lng);
  userMarker.setPosition(pos);
}

function recenterMap() {
  if (!userPos || !mapInstance) return;
  const pos = new kakao.maps.LatLng(userPos.lat, userPos.lng);
  mapInstance.setCenter(pos);
  mapInstance.setLevel(5);
}

// ----------------------- 거리 계산 ------------------------ //

function recomputeDistances() {
  if (!userPos) return;

  allItems = allItems.map((item) => {
    const lat = parseFloat(item.LAT);
    const lng = parseFloat(item.LNG);

    if (isNaN(lat) || isNaN(lng)) {
      return { ...item, distance: null };
    }
    const distKm = haversineDistance(userPos.lat, userPos.lng, lat, lng);
    return { ...item, distance: distKm };
  });
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const toRad = (d) => (d * Math.PI) / 180;
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

// ----------------------- 필터 & 정렬 ---------------------- //

function applyFilterAndRender() {
  const keyword = keywordInput.value.trim().toLowerCase();
  const radiusKm = Number(radiusSelect.value || 0);

  viewItems = allItems.filter((item) => {
    const title = (item.MAIN_TITLE || "").toLowerCase();
    const menu = (item.RPRSNTV_MENU || "").toLowerCase();

    const matchKeyword =
      !keyword || title.includes(keyword) || menu.includes(keyword);

    const matchRadius =
      !radiusKm || item.distance === null || item.distance <= radiusKm;

    return matchKeyword && matchRadius;
  });

  // 거리 → null 은 맨 뒤로
  viewItems.sort((a, b) => {
    const da = a.distance == null ? Number.POSITIVE_INFINITY : a.distance;
    const db = b.distance == null ? Number.POSITIVE_INFINITY : b.distance;
    return da - db;
  });

  renderList();
}

function renderList() {
  restaurantListEl.innerHTML = "";

  if (viewItems.length === 0) {
    restaurantListEl.innerHTML =
      '<li class="restaurant-item"><div class="item-main-title">검색 결과가 없습니다.</div></li>';
    return;
  }

  viewItems.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "restaurant-item";
    li.dataset.index = String(index);

    const distanceText =
      item.distance == null
        ? "거리 정보 없음"
        : item.distance < 1
        ? `${(item.distance * 1000).toFixed(0)}m`
        : `${item.distance.toFixed(1)}km`;

    li.innerHTML = `
      <div class="restaurant-item-header">
        <div class="item-main-title">${escapeHtml(item.MAIN_TITLE || "-")}</div>
        <span class="item-distance-badge">${distanceText}</span>
      </div>
      <div class="item-sub">
        <div class="item-sub-row">
          <span>주소</span> ${escapeHtml(item.ADDR1 || "")}
        </div>
        <div class="item-sub-row">
          <span>메뉴</span> ${escapeHtml(item.RPRSNTV_MENU || "정보 없음")}
        </div>
      </div>
    `;

    li.addEventListener("click", () => {
      onSelectItem(item);
    });

    restaurantListEl.appendChild(li);
  });
}

// ----------------------- 리스트 선택 ---------------------- //

function onSelectItem(item) {
  const lat = parseFloat(item.LAT);
  const lng = parseFloat(item.LNG);

  if (!isNaN(lat) && !isNaN(lng)) {
    const pos = new kakao.maps.LatLng(lat, lng);
    poiMarker.setPosition(pos);
    poiMarker.setMap(mapInstance);
    mapInstance.setCenter(pos);
    mapInstance.setLevel(4);
  }

  openBottomSheet(item);
}

// ----------------------- 바텀시트 ------------------------ //

function openBottomSheet(item) {
  const title = item.MAIN_TITLE || "";
  const addr = item.ADDR1 || "";
  const desc = (item.ITEMCNTNTS || "").trim();
  const menu = item.RPRSNTV_MENU || "";
  const tel = (item.CNTCT_TEL || "").trim();
  const time = item.USAGE_DAY_WEEK_AND_TIME || "";
  const homepage = (item.HOMEPAGE_URL || "").trim();

  let imgUrl = item.MAIN_IMG_NORMAL || item.MAIN_IMG_THUMB || "";
  if (imgUrl && imgUrl.startsWith("/")) {
    imgUrl = "https://www.visitbusan.net" + imgUrl;
  }

  const distanceText =
    item.distance == null
      ? "거리 정보 없음"
      : item.distance < 1
      ? `${(item.distance * 1000).toFixed(0)}m`
      : `${item.distance.toFixed(1)}km`;

  bsTitleEl.textContent = title;
  bsDistanceEl.textContent = distanceText;
  bsImageEl.src = imgUrl || "";
  bsImageEl.alt = title || "맛집 이미지";

  bsAddressEl.textContent = addr;
  bsDescEl.textContent = desc || "상세 설명 정보가 없습니다.";
  bsMenuEl.textContent = menu || "대표 메뉴 정보가 없습니다.";
  bsTelEl.textContent = tel || "문의 정보 없음";
  bsTimeEl.textContent = time || "운영 시간 정보 없음";

  if (tel) {
    bsCallBtn.href = `tel:${tel.replace(/[^0-9]/g, "")}`;
    bsCallBtn.style.display = "block";
  } else {
    bsCallBtn.style.display = "none";
  }

  if (homepage) {
    bsHomepageBtn.href = homepage;
    bsHomepageBtn.style.display = "block";
  } else {
    bsHomepageBtn.style.display = "none";
  }

  sheetEl.classList.add("open");
}

function closeBottomSheet() {
  sheetEl.classList.remove("open");
}

// ----------------------- 유틸 ----------------------------- //

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2600);
}

// ----------------------- 이벤트 --------------------------- //

keywordInput.addEventListener("input", () => {
  applyFilterAndRender();
});

radiusSelect.addEventListener("change", () => {
  applyFilterAndRender();
});

recenterBtn.addEventListener("click", () => {
  if (!userPos) {
    showToast("위치 권한 허용 후 사용 가능합니다.");
    return;
  }
  recenterMap();
  showToast("현 위치로 지도를 이동했습니다.");
});

closeSheetBtn.addEventListener("click", () => {
  closeBottomSheet();
});

// 바텀시트 바깥(검은 배경)은 없으니, 아래로 스와이프 제스처 등은 필요시 추가 구현 가능
