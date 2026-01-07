// ====== CONFIG ======
const PUBLIC_DATA_API_KEY =
  "37441f86a6fdf7eed59e7a176e50c990c64d651d3fb878215ba1972265e1028a";

// TODO: 실제로 사용할 실거래가 서비스 URL 로 교체
// 예: 국토부 아파트 매매 실거래: https://apis.data.go.kr/1613000/AptTradeService/getRTMSDataSvcAptTrade
const REAL_ESTATE_API_URL =
  "https://apis.data.go.kr/PUT_YOUR_REAL_ESTATE_SERVICE_HERE";

// ====== STATE ======
let map;
let mapMarkers = [];
let deals = [];
let currentPage = 1;
let isLoading = false;
let currentFilters = {
  dealType: "sale", // sale | jeonse | rent
  periodMonths: 3, // 3 | 6 | 12
  keyword: "",
  sort: "recent",
  lat: null,
  lng: null,
};

// ====== DOM ======
const loadingOverlay = document.getElementById("loading-overlay");
const dealListEl = document.getElementById("deal-list");
const summaryCountEl = document.getElementById("summary-count");
const summaryPriceRangeEl = document.getElementById("summary-price-range");
const keywordInput = document.getElementById("keyword-input");
const btnClearKeyword = document.getElementById("btn-clear-keyword");
const btnSearch = document.getElementById("btn-search");
const btnLoadMore = document.getElementById("btn-load-more");
const sortSelect = document.getElementById("sort-select");
const btnRefreshLocation = document.getElementById("btn-refresh-location");
const currentLocationLabel = document.getElementById(
  "current-location-label"
);
const btnFitMarkers = document.getElementById("btn-fit-markers");
const toastEl = document.getElementById("toast");

// ====== UTILS ======
function showLoading(show) {
  isLoading = show;
  if (show) {
    loadingOverlay.classList.add("show");
  } else {
    loadingOverlay.classList.remove("show");
  }
}

function showToast(message, duration = 2000) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  setTimeout(() => {
    toastEl.classList.remove("show");
  }, duration);
}

function formatPriceKRW(value) {
  if (!value && value !== 0) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  if (num >= 10000) {
    const eok = Math.floor(num / 10000);
    const man = num % 10000;
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만` : `${eok}억`;
  }
  return `${num.toLocaleString()}만`;
}

function formatArea(area) {
  if (!area) return "-";
  return `${Number(area).toFixed(1)}㎡`;
}

function getDealTypeLabel(type) {
  switch (type) {
    case "sale":
      return "매매";
    case "jeonse":
      return "전세";
    case "rent":
      return "월세";
    default:
      return type;
  }
}

function computeSummary(deals) {
  if (!deals.length) {
    summaryCountEl.textContent = "실거래 0건";
    summaryPriceRangeEl.textContent = "가격 범위 -";
    return;
  }
  const prices = deals
    .map((d) => d.price)
    .filter((p) => typeof p === "number" && !Number.isNaN(p));
  if (!prices.length) {
    summaryCountEl.textContent = `실거래 ${deals.length}건`;
    summaryPriceRangeEl.textContent = "가격 범위 -";
    return;
  }
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  summaryCountEl.textContent = `실거래 ${deals.length}건`;
  summaryPriceRangeEl.textContent = `가격 범위 ${formatPriceKRW(
    min
  )} ~ ${formatPriceKRW(max)}`;
}

// ====== 공공데이터 API 연동 ======

async function fetchDealsFromApi(page = 1) {
  // 실제 사용하는 서비스에 따라 파라미터 구조 변경 필요
  // 여기서는 대표적인 형태 예시
  const now = new Date();
  const past = new Date();
  past.setMonth(now.getMonth() - currentFilters.periodMonths);

  const dealYmdFrom = `${past.getFullYear()}${String(
    past.getMonth() + 1
  ).padStart(2, "0")}01`;

  // 실거래 API가 보통 region (법정동 코드) 기반이므로,
  // 키워드는 서버 쪽에서 동코드 매핑하거나, 프런트에서 동코드 API를 한 번 더 호출해서 변환하는 식으로 구성.
  // 여기서는 keyword를 단순히 그대로 넘긴다는 가정으로 예시 작성.
  const params = new URLSearchParams({
    serviceKey: PUBLIC_DATA_API_KEY,
    pageNo: String(page),
    numOfRows: "30",
    // API 스펙에 맞게 필드명 교체 필요
    LAWD_CD: "", // 법정동 코드 (TODO)
    DEAL_YMD: dealYmdFrom.slice(0, 6), // 예: 202601
  });

  const url = `${REAL_ESTATE_API_URL}?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("실거래 API 호출 실패");
  }

  const text = await response.text();

  // 공공데이터포털은 XML을 반환하는 경우가 많음.
  // XML → JS object 파싱은 실제 서비스에서 DOMParser 등을 사용해서 구현.
  // 여기서는 샘플을 위해 가공된 JSON 형태라고 가정하고 parseDealsFromApi() 예시를 만든다.
  // const xmlDoc = new DOMParser().parseFromString(text, "text/xml");
  // TODO: xmlDoc 에서 items 파싱 후 deals 배열로 변환

  // ===== 샘플 MOCK (실제 구현 시 위 XML 파싱으로 대체) =====
  const mockDeals = [
    {
      id: `mock-${page}-1`,
      aptName: "샘플자이아파트",
      address: "서울특별시 강남구 역삼동 123-4",
      dealType: currentFilters.dealType,
      price: 135000, // 만원 단위
      area: 84.97,
      floor: 15,
      tradeDate: "2026-01-01",
      lat: currentFilters.lat || 37.4979,
      lng: currentFilters.lng || 127.0276,
    },
    {
      id: `mock-${page}-2`,
      aptName: "샘플래미안",
      address: "서울특별시 강남구 역삼동 567-8",
      dealType: currentFilters.dealType,
      price: 98000,
      area: 59.83,
      floor: 7,
      tradeDate: "2025-12-20",
      lat: (currentFilters.lat || 37.4979) + 0.002,
      lng: (currentFilters.lng || 127.0276) + 0.002,
    },
  ];

  return mockDeals;
}

// XML/JSON → 내부 공통 포맷
// 실제로는 API 스펙에 맞게 필드를 맵핑해주면 된다.
function parseDealsFromApi(apiDeals) {
  return apiDeals.map((d) => ({
    id: d.id,
    aptName: d.aptName,
    address: d.address,
    dealType: d.dealType,
    price: Number(d.price),
    area: Number(d.area),
    floor: d.floor,
    tradeDate: d.tradeDate,
    lat: d.lat,
    lng: d.lng,
  }));
}

// ====== Kakao Map ======
function initMap() {
  const container = document.getElementById("map");
  const options = {
    center: new kakao.maps.LatLng(37.5665, 126.978),
    level: 5,
  };
  map = new kakao.maps.Map(container, options);
}

function clearMarkers() {
  mapMarkers.forEach((m) => m.setMap(null));
  mapMarkers = [];
}

function renderMarkers(dealsToShow) {
  if (!map) return;
  clearMarkers();
  if (!dealsToShow.length) return;

  const bounds = new kakao.maps.LatLngBounds();

  dealsToShow.forEach((deal) => {
    if (!deal.lat || !deal.lng) return;
    const position = new kakao.maps.LatLng(deal.lat, deal.lng);
    const marker = new kakao.maps.Marker({
      position,
      map,
    });
    bounds.extend(position);

    const content = `
      <div style="
        padding:6px 10px;
        border-radius:999px;
        background:rgba(15,23,42,0.95);
        border:1px solid rgba(56,189,248,0.7);
        color:#e5e7eb;
        font-size:11px;
        white-space:nowrap;
      ">
        ${deal.aptName} · ${formatPriceKRW(deal.price)}
      </div>
    `;
    const overlay = new kakao.maps.CustomOverlay({
      position,
      content,
      yAnchor: 1.2,
    });

    kakao.maps.event.addListener(marker, "mouseover", () =>
      overlay.setMap(map)
    );
    kakao.maps.event.addListener(marker, "mouseout", () =>
      overlay.setMap(null)
    );

    mapMarkers.push(marker);
  });

  if (!bounds.isEmpty()) {
    map.setBounds(bounds, 30);
  }
}

function fitMarkersToBounds() {
  if (!map || !mapMarkers.length) return;
  const bounds = new kakao.maps.LatLngBounds();
  mapMarkers.forEach((m) => bounds.extend(m.getPosition()));
  if (!bounds.isEmpty()) {
    map.setBounds(bounds, 30);
  }
}

// ====== RENDER LIST ======

function renderDealList() {
  dealListEl.innerHTML = "";

  // 정렬
  let sorted = [...deals];
  switch (currentFilters.sort) {
    case "price-desc":
      sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      break;
    case "price-asc":
      sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      break;
    case "area-desc":
      sorted.sort((a, b) => (b.area || 0) - (a.area || 0));
      break;
    case "recent":
    default:
      sorted.sort(
        (a, b) => new Date(b.tradeDate) - new Date(a.tradeDate)
      );
  }

  sorted.forEach((deal) => {
    const card = document.createElement("article");
    card.className = "deal-card";
    card.dataset.id = deal.id;

    card.innerHTML = `
      <div class="deal-header">
        <div class="deal-title">${deal.aptName || "-"}</div>
        <div class="deal-badge">${getDealTypeLabel(deal.dealType)}</div>
      </div>
      <div class="deal-meta">
        <span>${deal.address || "-"}</span>
        <span>전용 ${formatArea(deal.area)}</span>
        <span>${deal.floor ? deal.floor + "층" : ""}</span>
        <span>${deal.tradeDate || ""}</span>
      </div>
      <div class="deal-price-row">
        <span class="deal-price">${formatPriceKRW(
          deal.price
        )}</span>
        <span class="deal-sub-info">클릭 시 지도에서 위치 강조</span>
      </div>
    `;

    card.addEventListener("click", () => {
      focusDealOnMap(deal);
    });

    dealListEl.appendChild(card);
  });

  computeSummary(sorted);
  renderMarkers(sorted);
}

function focusDealOnMap(deal) {
  if (!map || !deal.lat || !deal.lng) return;

  const position = new kakao.maps.LatLng(deal.lat, deal.lng);
  map.setLevel(4);
  map.panTo(position);

  const content = `
    <div style="
      padding:8px 12px;
      border-radius:10px;
      background:rgba(15,23,42,0.98);
      border:1px solid rgba(56,189,248,0.8);
      color:#e5e7eb;
      font-size:11px;
      min-width:160px;
    ">
      <strong style="font-size:12px;">${deal.aptName}</strong>
      <div style="margin-top:3px;">${deal.address}</div>
      <div style="margin-top:3px;">실거래가 ${formatPriceKRW(
        deal.price
      )}</div>
      <div style="margin-top:3px;">전용 ${formatArea(
        deal.area
      )} · ${deal.floor || "-"}층</div>
      <div style="margin-top:3px; color:#9ca3af;">${deal.tradeDate}</div>
    </div>
  `;
  const overlay = new kakao.maps.CustomOverlay({
    position,
    content,
    yAnchor: 1.2,
  });

  overlay.setMap(map);
  setTimeout(() => overlay.setMap(null), 3000);
}

// ====== LOCATION ======

function getCurrentPosition() {
  if (!navigator.geolocation) {
    showToast("브라우저에서 위치 정보를 지원하지 않는다.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      currentFilters.lat = latitude;
      currentFilters.lng = longitude;

      currentLocationLabel.textContent = `현 위치: ${latitude.toFixed(
        4
      )}, ${longitude.toFixed(4)}`;

      if (map) {
        const center = new kakao.maps.LatLng(latitude, longitude);
        map.setCenter(center);
        map.setLevel(5);
      }
    },
    () => {
      currentLocationLabel.textContent = "위치를 가져올 수 없다.";
      showToast("위치 권한을 허용하면 주변 실거래를 보여줄 수 있다.");
    }
  );
}

// ====== MAIN FLOW ======

async function loadDeals(reset = false) {
  if (isLoading) return;
  showLoading(true);

  try {
    const pageToLoad = reset ? 1 : currentPage + 1;
    const apiDeals = await fetchDealsFromApi(pageToLoad);
    const parsed = parseDealsFromApi(apiDeals);

    if (reset) {
      deals = parsed;
      currentPage = 1;
    } else {
      deals = [...deals, ...parsed];
      currentPage = pageToLoad;
    }

    renderDealList();
  } catch (e) {
    console.error(e);
    showToast("실거래 데이터를 불러오는 중 문제가 발생했다.");
  } finally {
    showLoading(false);
  }
}

// ====== EVENT BINDINGS ======

function bindFilterChips() {
  // 거래유형
  const dealTypeGroup = document.getElementById("deal-type-group");
  dealTypeGroup.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    dealTypeGroup
      .querySelectorAll(".chip")
      .forEach((c) => c.classList.remove("chip-active"));
    btn.classList.add("chip-active");
    currentFilters.dealType = btn.dataset.value;
    loadDeals(true);
  });

  // 기간
  const periodGroup = document.getElementById("period-group");
  periodGroup.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    periodGroup
      .querySelectorAll(".chip")
      .forEach((c) => c.classList.remove("chip-active"));
    btn.classList.add("chip-active");
    currentFilters.periodMonths = Number(btn.dataset.value);
    loadDeals(true);
  });

  // 정렬
  sortSelect.addEventListener("change", () => {
    currentFilters.sort = sortSelect.value;
    renderDealList();
  });
}

function bindSearch() {
  btnSearch.addEventListener("click", () => {
    currentFilters.keyword = keywordInput.value.trim();
    loadDeals(true);
  });

  keywordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      currentFilters.keyword = keywordInput.value.trim();
      loadDeals(true);
    }
  });

  btnClearKeyword.addEventListener("click", () => {
    keywordInput.value = "";
    currentFilters.keyword = "";
    loadDeals(true);
  });
}

function bindOthers() {
  btnLoadMore.addEventListener("click", () => {
    loadDeals(false);
  });

  btnRefreshLocation.addEventListener("click", () => {
    getCurrentPosition();
  });

  btnFitMarkers.addEventListener("click", () => {
    fitMarkersToBounds();
  });
}

// ====== INIT ======

window.addEventListener("DOMContentLoaded", () => {
  initMap();
  bindFilterChips();
  bindSearch();
  bindOthers();
  getCurrentPosition();
  loadDeals(true); // 초기 로딩
});
