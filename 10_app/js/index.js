// 공공데이터포털 부산맛집 API
const API_URL = "https://apis.data.go.kr/6260000/FoodService/getFoodKr";
const API_KEY =
  "37441f86a6fdf7eed59e7a176e50c990c64d651d3fb878215ba1972265e1028a"; // 인코딩키 기준

const restaurantListEl = document.getElementById("restaurantList");
const keywordInput = document.getElementById("keywordInput");

const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageInfoEl = document.getElementById("pageInfo");

const detailPlaceholderEl = document.getElementById("detailPlaceholder");
const detailViewEl = document.getElementById("detailView");

const detailImageEl = document.getElementById("detailImage");
const detailTitleEl = document.getElementById("detailTitle");
const detailAddressEl = document.getElementById("detailAddress");
const detailDescEl = document.getElementById("detailDesc");
const detailMenuEl = document.getElementById("detailMenu");
const detailTelEl = document.getElementById("detailTel");
const detailTimeEl = document.getElementById("detailTime");
const detailHomepageEl = document.getElementById("detailHomepage");
const noHomepageBarEl = document.getElementById("noHomepageBar");

// 클라이언트 상태
let rawItems = []; // API에서 받은 원본
let filteredItems = []; // 검색 필터 후 리스트에 쓰는 배열
let currentPage = 1;
const rowsPerPage = 10;

let kakaoMap = null;
let kakaoMarker = null;

// ---------------------- 데이터 로딩 ------------------------

async function fetchRestaurants() {
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    numOfRows: "150", // 전체를 한번에 받아놓고 클라이언트에서 페이징
    pageNo: "1",
    resultType: "json"
  });

  const res = await fetch(`${API_URL}?${params.toString()}`);
  const data = await res.json();

  const items = data.getFoodKr?.item || [];
  rawItems = Array.isArray(items) ? items : [items];
  filteredItems = [...rawItems];
  currentPage = 1;

  renderList();
  updatePagination();
}

// ---------------------- 리스트 렌더링 ------------------------

function renderList() {
  restaurantListEl.innerHTML = "";

  if (filteredItems.length === 0) {
    restaurantListEl.innerHTML =
      '<li class="restaurant-item">검색 결과가 없습니다.</li>';
    return;
  }

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageItems = filteredItems.slice(start, end);

  pageItems.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "restaurant-item";
    li.dataset.idx = String(start + index);

    li.innerHTML = `
      <div class="item-header">
        <div class="item-title">${escapeHtml(item.MAIN_TITLE || "-")}</div>
        <div class="item-icons">
          <button class="icon-btn" aria-hidden="true">🔍</button>
          <button class="icon-btn" aria-hidden="true">♡</button>
        </div>
      </div>
      <div class="item-meta">
        <div><span>주소:</span> ${escapeHtml(item.ADDR1 || "")}</div>
        <div><span>메뉴:</span> ${escapeHtml(item.RPRSNTV_MENU || "정보 없음")}</div>
      </div>
    `;

    li.addEventListener("click", () => {
      document
        .querySelectorAll(".restaurant-item")
        .forEach((el) => el.classList.remove("active"));
      li.classList.add("active");
      showDetail(item);
    });

    restaurantListEl.appendChild(li);
  });
}

function updatePagination() {
  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / rowsPerPage)
  );
  pageInfoEl.textContent = `${currentPage} / ${totalPages}`;
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;
}

// ---------------------- 검색 필터 ------------------------

function applyFilter() {
  const keyword = keywordInput.value.trim();
  if (!keyword) {
    filteredItems = [...rawItems];
  } else {
    const lower = keyword.toLowerCase();
    filteredItems = rawItems.filter((item) => {
      const title = (item.MAIN_TITLE || "").toLowerCase();
      const menu = (item.RPRSNTV_MENU || "").toLowerCase();
      return title.includes(lower) || menu.includes(lower);
    });
  }
  currentPage = 1;
  renderList();
  updatePagination();
}

// ---------------------- 상세 뷰 ------------------------

function showDetail(item) {
  detailPlaceholderEl.style.display = "none";
  detailViewEl.classList.remove("hidden");

  const title = item.MAIN_TITLE || "";
  const address = item.ADDR1 || "";
  const desc = (item.ITEMCNTNTS || "").trim();
  const menu = item.RPRSNTV_MENU || "";
  const tel = item.CNTCT_TEL || "";
  const time = item.USAGE_DAY_WEEK_AND_TIME || "";
  const homepage = (item.HOMEPAGE_URL || "").trim();
  const lat = parseFloat(item.LAT);
  const lng = parseFloat(item.LNG);

  // 이미지 URL
  let imageUrl = item.MAIN_IMG_NORMAL || item.MAIN_IMG_THUMB || "";
  if (imageUrl && imageUrl.startsWith("/")) {
    imageUrl = "https://www.visitbusan.net" + imageUrl;
  }

  detailImageEl.src = imageUrl || "";
  detailImageEl.alt = title || "맛집 대표 이미지";

  detailTitleEl.textContent = title;
  detailAddressEl.textContent = address;
  detailDescEl.textContent = desc || "상세 설명 정보가 없습니다.";
  detailMenuEl.textContent = menu || "대표 메뉴 정보가 없습니다.";
  detailTelEl.textContent = tel || "문의 전화 정보가 없습니다.";
  detailTimeEl.textContent = time || "운영 시간 정보가 없습니다.";

  if (homepage) {
    detailHomepageEl.href = homepage;
    detailHomepageEl.style.display = "inline-flex";
    noHomepageBarEl.style.display = "none";
  } else {
    detailHomepageEl.style.display = "none";
    noHomepageBarEl.style.display = "inline-flex";
  }

  // 카카오맵 업데이트
  if (!isNaN(lat) && !isNaN(lng)) {
    renderMap(lat, lng, title);
  }
}

// ---------------------- 카카오맵 ------------------------

function renderMap(lat, lng, title) {
  const container = document.getElementById("map");
  const position = new kakao.maps.LatLng(lat, lng);

  if (!kakaoMap) {
    kakaoMap = new kakao.maps.Map(container, {
      center: position,
      level: 3
    });
    kakaoMarker = new kakao.maps.Marker({
      position,
      map: kakaoMap
    });
  } else {
    kakaoMap.setCenter(position);
    kakaoMarker.setPosition(position);
  }

  const iwContent = `<div style="padding:5px 10px;font-size:12px;">${title}</div>`;
  const infowindow = new kakao.maps.InfoWindow({
    content: iwContent
  });
  infowindow.open(kakaoMap, kakaoMarker);
}

// ---------------------- 유틸 ------------------------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---------------------- 이벤트 바인딩 ------------------------

keywordInput.addEventListener("input", () => {
  applyFilter();
});

prevPageBtn.addEventListener("click", () => {
  if (currentPage <= 1) return;
  currentPage -= 1;
  renderList();
  updatePagination();
});

nextPageBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredItems.length / rowsPerPage);
  if (currentPage >= totalPages) return;
  currentPage += 1;
  renderList();
  updatePagination();
});

// ---------------------- 초기 실행 ------------------------

window.addEventListener("load", () => {
  fetchRestaurants().catch((e) => {
    console.error("API 호출 오류", e);
    restaurantListEl.innerHTML =
      '<li class="restaurant-item">데이터를 불러오지 못했습니다.</li>';
  });
});
