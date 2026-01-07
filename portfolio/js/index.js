// ===== 기본 설정 =====
const END_POINT = "https://apis.data.go.kr/B551011/KorPetTourService";
const SERVICE_KEY_RAW =
  "37441f86a6fdf7eed59e7a176e50c990c64d651d3fb878215ba1972265e1028a";
const SERVICE_KEY = encodeURIComponent(SERVICE_KEY_RAW);

const COMMON_PARAMS = {
  MobileOS: "ETC",
  MobileApp: "PetTourWeb",
  _type: "json",
};

const PAGE_SIZE = 100; // 전국 전체 다 가져오기 위해 페이지당 최대치로

// 상태
const STATE = {
  items: [],
  areaCode: "",
  categoryCode: "",
  keyword: "",
  tabType: "all",
  mode: "area", // area | nearby
};

let currentRequestId = 0;

// ===== DOM =====
const selArea = document.getElementById("selArea");
const selCategory = document.getElementById("selCategory");
const iptKeyword = document.getElementById("iptKeyword");
const btnSearch = document.getElementById("btnSearch");
const btnNearby = document.getElementById("btnNearby");
const btnReset = document.getElementById("btnReset");
const listSkeleton = document.getElementById("listSkeleton");
const listContainer = document.getElementById("listContainer");
const txtCount = document.getElementById("txtCount");
const txtQueryState = document.getElementById("txtQueryState");
const chipRow = document.getElementById("chipRow");

const detailModal = document.getElementById("detailModal");
const btnModalClose = document.getElementById("btnModalClose");
const modalBody = document.getElementById("modalBody");

// ===== Kakao Map & Clusterer =====
let map;
let markers = [];
let clusterer;
let activeContentId = null;

// ===== URL 빌더 =====
function buildUrl(path, extraParams = {}) {
  const url = new URL(`${END_POINT}/${path}`);
  url.searchParams.set("serviceKey", SERVICE_KEY);

  Object.entries(COMMON_PARAMS).forEach(([k, v]) =>
    url.searchParams.set(k, v)
  );
  Object.entries(extraParams).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, v);
    }
  });

  return url.toString();
}

// ===== 공통 Fetch =====
async function fetchTour(path, params = {}) {
  const url = buildUrl(path, params);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API 오류 (${res.status})`);
  }
  const data = await res.json();
  const body = data.response && data.response.body;

  if (!body || !body.items || !body.items.item) {
    return {
      items: [],
      totalCount: body ? body.totalCount || 0 : 0,
    };
  }

  const item = body.items.item;
  const itemsArray = Array.isArray(item) ? item : [item];

  return {
    items: itemsArray,
    totalCount: body.totalCount || itemsArray.length,
  };
}

// ===== 전국 전체 페이지 한 번에 가져오기 =====
async function fetchAllPages(path, baseParams, requestId) {
  const all = [];

  // 1페이지
  const first = await fetchTour(path, {
    ...baseParams,
    numOfRows: PAGE_SIZE,
    pageNo: 1,
  });
  if (requestId !== currentRequestId) return [];

  all.push(...first.items);
  const totalCount = first.totalCount || first.items.length;
  const maxPage = Math.ceil(totalCount / PAGE_SIZE);

  // 2페이지 이후
  for (let page = 2; page <= maxPage; page++) {
    if (requestId !== currentRequestId) break;
    const res = await fetchTour(path, {
      ...baseParams,
      numOfRows: PAGE_SIZE,
      pageNo: page,
    });
    all.push(...res.items);
  }

  return all;
}

// ===== 로딩 표시 =====
function setLoading(isLoading, message = "") {
  if (isLoading) {
    listSkeleton.style.display = "block";
    txtQueryState.textContent = message || "검색 중…";
  } else {
    listSkeleton.style.display = "none";
    if (!STATE.items.length) {
      txtQueryState.textContent = "결과 없음";
    } else {
      txtQueryState.textContent = "완료";
    }
  }
}

// ===== 카카오맵 초기화 =====
function initMap() {
  const container = document.getElementById("map");
  const options = {
    center: new kakao.maps.LatLng(36.5, 127.8),
    level: 13,
  };
  map = new kakao.maps.Map(container, options);

  clusterer = new kakao.maps.MarkerClusterer({
    map,
    averageCenter: true,
    minLevel: 7,
    disableClickZoom: false,
  });
}

function clearMarkers() {
  if (clusterer) clusterer.clear();
  markers.forEach((m) => m.setMap(null));
  markers = [];
}

function setActiveCard(contentId) {
  activeContentId = String(contentId);
  document.querySelectorAll(".card").forEach((card) => {
    card.classList.toggle("card-active", card.dataset.id === activeContentId);
  });
}

function renderMarkers(items) {
  clearMarkers();
  if (!items.length) return;

  const bounds = new kakao.maps.LatLngBounds();

  items.forEach((item) => {
    const mapx = parseFloat(item.mapx);
    const mapy = parseFloat(item.mapy);
    if (!mapx || !mapy) return;

    const pos = new kakao.maps.LatLng(mapy, mapx);
    bounds.extend(pos);

    const marker = new kakao.maps.Marker({ position: pos });
    marker.contentId = item.contentid;

    kakao.maps.event.addListener(marker, "click", () => {
      setActiveCard(marker.contentId);
      focusOnMarker(marker);
      if (item.title) {
        const iw = new kakao.maps.InfoWindow({
          content: `<div style="padding:6px 10px;font-size:12px;">${item.title}</div>`,
          removable: true,
        });
        iw.open(map, marker);
      }
    });

    markers.push(marker);
  });

  clusterer.addMarkers(markers);
  if (!bounds.isEmpty()) map.setBounds(bounds);
}

function focusOnMarker(marker) {
  map.panTo(marker.getPosition());
}

function focusMarkerByContentId(contentId) {
  const marker = markers.find((m) => String(m.contentId) === String(contentId));
  if (marker) focusOnMarker(marker);
}

// ===== 리스트 렌더링 (chunk) =====
function renderList(items) {
  listContainer.innerHTML = "";
  txtCount.textContent = `${items.length}곳`;

  if (!items.length) {
    listContainer.innerHTML =
      '<p style="font-size:0.82rem;color:#9ca3af;padding:6px;">조건에 맞는 여행지가 없습니다.</p>';
    return;
  }

  const chunkSize = 30;
  let index = 0;

  function renderChunk() {
    const fragment = document.createDocumentFragment();
    let rendered = 0;

    while (index < items.length && rendered < chunkSize) {
      const item = items[index];
      const card = createCardElement(item);
      fragment.appendChild(card);
      index++;
      rendered++;
    }

    listContainer.appendChild(fragment);

    if (index < items.length) {
      requestAnimationFrame(renderChunk);
    }
  }

  requestAnimationFrame(renderChunk);
}

function createCardElement(item) {
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.id = item.contentid;

  const thumb = document.createElement("div");
  thumb.className = "card-thumb";
  const thumbUrl = item.firstimage || item.firstimage2 || "";
  if (thumbUrl) thumb.style.backgroundImage = `url('${thumbUrl}')`;

  const body = document.createElement("div");
  body.className = "card-body";

  const titleRow = document.createElement("div");
  titleRow.className = "card-title-row";

  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = item.title || "이름 미제공";

  const badge = document.createElement("span");
  badge.className = "card-badge";
  badge.textContent =
    item.cat3name || item.cat2name || item.cat1name || "반려동물 동반";

  titleRow.appendChild(title);
  titleRow.appendChild(badge);

  const meta = document.createElement("div");
  meta.className = "card-meta";

  const addr = item.addr1 || item.addr2 || "";
  if (addr) {
    const spanAddr = document.createElement("span");
    spanAddr.textContent = addr;
    meta.appendChild(spanAddr);
  }

  const petInfo = item.petinfony || item.petInfo || "";
  if (petInfo) {
    const spanPet = document.createElement("span");
    spanPet.textContent = `동반 조건: ${petInfo}`;
    meta.appendChild(spanPet);
  }

  const tags = document.createElement("div");
  tags.className = "card-tags";

  const tagPet = document.createElement("span");
  tagPet.className = "tag";
  tagPet.textContent = "반려동물 동반";
  tags.appendChild(tagPet);

  if (item.distance) {
    const t = document.createElement("span");
    t.className = "tag";
    t.textContent = `${item.distance}km`;
    tags.appendChild(t);
  }

  body.appendChild(titleRow);
  body.appendChild(meta);
  body.appendChild(tags);

  card.appendChild(thumb);
  card.appendChild(body);

  card.addEventListener("click", () => {
    setActiveCard(item.contentid);
    focusMarkerByContentId(item.contentid);
    openDetail(item.contentid, item.contenttypeid);
  });

  return card;
}

// ===== 상세 정보 모달 =====
async function openDetail(contentId, contentTypeId) {
  try {
    modalBody.innerHTML =
      '<p style="font-size:0.82rem;color:#9ca3af;">상세 정보 로딩 중…</p>';
    detailModal.classList.remove("hidden");

    const [commonRes, introRes, imageRes] = await Promise.all([
      fetchTour("detailCommon", {
        contentId,
        contentTypeId,
        defaultYN: "Y",
        firstImageYN: "Y",
        addrinfoYN: "Y",
        mapinfoYN: "Y",
        overviewYN: "Y",
      }),
      fetchTour("detailIntro", {
        contentId,
        contentTypeId,
      }),
      fetchTour("detailImage", {
        contentId,
        imageYN: "Y",
        subImageYN: "Y",
      }),
    ]);

    const common = commonRes.items[0] || {};
    const intro = introRes.items[0] || {};
    const images = imageRes.items
      .map((i) => i.originimgurl || i.smallimageurl)
      .filter(Boolean)
      .slice(0, 5);

    const mainImg = common.firstimage || common.firstimage2 || "";

    modalBody.innerHTML = `
      <h2>${common.title || "상세 정보"}</h2>
      ${
        mainImg
          ? `<div style="margin-bottom:8px;">
              <img src="${mainImg}" style="width:100%;max-height:230px;border-radius:16px;object-fit:cover;" />
            </div>`
          : ""
      }
      <p style="font-size:0.86rem;color:#cbd5f5;line-height:1.6;margin-bottom:10px;">
        ${common.overview || "상세 설명이 제공되지 않았습니다."}
      </p>
      <div style="font-size:0.8rem;color:#9ca3af;margin-bottom:8px;">
        ${
          common.addr1
            ? `<div><strong>주소</strong> : ${common.addr1} ${
                common.addr2 || ""
              }</div>`
            : ""
        }
        ${
          intro.usetime
            ? `<div><strong>이용시간</strong> : ${intro.usetime}</div>`
            : ""
        }
        ${
          intro.restdate
            ? `<div><strong>휴무일</strong> : ${intro.restdate}</div>`
            : ""
        }
        ${
          intro.parking
            ? `<div><strong>주차</strong> : ${intro.parking}</div>`
            : ""
        }
      </div>
      ${
        images.length
          ? `<div style="margin-top:4px;">
              <strong style="font-size:0.8rem;color:#e5e7eb;">추가 이미지</strong>
              <div style="display:flex;gap:6px;margin-top:4px;overflow-x:auto;">
                ${images
                  .map(
                    (src) =>
                      `<img src="${src}" style="width:90px;height:70px;border-radius:10px;object-fit:cover;flex-shrink:0;" />`
                  )
                  .join("")}
              </div>
            </div>`
          : ""
      }
    `;
  } catch {
    modalBody.innerHTML =
      '<p style="font-size:0.82rem;color:#9ca3af;">상세 정보를 불러오지 못했습니다.</p>';
  }
}

// ===== 카테고리(숙소/카페/공원산책) 파라미터 =====
function buildCategoryParamsByTab(tabType) {
  const params = {};
  switch (tabType) {
    case "stay":
      params.contentTypeId = 32; // 숙박
      break;
    case "cafe":
      params.cat3 = "A05020900"; // 카페
      break;
    case "park":
      params.cat2 = "A0202"; // 공원/자연
      break;
    default:
      break;
  }
  return params;
}

// ===== 지역/분류 코드 로딩 =====
async function loadAreas() {
  try {
    const { items } = await fetchTour("areaCode", {
      numOfRows: 50,
      pageNo: 1,
    });
    items.forEach((area) => {
      const opt = document.createElement("option");
      opt.value = area.code;
      opt.textContent = area.name;
      selArea.appendChild(opt);
    });
  } catch {}
}

async function loadCategories() {
  try {
    const { items } = await fetchTour("categoryCode", {
      numOfRows: 100,
      pageNo: 1,
    });
    items.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.code;
      opt.textContent = cat.name;
      selCategory.appendChild(opt);
    });
  } catch {}
}

// ===== 현재 위치 =====
function getCurrentPositionPromise() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("지원 안함");
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 8000,
    });
  });
}

// ===== 검색 실행 =====
async function runSearch() {
  const requestId = ++currentRequestId;

  STATE.areaCode = selArea.value;
  STATE.categoryCode = selCategory.value;
  STATE.keyword = iptKeyword.value.trim();

  setLoading(
    true,
    STATE.mode === "nearby" ? "내 주변 여행지 검색 중…" : "검색 중…"
  );
  listContainer.innerHTML = "";
  txtCount.textContent = "0곳";

  try {
    let items = [];

    if (STATE.mode === "nearby") {
      const pos = await getCurrentPositionPromise();
      if (requestId !== currentRequestId) return;

      const baseParams = {
        arrange: "E",
        mapX: pos.coords.longitude,
        mapY: pos.coords.latitude,
        radius: 20000,
      };
      items = await fetchAllPages("locationBasedList", baseParams, requestId);
    } else {
      const catParams = buildCategoryParamsByTab(STATE.tabType);
      const baseParams = {
        arrange: "E",
        areaCode: STATE.areaCode || "",
        keyword: STATE.keyword || "",
        ...catParams,
      };
      items = await fetchAllPages("areaBasedList", baseParams, requestId);
    }

    if (requestId !== currentRequestId) return;

    STATE.items = items;
    renderList(STATE.items);
    renderMarkers(STATE.items);
    setLoading(false);
  } catch (err) {
    if (requestId !== currentRequestId) return;
    setLoading(false);
    listContainer.innerHTML =
      '<p style="font-size:0.82rem;color:#f97373;padding:6px;">데이터 조회 중 문제가 발생했습니다.</p>';
    txtCount.textContent = "0곳";
  }
}

// ===== 이벤트 =====
function setChipActive(type) {
  chipRow.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.toggle("chip-active", chip.dataset.type === type);
  });
}

function bindEvents() {
  btnSearch.addEventListener("click", () => {
    STATE.mode = "area";
    runSearch();
  });

  iptKeyword.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      STATE.mode = "area";
      runSearch();
    }
  });

  btnNearby.addEventListener("click", () => {
    STATE.mode = "nearby";
    runSearch();
  });

  btnReset.addEventListener("click", () => {
    selArea.value = "";
    selCategory.value = "";
    iptKeyword.value = "";
    STATE.tabType = "all";
    STATE.mode = "area";
    setChipActive("all");
    runSearch();
  });

  chipRow.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const type = chip.dataset.type;
      STATE.tabType = type;
      STATE.mode = "area";
      setChipActive(type);
      runSearch();
    });
  });

  btnModalClose.addEventListener("click", () => {
    detailModal.classList.add("hidden");
  });
  detailModal.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-backdrop")) {
      detailModal.classList.add("hidden");
    }
  });
}

// ===== 초기화 =====
window.addEventListener("DOMContentLoaded", async () => {
  initMap();
  bindEvents();
  await Promise.all([loadAreas(), loadCategories()]);
  STATE.mode = "area";
  runSearch();
});
