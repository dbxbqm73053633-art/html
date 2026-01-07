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

// 상태
const STATE = {
  items: [],
  pageNo: 1,
  hasMore: true,
  areaCode: "",
  categoryCode: "",
  keyword: "",
  tabType: "all",
  mode: "area", // "area" | "nearby"
};

let currentRequestId = 0;

// ===== DOM =====
const selArea = document.getElementById("selArea");
const selCategory = document.getElementById("selCategory");
const iptKeyword = document.getElementById("iptKeyword");
const btnSearch = document.getElementById("btnSearch");
const btnNearby = document.getElementById("btnNearby");
const btnReset = document.getElementById("btnReset");
const btnLoadMore = document.getElementById("btnLoadMore");
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
    center: new kakao.maps.LatLng(36.5, 127.8), // 대한민국 중간쯤
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
  if (clusterer) {
    clusterer.clear();
  }
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

  const kakaoBounds = new kakao.maps.LatLngBounds();

  items.forEach((item) => {
    const mapx = parseFloat(item.mapx);
    const mapy = parseFloat(item.mapy);
    if (!mapx || !mapy) return;

    const position = new kakao.maps.LatLng(mapy, mapx);
    kakaoBounds.extend(position);

    const marker = new kakao.maps.Marker({
      position,
    });

    marker.contentId = item.contentid;

    kakao.maps.event.addListener(marker, "click", () => {
      setActiveCard(marker.contentId);
      focusOnMarker(marker);
      if (item.title) {
        const info = new kakao.maps.InfoWindow({
          content: `<div style="padding:6px 10px;font-size:12px;">${item.title}</div>`,
          removable: true,
        });
        info.open(map, marker);
      }
    });

    markers.push(marker);
  });

  clusterer.addMarkers(markers);

  if (!kakaoBounds.isEmpty()) {
    map.setBounds(kakaoBounds);
  }
}

function focusOnMarker(marker) {
  map.panTo(marker.getPosition());
}

function focusMarkerByContentId(contentId) {
  const marker = markers.find((m) => String(m.contentId) === String(contentId));
  if (marker) {
    focusOnMarker(marker);
  }
}

// ===== 리스트 렌더링 (Chunk 단위로 성능 최적화) =====
function renderList(items, append = false) {
  if (!append) {
    listContainer.innerHTML = "";
  }

  txtCount.textContent = `${items.length}곳`;

  if (!items.length) {
    listContainer.innerHTML =
      '<p style="font-size:0.82rem;color:#9ca3af;padding:6px;">조건에 맞는 여행지가 없습니다.</p>';
    return;
  }

  const chunkSize = 20;
  let index = append ? listContainer.childElementCount : 0;

  function renderChunk() {
    const fragment = document.createDocumentFragment();
    let rendered = 0;

    while (index < items.length && rendered < chunkSize) {
      const item = items[index];
      const card = createCardElement(item);
      fragment.appendChild(card);
      index += 1;
      rendered += 1;
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
  if (thumbUrl) {
    thumb.style.backgroundImage = `url('${thumbUrl}')`;
  }

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

  // 카드 클릭 -> 마커 포커스 + 상세 모달
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
  } catch (err) {
    modalBody.innerHTML =
      '<p style="font-size:0.82rem;color:#9ca3af;">상세 정보를 불러오지 못했습니다.</p>';
  }
}

// ===== 필터 로딩 (지역/분류) =====
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
  } catch {
    // 무시
  }
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
  } catch {
    // 무시
  }
}

// ===== 검색 실행 (전국/필터 검색) =====
async function runSearch(isLoadMore = false) {
  const requestId = ++currentRequestId;

  if (!isLoadMore) {
    // 새 검색 시작
    STATE.pageNo = 1;
    STATE.items = [];
    STATE.hasMore = true;
  }

  STATE.areaCode = selArea.value;
  STATE.categoryCode = selCategory.value;
  STATE.keyword = iptKeyword.value.trim();

  setLoading(true, STATE.mode === "nearby" ? "내 주변 검색 중…" : "검색 중…");
  if (!isLoadMore) {
    listContainer.innerHTML = "";
    txtCount.textContent = "0곳";
  }
  btnLoadMore.classList.add("hidden");

  try {
    let path;
    let params;

    if (STATE.mode === "nearby") {
      // 위치기반 관광정보조회
      const pos = await getCurrentPositionPromise();
      path = "locationBasedList";
      params = {
        numOfRows: 30,
        pageNo: STATE.pageNo,
        arrange: "E",
        mapX: pos.coords.longitude,
        mapY: pos.coords.latitude,
        radius: 20000, // 20km
      };
    } else {
      // 전국/지역 기반 관광정보조회 (반려동물 동반)
      path = "areaBasedList";
      params = {
        numOfRows: 50,
        pageNo: STATE.pageNo,
        arrange: "E",
        areaCode: STATE.areaCode || "",
        cat1: STATE.categoryCode || "",
        keyword: STATE.keyword || "",
      };
    }

    const { items, totalCount } = await fetchTour(path, params);

    // 이전 요청이면 버림
    if (requestId !== currentRequestId) return;

    // 탭 필터 (숙소/카페/공원…) – 실제 cat2/3 기준으로 조정 가능
    let filtered = items;
    if (STATE.tabType === "stay") {
      filtered = filtered.filter((i) => (i.cat2name || "").includes("숙박"));
    } else if (STATE.tabType === "cafe") {
      filtered = filtered.filter((i) => (i.cat3name || "").includes("카페"));
    } else if (STATE.tabType === "park") {
      filtered = filtered.filter((i) => (i.cat2name || "").includes("공원"));
    }

    if (isLoadMore) {
      STATE.items = STATE.items.concat(filtered);
    } else {
      STATE.items = filtered;
    }

    // 전체 개수/페이지 여부 판단
    const pageSize = params.numOfRows;
    const maxPage = Math.ceil(totalCount / pageSize);
    STATE.hasMore = STATE.pageNo < maxPage;

    renderList(STATE.items, !isLoadMore);
    renderMarkers(STATE.items);

    if (STATE.hasMore) {
      btnLoadMore.classList.remove("hidden");
    } else {
      btnLoadMore.classList.add("hidden");
    }

    setLoading(false);
  } catch (err) {
    if (requestId !== currentRequestId) return;
    setLoading(false);
    listContainer.innerHTML =
      '<p style="font-size:0.82rem;color:#f97373;padding:6px;">데이터 조회 중 문제가 발생했습니다.</p>';
    txtCount.textContent = "0곳";
    btnLoadMore.classList.add("hidden");
  }
}

// 현재 위치 Promise 래핑
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

// ===== 이벤트 바인딩 =====
function bindEvents() {
  // 검색 버튼
  btnSearch.addEventListener("click", () => {
    STATE.mode = "area";
    runSearch(false);
  });

  // Enter 검색
  iptKeyword.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      STATE.mode = "area";
      runSearch(false);
    }
  });

  // 내 주변 버튼
  btnNearby.addEventListener("click", () => {
    STATE.mode = "nearby";
    runSearch(false);
  });

  // 필터 초기화
  btnReset.addEventListener("click", () => {
    selArea.value = "";
    selCategory.value = "";
    iptKeyword.value = "";
    setChipActive("all");
    STATE.tabType = "all";
    STATE.mode = "area";
    runSearch(false);
  });

  // 더 보기
  btnLoadMore.addEventListener("click", () => {
    if (!STATE.hasMore) return;
    STATE.pageNo += 1;
    runSearch(true);
  });

  // 칩 클릭
  chipRow.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const type = chip.dataset.type;
      setChipActive(type);
      STATE.tabType = type;
      STATE.mode = "area";
      runSearch(false);
    });
  });

  // 모달 닫기
  btnModalClose.addEventListener("click", () => {
    detailModal.classList.add("hidden");
  });
  detailModal.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-backdrop")) {
      detailModal.classList.add("hidden");
    }
  });
}

function setChipActive(type) {
  chipRow.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.toggle("chip-active", chip.dataset.type === type);
  });
}

// ===== 초기화 =====
window.addEventListener("DOMContentLoaded", async () => {
  initMap();
  bindEvents();
  await Promise.all([loadAreas(), loadCategories()]);
  // 첫 로딩: 전국 + 전체
  STATE.mode = "area";
  runSearch(false);
});
