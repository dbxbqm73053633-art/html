// ====================
// 1. 설정 상수
// ====================

// 공공데이터포털 아파트 매매 실거래 API
const SERVICE_KEY =
  "37441f86a6fdf7eed59e7a176e50c990c64d651d3fb878215ba1972265e1028a";

const APT_TRADE_ENDPOINT =
  "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev";

// 시도 UI → 실제 시도명
const SIDO_NAME_MAP = {
  서울시: "서울특별시",
  부산시: "부산광역시",
  인천시: "인천광역시",
  대구시: "대구광역시",
  광주시: "광주광역시",
  대전시: "대전광역시",
  울산시: "울산광역시",
  경기도: "경기도",
  강원도: "강원특별자치도",
  충청북도: "충청북도",
  충청남도: "충청남도",
  전라북도: "전북특별자치도",
  전라남도: "전라남도",
  경상북도: "경상북도",
  경상남도: "경상남도",
  세종시: "세종특별자치시",
  제주도: "제주특별자치도",
};

// 시도별 시군구 구성 (LAWD_CD + 대략 중심좌표)
// → 전국 확장할 때 이 테이블만 더 채우면 된다.
const REGION_CONFIG = {
  "서울특별시": {
    center: { lat: 37.5665, lng: 126.978 },
    sigungu: {
      강남구: { lawdCd: "11680", center: { lat: 37.5172, lng: 127.0473 } },
      서초구: { lawdCd: "11650", center: { lat: 37.4836, lng: 127.0327 } },
      송파구: { lawdCd: "11710", center: { lat: 37.5145, lng: 127.1059 } },
      마포구: { lawdCd: "11440", center: { lat: 37.5663, lng: 126.9015 } },
      노원구: { lawdCd: "11350", center: { lat: 37.6543, lng: 127.0568 } },
      영등포구: { lawdCd: "11560", center: { lat: 37.5264, lng: 126.8963 } },
    },
  },
  "부산광역시": {
    center: { lat: 35.1796, lng: 129.0756 },
    sigungu: {
      해운대구: { lawdCd: "26350", center: { lat: 35.1631, lng: 129.1635 } },
      수영구: { lawdCd: "26500", center: { lat: 35.145, lng: 129.113 } },
      부산진구: { lawdCd: "26230", center: { lat: 35.1601, lng: 129.053 } },
      남구: { lawdCd: "26290", center: { lat: 35.135, lng: 129.084 } },
    },
  },
  // 이 아래로 같은 형식으로 인천·경기·대구 등 추가 가능
};

// ====================
// 2. 전역 상태
// ====================
let map;
let geocoder;
let overlays = [];

let selectedSidoKey = null;       // "서울특별시"
let selectedSigunguName = null;   // "강남구"
let selectedLawdCd = null;        // "11680"

const sigunguDealsCache = {};     // lawdCd -> 거래 item 목록
const dongGeoCache = {};          // "시도 시군구 동" -> {lat, lng}

// ====================
// 3. 유틸 함수
// ====================

function getDealYmd() {
  const input = document.getElementById("tradeMonth");
  if (input && input.value) {
    return input.value.replace("-", ""); // 2026-01 -> 202601
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

function parsePriceToManwon(str) {
  if (!str) return 0;
  return Number(str.toString().replace(/,/g, "").trim()) || 0;
}

function formatManwonToUkStr(man) {
  if (!man) return "가격 정보 없음";
  const uk = Math.floor(man / 10000);
  const manRest = man % 10000;
  if (uk > 0) {
    return `약 ${uk.toLocaleString()}억${
      manRest > 0 ? " " + manRest.toLocaleString() + "만" : ""
    }`;
  }
  return `약 ${man.toLocaleString()}만`;
}

function formatYmd(ymd) {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}`;
}

// ====================
// 4. 공공데이터포털 API 호출
// ====================

async function fetchAptTradeByLawdCd(lawdCd, dealYmd) {
  const url = new URL(APT_TRADE_ENDPOINT);

  url.searchParams.set("serviceKey", SERVICE_KEY);
  url.searchParams.set("LAWD_CD", lawdCd);
  url.searchParams.set("DEAL_YMD", dealYmd);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "9999");
  url.searchParams.set("dataType", "JSON");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error("API 호출 실패");
  }

  const data = await res.json();
  let items = data?.response?.body?.items?.item || [];
  if (!Array.isArray(items)) items = [items]; // 1건일 때

  return items;
}

// ====================
// 5. 지도 관련
// ====================

function initMap() {
  const container = document.getElementById("map");
  if (!container) return;

  map = new kakao.maps.Map(container, {
    center: new kakao.maps.LatLng(36.5, 127.8),
    level: 13,
  });

  geocoder = new kakao.maps.services.Geocoder();

  // 전국 샘플 박스 2개만 표시 (서울/부산)
  drawSampleNationwide();
}

function drawSampleNationwide() {
  const sample = [
    {
      name: "서울",
      label: "전국 최고가 지역",
      lat: 37.5665,
      lng: 126.978,
    },
    {
      name: "부산",
      label: "해안 중심 시장",
      lat: 35.1796,
      lng: 129.0756,
    },
  ];

  drawOverlays(
    sample.map((s) => ({
      ...s,
      level: "sido",
    }))
  );

  const summaryBox = document.getElementById("summaryBox");
  if (summaryBox) {
    summaryBox.textContent =
      "전국 샘플 지도가 표시된 상태입니다. 왼쪽에서 시/도를 선택하면 해당 시도의 실제 아파트 실거래 데이터를 기반으로 시/군/구, 동별 평균 매매가를 보여줍니다.";
  }
}

// 공통 오버레이 렌더링
function drawOverlays(entities) {
  overlays.forEach((ov) => ov.setMap(null));
  overlays = [];

  entities.forEach((item) => {
    const pos = new kakao.maps.LatLng(item.lat, item.lng);

    const content = document.createElement("div");
    content.className = "region-overlay";

    const top = document.createElement("div");
    top.className = "region-overlay-top";
    top.textContent = item.name;

    const bottom = document.createElement("div");
    bottom.className = "region-overlay-bottom";
    bottom.textContent = item.label;

    content.appendChild(top);
    content.appendChild(bottom);

    const overlay = new kakao.maps.CustomOverlay({
      position: pos,
      content,
      yAnchor: 1.0,
    });

    overlay.setMap(map);
    overlays.push(overlay);

    if (item.onClick) {
      content.addEventListener("click", () => item.onClick(item));
    }
  });
}

// ====================
// 6. 동별 집계 + 렌더링
// ====================

async function loadDongStatsForSigungu() {
  if (!selectedLawdCd || !selectedSidoKey || !selectedSigunguName) return;

  const dealYmd = getDealYmd();
  const key = `${selectedLawdCd}_${dealYmd}`;

  let deals = sigunguDealsCache[key];
  if (!deals) {
    deals = await fetchAptTradeByLawdCd(selectedLawdCd, dealYmd);
    sigunguDealsCache[key] = deals;
  }

  // 거래가 없으면 처리
  if (!deals.length) {
    drawOverlays([]);
    const summaryBox = document.getElementById("summaryBox");
    if (summaryBox) {
      summaryBox.textContent =
        `${selectedSidoKey} ${selectedSigunguName} ${formatYmd(
          dealYmd
        )} 기준 아파트 매매 실거래 데이터가 없습니다.`;
    }
    const dongList = document.getElementById("dongList");
    if (dongList) {
      dongList.textContent = "해당 기간에 동별 실거래가 없습니다.";
    }
    return;
  }

  // 동별 그룹핑
  const groups = {}; // dongName -> {sum, count}
  const priceArray = [];

  deals.forEach((item) => {
    const dong =
      item["법정동"] || item["법정동명"] || item["동"] || "기타";
    const price = parsePriceToManwon(item["거래금액"]);
    priceArray.push(price);
    if (!groups[dong]) groups[dong] = { sum: 0, count: 0 };
    groups[dong].sum += price;
    groups[dong].count += 1;
  });

  // 통계 계산 (시군구 전체 기준)
  const totalCount = deals.length;
  const avgPrice =
    priceArray.reduce((a, b) => a + b, 0) / (priceArray.length || 1);
  const minPrice = Math.min(...priceArray);
  const maxPrice = Math.max(...priceArray);

  // 중앙값 계산
  const sorted = [...priceArray].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

  // 요약 박스 업데이트
  const summaryBox = document.getElementById("summaryBox");
  if (summaryBox) {
    summaryBox.innerHTML = `
      <div><strong>${selectedSidoKey} ${selectedSigunguName}</strong> · ${formatYmd(
      dealYmd
    )} 기준 아파트 매매 실거래 요약입니다.</div>
      <div style="margin-top:4px;">
        · 총 거래: <strong>${totalCount.toLocaleString()}건</strong><br/>
        · 평균 매매가: <strong>${formatManwonToUkStr(
          Math.round(avgPrice)
        )}</strong><br/>
        · 중앙값: <strong>${formatManwonToUkStr(Math.round(median))}</strong><br/>
        · 최저/최고: <strong>${formatManwonToUkStr(
          minPrice
        )}</strong> ~ <strong>${formatManwonToUkStr(maxPrice)}</strong>
      </div>
    `;
  }

  // 동별 엔티티 만들기
  const addressPrefix = `${selectedSidoKey} ${selectedSigunguName}`;
  const dongEntities = [];

  Object.entries(groups).forEach(([dongName, val]) => {
    const avg = Math.round(val.sum / val.count);
    dongEntities.push({
      dongName,
      avgPriceMan: avg,
      count: val.count,
      address: `${addressPrefix} ${dongName}`,
    });
  });

  // 리스트 렌더링 (가격 높은 순 상위 20개)
  renderDongList(dongEntities);

  // 지도 오버레이 (지오코더 필요)
  createDongOverlays(addressPrefix, dongEntities);
}

function renderDongList(dongEntities) {
  const dongList = document.getElementById("dongList");
  if (!dongList) return;

  if (!dongEntities.length) {
    dongList.textContent = "동별 실거래 데이터가 없습니다.";
    return;
  }

  const sorted = [...dongEntities].sort(
    (a, b) => b.avgPriceMan - a.avgPriceMan
  );
  const top = sorted.slice(0, 20);

  dongList.innerHTML = "";

  top.forEach((d) => {
    const card = document.createElement("div");
    card.className = "dong-card";

    card.innerHTML = `
      <div class="dong-card-header">
        <div class="dong-name">${d.dongName}</div>
        <div class="dong-price">${formatManwonToUkStr(d.avgPriceMan)}</div>
      </div>
      <div class="dong-meta">
        거래 ${d.count.toLocaleString()}건 · 주소: ${d.address}
      </div>
    `;

    card.addEventListener("click", () => {
      const pos = dongGeoCache[d.address];
      if (pos && map) {
        map.setCenter(new kakao.maps.LatLng(pos.lat, pos.lng));
        map.setLevel(5);
      }
    });

    dongList.appendChild(card);
  });
}

// 지오코더 사용해서 동별 오버레이 생성
function createDongOverlays(addressPrefix, entities) {
  overlays.forEach((ov) => ov.setMap(null));
  overlays = [];

  if (!entities.length) return;

  let pending = entities.length;
  const overlayData = [];

  entities.forEach((e) => {
    const key = e.address;
    const cached = dongGeoCache[key];

    const finalize = (lat, lng) => {
      overlayData.push({
        name: e.dongName,
        label: `${formatManwonToUkStr(e.avgPriceMan)} · ${e.count}건`,
        lat,
        lng,
        onClick: () => {
          map.setCenter(new kakao.maps.LatLng(lat, lng));
          map.setLevel(5);
        },
      });

      pending -= 1;
      if (pending === 0) {
        drawOverlays(overlayData);
        // 지도 중심을 시군구 중심으로 잡기
        const cfg = REGION_CONFIG[selectedSidoKey];
        const sggCenter =
          cfg?.sigungu[selectedSigunguName]?.center || cfg?.center;
        if (sggCenter) {
          map.setCenter(new kakao.maps.LatLng(sggCenter.lat, sggCenter.lng));
          map.setLevel(8);
        }
      }
    };

    if (cached) {
      finalize(cached.lat, cached.lng);
      return;
    }

    geocoder.addressSearch(key, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result[0]) {
        const lat = parseFloat(result[0].y);
        const lng = parseFloat(result[0].x);
        dongGeoCache[key] = { lat, lng };
        finalize(lat, lng);
      } else {
        // 좌표 찾기 실패 시, 시군구 중심 좌표 사용
        const cfg = REGION_CONFIG[selectedSidoKey];
        const sggCenter =
          cfg?.sigungu[selectedSigunguName]?.center || cfg?.center;
        finalize(sggCenter.lat, sggCenter.lng);
      }
    });
  });
}

// ====================
// 7. UI: 단계 전환/선택
// ====================

function setStep(step) {
  document.querySelectorAll(".sb-step-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.step === step);
  });

  const sidoGrid = document.getElementById("sidoGrid");
  const sigunguGrid = document.getElementById("sigunguGrid");
  const dongGrid = document.getElementById("dongGrid");

  if (!sidoGrid || !sigunguGrid || !dongGrid) return;

  sidoGrid.classList.toggle("hidden", step !== "sido");
  sigunguGrid.classList.toggle("hidden", step !== "sigungu");
  dongGrid.classList.toggle("hidden", step !== "dong");
}

function handleSidoClick(btn) {
  const uiName = btn.dataset.sidoUi;
  const key = SIDO_NAME_MAP[uiName];
  if (!key) return;

  selectedSidoKey = key;
  selectedSigunguName = null;
  selectedLawdCd = null;

  // 버튼 하이라이트
  document
    .querySelectorAll(".sb-grid-item[data-sido-ui]")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  // 시군구 목록 생성
  const cfg = REGION_CONFIG[key];
  const sigunguGrid = document.getElementById("sigunguGrid");
  sigunguGrid.innerHTML = "";

  if (cfg && cfg.sigungu) {
    Object.keys(cfg.sigungu).forEach((sggName) => {
      const sggBtn = document.createElement("button");
      sggBtn.className = "sb-grid-item";
      sggBtn.textContent = sggName;
      sggBtn.dataset.sigungu = sggName;
      sigunguGrid.appendChild(sggBtn);

      sggBtn.addEventListener("click", () => handleSigunguClick(sggBtn));
    });
  }

  const regionText = document.getElementById("selectedRegionText");
  if (regionText) {
    regionText.textContent = `${key} (시/군/구 선택 대기 중)`;
  }

  setStep("sigungu");

  // 지도 중심도 시도 중심으로 이동
  if (cfg?.center && map) {
    map.setCenter(new kakao.maps.LatLng(cfg.center.lat, cfg.center.lng));
    map.setLevel(10);
  }
}

function handleSigunguClick(btn) {
  if (!selectedSidoKey) return;

  const sigunguName = btn.dataset.sigungu;
  selectedSigunguName = sigunguName;

  const cfg = REGION_CONFIG[selectedSidoKey];
  const sigunguInfo = cfg?.sigungu[sigunguName];
  if (!sigunguInfo) return;

  selectedLawdCd = sigunguInfo.lawdCd;

  // 버튼 하이라이트
  document
    .querySelectorAll("#sigunguGrid .sb-grid-item")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  // 선택 텍스트
  const regionText = document.getElementById("selectedRegionText");
  if (regionText) {
    regionText.textContent = `${selectedSidoKey} ${selectedSigunguName} · ${formatYmd(
      getDealYmd()
    )} 아파트 매매 실거래`;
  }

  setStep("dong");

  // 시군구 데이터 로딩
  const summaryBox = document.getElementById("summaryBox");
  if (summaryBox) {
    summaryBox.textContent = "동별 실거래 데이터를 불러오는 중입니다...";
  }
  loadDongStatsForSigungu();
}

// ====================
// 8. 초기화
// ====================

document.addEventListener("DOMContentLoaded", () => {
  // 거래월 기본값 세팅
  const monthInput = document.getElementById("tradeMonth");
  if (monthInput && !monthInput.value) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    monthInput.value = `${y}-${m}`;
  }

  // 단계 버튼
  document.querySelectorAll(".sb-step-btn").forEach((btn) => {
    btn.addEventListener("click", () => setStep(btn.dataset.step));
  });

  // 시도 클릭 핸들러
  document
    .querySelectorAll(".sb-grid-item[data-sido-ui]")
    .forEach((btn) => {
      btn.addEventListener("click", () => handleSidoClick(btn));
    });

  // 거래월 변경 시, 선택된 시군구가 있으면 다시 조회
  if (monthInput) {
    monthInput.addEventListener("change", () => {
      if (selectedLawdCd) {
        loadDongStatsForSigungu();
      }
    });
  }

  // 다시 조회 버튼
  const reloadBtn = document.getElementById("btnReload");
  if (reloadBtn) {
    reloadBtn.addEventListener("click", () => {
      if (selectedLawdCd) {
        loadDongStatsForSigungu();
      } else {
        drawSampleNationwide();
      }
    });
  }

  // Kakao Map 로드
  if (window.kakao && window.kakao.maps) {
    kakao.maps.load(initMap);
  }
});
