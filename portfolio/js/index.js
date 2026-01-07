// ===== 기본 설정 =====
const END_POINT = "https://apis.data.go.kr/B551011/KorPetTourService";
const SERVICE_KEY = "37441f86a6fdf7eed59e7a176e50c990c64d651d3fb878215ba1972265e1028a"; // 실제 사용 시 encodeURIComponent 권장

// 공통 파라미터 (공공데이터포털 한국관광공사 스타일)
const COMMON_PARAMS = {
  MobileOS: "ETC",
  MobileApp: "PetTourWeb",
  _type: "json",
};

// ===== DOM 요소 =====
const areaSelect = document.getElementById("areaSelect");
const categorySelect = document.getElementById("categorySelect");
const keywordInput = document.getElementById("keywordInput");
const searchBtn = document.getElementById("searchBtn");
const nearbyBtn = document.getElementById("nearbyBtn");
const placeListEl = document.getElementById("placeList");
const listSkeletonEl = document.getElementById("listSkeleton");
const resultCountEl = document.getElementById("resultCount");
const detailModal = document.getElementById("detailModal");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalBody = document.getElementById("modalBody");
const chips = document.querySelectorAll(".chip");

// ===== Kakao Map =====
let map;
let markers = [];
let selectedMarker = null;

// ===== 유틸: URL 빌더 =====
function buildUrl(path, extraParams = {}) {
  const url = new URL(`${END_POINT}/${path}`);
  // serviceKey
  url.searchParams.set("serviceKey", SERVICE_KEY);
  // 공통 파라미터
  Object.entries(COMMON_PARAMS).forEach(([k, v]) => url.searchParams.set(k, v));
  // 추가 파라미터
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
    throw new Error("API 응답 에러");
  }
  const data = await res.json();
  // 공공데이터포털 JSON 구조에 맞게 안전하게 꺼내기
  const items =
    data.response &&
    data.response.body &&
    data.response.body.items &&
    data.response.body.items.item
      ? data.response.body.items.item
      : [];
  return Array.isArray(items) ? items : [items];
}

// ===== UI 헬퍼 =====
function showSkeleton(show) {
  listSkeletonEl.style.display = show ? "flex" : "none";
}

function clearMarkers() {
  markers.forEach((m) => m.setMap(null));
  markers = [];
  selectedMarker = null;
}

function setActiveCard(contentId) {
  document.querySelectorAll(".place-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.id === String(contentId));
  });
}

// ===== 카카오맵 초기화 =====
function initMap() {
  const container = document.getElementById("map");
  const options = {
    center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울 중심
    level: 5,
  };
  map = new kakao.maps.Map(container, options);
}

// 검색 결과에 따라 마커 갱신
function renderMarkers(items) {
  clearMarkers();

  if (!items.length) return;

  const bounds = new kakao.maps.LatLngBounds();

  items.forEach((item) => {
    const mapx = parseFloat(item.mapx);
    const mapy = parseFloat(item.mapy);
    if (!mapx || !mapy) return;

    const position = new kakao.maps.LatLng(mapy, mapx);
    bounds.extend(position);

    const marker = new kakao.maps.Marker({
      position,
      map,
    });

    marker.contentId = item.contentid;

    kakao.maps.event.addListener(marker, "click", () => {
      setActiveCard(marker.contentId);
      focusMarker(marker);
      if (item.title) {
        const iwContent = `<div style="padding:6px 10px;font-size:12px;">${item.title}</div>`;
        const infowindow = new kakao.maps.InfoWindow({
          content: iwContent,
          removable: true,
        });
        infowindow.open(map, marker);
      }
    });

    markers.push(marker);
  });

  if (!bounds.isEmpty()) {
    map.setBounds(bounds);
  }
}

function focusMarker(marker) {
  if (!marker) return;
  map.panTo(marker.getPosition());
  selectedMarker = marker;
}

// 리스트 카드 클릭 시 마커 찾기
function focusMarkerByContentId(contentId) {
  const marker = markers.find((m) => String(m.contentId) === String(contentId));
  if (marker) {
    focusMarker(marker);
  }
}

// ===== 리스트 렌더링 =====
function renderList(items) {
  placeListEl.innerHTML = "";
  resultCountEl.textContent = `${items.length}곳`;

  if (!items.length) {
    placeListEl.innerHTML = `<p style="font-size:0.85rem;color:#6b7280;padding:8px;">
      조건에 맞는 반려동물 동반 여행지가 없습니다. 검색 조건을 변경해 보세요.
    </p>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "place-card";
    card.dataset.id = item.contentid;

    const thumbUrl =
      item.firstimage || item.firstimage2 || ""; // 이미지정보조회와 연계해서 개선 가능

    const thumbnail = document.createElement("div");
    thumbnail.className = "place-thumbnail";
    if (thumbUrl) {
      thumbnail.style.backgroundImage = `url('${thumbUrl}')`;
    }

    const info = document.createElement("div");
    info.className = "place-info";

    const titleRow = document.createElement("div");
    titleRow.className = "place-title-row";

    const title = document.createElement("h3");
    title.className = "place-title";
    title.textContent = item.title || "이름 미제공";

    const badge = document.createElement("span");
    badge.className = "place-badge";
    badge.textContent = (item.cat3name || item.cat2name || item.cat1name || "반려동물 동반");

    titleRow.appendChild(title);
    titleRow.appendChild(badge);

    const meta = document.createElement("div");
    meta.className = "place-meta";
    const addr = item.addr1 || item.addr2 || "";
    const petInfo = item.petinfony || item.petInfo || "";

    if (addr) {
      const spanAddr = document.createElement("span");
      spanAddr.textContent = addr;
      meta.appendChild(spanAddr);
    }

    if (petInfo) {
      const spanPet = document.createElement("span");
      spanPet.textContent = `동반 조건: ${petInfo}`;
      meta.appendChild(spanPet);
    }

    const tags = document.createElement("div");
    tags.className = "place-tags";

    if (item.distance) {
      const t = document.createElement("span");
      t.className = "place-tag";
      t.textContent = `내 위치에서 ${item.distance}km`;
      tags.appendChild(t);
    }

    if (item.parking) {
      const t = document.createElement("span");
      t.className = "place-tag";
      t.textContent = "주차 가능";
      tags.appendChild(t);
    }

    const t2 = document.createElement("span");
    t2.className = "place-tag";
    t2.textContent = "반려동물 동반";
    tags.appendChild(t2);

    info.appendChild(titleRow);
    info.appendChild(meta);
    info.appendChild(tags);

    card.appendChild(thumbnail);
    card.appendChild(info);

    // 카드 클릭 이벤트: 지도 포커싱 + 상세 조회
    card.addEventListener("click", () => {
      setActiveCard(item.contentid);
      focusMarkerByContentId(item.contentid);
      loadDetail(item.contentid, item.contenttypeid);
    });

    fragment.appendChild(card);
  });

  placeListEl.appendChild(fragment);
}

// ===== 상세 정보 모달 (공통/소개/이미지 정보 예시) =====
async function loadDetail(contentId, contentTypeId) {
  try {
    // 공통정보조회 예시
    const commonItems = await fetchTour("detailCommon", {
      contentId,
      contentTypeId,
      defaultYN: "Y",
      firstImageYN: "Y",
      addrinfoYN: "Y",
      mapinfoYN: "Y",
      overviewYN: "Y",
    });

    // 소개정보조회 예시
    const introItems = await fetchTour("detailIntro", {
      contentId,
      contentTypeId,
    });

    // 이미지정보조회 예시
    const imageItems = await fetchTour("detailImage", {
      contentId,
      imageYN: "Y",
      subImageYN: "Y",
    });

    const common = commonItems[0] || {};
    const intro = introItems[0] || {};
    const mainImage = common.firstimage || common.firstimage2 || "";

    const imageList = imageItems
      .map((img) => img.originimgurl || img.smallimageurl)
      .filter(Boolean)
      .slice(0, 5);

    modalBody.innerHTML = `
      <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:8px;">${common.title || "상세 정보"}</h2>
      ${
        mainImage
          ? `<div style="margin-bottom:10px;">
              <img src="${mainImage}" alt="${common.title || ""}" style="width:100%;border-radius:14px;object-fit:cover;max-height:220px;" />
            </div>`
          : ""
      }
      <p style="font-size:0.85rem;color:#4b5563;line-height:1.5;margin-bottom:10px;">
        ${common.overview || "상세 설명이 제공되지 않았습니다."}
      </p>
      <div style="font-size:0.8rem;color:#4b5563;margin-bottom:10px;">
        ${
          common.addr1
            ? `<div><strong>주소</strong> : ${common.addr1} ${common.addr2 || ""}</div>`
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
        imageList.length
          ? `<div style="margin-top:6px;">
              <strong style="font-size:0.8rem;display:block;margin-bottom:4px;">추가 이미지</strong>
              <div style="display:flex;gap:6px;overflow-x:auto;">
                ${imageList
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
    detailModal.classList.remove("hidden");
  } catch (e) {
    modalBody.innerHTML =
      `<p style="font-size:0.85rem;color:#6b7280;">상세 정보를 불러오지 못했습니다.</p>`;
    detailModal.classList.remove("hidden");
  }
}

// ===== 지역코드 / 분류코드 로딩 =====
async function loadAreas() {
  try {
    const items = await fetchTour("areaCode", {
      numOfRows: 50,
      pageNo: 1,
    });
    items.forEach((area) => {
      const opt = document.createElement("option");
      opt.value = area.code;
      opt.textContent = area.name;
      areaSelect.appendChild(opt);
    });
  } catch (e) {
    // 필요 시 에러 처리
  }
}

async function loadCategories() {
  try {
    const items = await fetchTour("categoryCode", {
      numOfRows: 100,
      pageNo: 1,
    });
    items.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.code;
      opt.textContent = cat.name;
      categorySelect.appendChild(opt);
    });
  } catch (e) {
    // 필요 시 에러 처리
  }
}

// ===== 검색 =====
async function searchPlaces(options = {}) {
  const areaCode = options.areaCode ?? areaSelect.value;
  const categoryCode = options.categoryCode ?? categorySelect.value;
  const keyword = options.keyword ?? keywordInput.value.trim();
  const tabType = options.tabType ?? document.querySelector(".chip-active")?.dataset.type ?? "all";

  showSkeleton(true);
  placeListEl.innerHTML = "";
  resultCountEl.textContent = "검색 중…";

  try {
    // 여기서는 예시로 지역기반 + 키워드 기반을 섞어서 사용
    // 실제 KorPetTourService 문서에 맞게 path/파라미터만 교체하면 됨

    // 1차: 반려동물 동반 여행 조회 (예: areaBasedListPet 같은 엔드포인트)
    let items = await fetchTour("areaBasedList", {
      numOfRows: 30,
      pageNo: 1,
      arrange: "E",
      areaCode: areaCode || "",
      cat1: categoryCode || "",
      keyword: keyword || "",
    });

    // 탭(숙소/카페/공원 등)에 따른 간단 필터 예시 (실제 데이터 구조에 맞게 catX 값으로 조정)
    if (tabType === "stay") {
      items = items.filter((i) => (i.cat2name || "").includes("숙박"));
    } else if (tabType === "cafe") {
      items = items.filter((i) => (i.cat3name || "").includes("카페"));
    } else if (tabType === "park") {
      items = items.filter((i) => (i.cat2name || "").includes("공원"));
    }

    renderList(items);
    renderMarkers(items);
  } catch (e) {
    placeListEl.innerHTML =
      `<p style="font-size:0.85rem;color:#6b7280;padding:8px;">검색 중 문제가 발생했습니다.</p>`;
    resultCountEl.textContent = "0곳";
  } finally {
    showSkeleton(false);
  }
}

// ===== 내 주변 검색 (위치기반 관광정보조회 예시) =====
function searchNearby() {
  if (!navigator.geolocation) {
    alert("현재 위치를 가져올 수 없습니다.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;

      showSkeleton(true);
      placeListEl.innerHTML = "";
      resultCountEl.textContent = "검색 중…";

      try {
        const items = await fetchTour("locationBasedList", {
          numOfRows: 30,
          pageNo: 1,
          arrange: "E",
          mapX: longitude,
          mapY: latitude,
          radius: 20000, // 20km 예시
        });

        // 거리 계산이 응답에 포함되어 있다면 그대로 사용, 없으면 추가 계산 가능
        renderList(items);
        renderMarkers(items);
      } catch (e) {
        placeListEl.innerHTML =
          `<p style="font-size:0.85rem;color:#6b7280;padding:8px;">내 주변 여행지를 찾는 중 문제가 발생했습니다.</p>`;
        resultCountEl.textContent = "0곳";
      } finally {
        showSkeleton(false);
      }
    },
    () => {
      alert("위치 정보 권한이 필요합니다.");
    }
  );
}

// ===== 이벤트 바인딩 =====
function bindEvents() {
  searchBtn.addEventListener("click", () => {
    searchPlaces();
  });

  keywordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      searchPlaces();
    }
  });

  nearbyBtn.addEventListener("click", () => {
    searchNearby();
  });

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("chip-active"));
      chip.classList.add("chip-active");
      searchPlaces({ tabType: chip.dataset.type });
    });
  });

  modalCloseBtn.addEventListener("click", () => {
    detailModal.classList.add("hidden");
  });

  detailModal.addEventListener("click", (e) => {
    if (e.target === detailModal.querySelector(".modal-backdrop")) {
      detailModal.classList.add("hidden");
    }
  });
}

// ===== 초기화 =====
window.addEventListener("DOMContentLoaded", async () => {
  initMap();
  bindEvents();
  await Promise.all([loadAreas(), loadCategories()]);
  // 초기 검색 (전국 + 전체)
  searchPlaces();
});
