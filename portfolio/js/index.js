// ======================
// 설정 상수
// ======================
const SERVICE_KEY =
  "37441f86a6fdf7eed59e7a176e50c990c64d651d3fb878215ba1972265e1028a";

const APT_TRADE_ENDPOINT =
  "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev";

// UI에 보이는 시도 이름 -> 실제 시도명 매핑
const SIDO_NAME_MAP = {
  서울시: "서울특별시",
  부산시: "부산광역시",
  경기도: "경기도",
  대구시: "대구광역시",
  인천시: "인천광역시",
  광주시: "광주광역시",
  대전시: "대전광역시",
  울산시: "울산광역시",
  세종시: "세종특별자치시",
  강원도: "강원특별자치도",
  충청북도: "충청북도",
  충청남도: "충청남도",
  전라북도: "전북특별자치도",
  전라남도: "전라남도",
  경상북도: "경상북도",
  경상남도: "경상남도",
  제주도: "제주특별자치도",
};

// 시도별 → 시군구(법정동 코드) + 중심좌표
// 예시로 서울·부산 일부 구만 넣어둔 상태. 동일 형식으로 확장 가능.
const REGION_CONFIG = {
  "서울특별시": {
    label: "서울",
    center: { lat: 37.5665, lng: 126.978 },
    sigungu: {
      강남구: {
        lawdCd: "11680",
        center: { lat: 37.5172, lng: 127.0473 },
      },
      서초구: {
        lawdCd: "11650",
        center: { lat: 37.4836, lng: 127.0327 },
      },
      송파구: {
        lawdCd: "11710",
        center: { lat: 37.5145, lng: 127.1059 },
      },
      마포구: {
        lawdCd: "11440",
        center: { lat: 37.5663, lng: 126.9015 },
      },
    },
  },
  "부산광역시": {
    label: "부산",
    center: { lat: 35.1796, lng: 129.0756 },
    sigungu: {
      해운대구: {
        lawdCd: "26350", // 사용자가 예전에 준 코드
        center: { lat: 35.1631, lng: 129.1635 },
      },
      수영구: {
        lawdCd: "26500",
        center: { lat: 35.145, lng: 129.113 },
      },
      부산진구: {
        lawdCd: "26230",
        center: { lat: 35.1601, lng: 129.053 },
      },
    },
  },
};

// ======================
// 전역 상태
// ======================

let map;
let geocoder;
let overlays = [];

let selectedSidoKey = null; // "서울특별시"
let selectedSigunguName = null; // "강남구"
let currentMetric = "avgPrice"; // or "count"

const sigunguDealsCache = {}; // lawdCd -> 거래 item 배열
const dongGeoCache = {}; // "시도 시군구 동" -> {lat,lng}

// ======================
// 유틸
// ======================

function getDealYmd() {
  const input = document.getElementById("tradeMonth");
  if (input && input.value) {
    return input.value.replace("-", ""); // "2026-01" -> "202601"
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

// ======================
// 공공데이터 호출
// ======================

async function fetchAptTrade(lawdCd, dealYmd) {
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

  // 거래 1건일 때는 객체 하나로 올 수도 있어서 통일
  if (!Array.isArray(items)) {
    items = [items];
  }

  return items;
}

// ======================
// 지도 / 오버레이
// ======================

function initMap() {
  const container = document.getElementById("map");
  if (!container) return;

  const options = {
    center: new kakao.maps.LatLng(36.5, 127.8),
    level: 13,
  };
  map = new kakao.maps.Map(container, options);
  geocoder = new kakao.maps.services.Geocoder();

  // 초기에는 전국 “샘플”만 보여주고, 실제 실거래 데이터는 시도 선택 후 로딩
  drawSampleNationwide();
}

// 샘플 전국(시도 레벨) 오버레이
function drawSampleNationwide() {
  const sample = [
    { name: "서울", priceText: "평균 12억대", lat: 37.5665, lng: 126.978 },
    { name: "부산", priceText: "평균 5억대", lat: 35.1796, lng: 129.0756 },
    { name: "대구", priceText: "평균 3억대", lat: 35.8714, lng: 128.6014 },
    { name: "인천", priceText: "평균 4억대", lat: 37.4563, lng: 126.7052 },
    { name: "광주", priceText: "평균 3억대", lat: 35.1595, lng: 126.8526 },
  ];
  drawPriceOverlays(
    sample.map((s) => ({
      name: s.name,
      avgPriceMan: 0,
      label: s.priceText,
      lat: s.lat,
      lng: s.lng,
      level: "sido",
    }))
  );
}

// 공통 오버레이 렌더링
function drawPriceOverlays(entities, { clickable = true } = {}) {
  overlays.forEach((ov) => ov.setMap(null));
  overlays = [];

  const detailBox = document.getElementById("detailInfo");

  if (!entities.length) {
    if (detailBox) {
      detailBox.textContent =
        "선택한 조건에 해당하는 실거래 데이터가 없습니다.";
    }
    return;
  }

  entities.forEach((item) => {
    const pos = new kakao.maps.LatLng(item.lat, item.lng);

    const content = document.createElement("div");
    content.className = "region-overlay";

    const top = document.createElement("div");
    top.className = "region-overlay-top";
    top.textContent = item.name;

    const bottom = document.createElement("div");
    bottom.className = "region-overlay-bottom";
    bottom.textContent =
      item.label ||
      (currentMetric === "count"
        ? `${item.count.toLocaleString()}건`
        : `${formatManwonToUkStr(item.avgPriceMan)}`);

    content.appendChild(top);
    content.appendChild(bottom);

    const overlay = new kakao.maps.CustomOverlay({
      position: pos,
      content,
      yAnchor: 1.0,
    });

    overlay.setMap(map);
    overlays.push(overlay);

    if (clickable && item.onClick) {
      content.addEventListener("click", () => item.onClick(item));
    }
  });

  // 상세 설명 요약 (시군구 레벨일 때 간단 통계)
  const isSigunguLevel = entities[0].level === "sigungu";
  const isDongLevel = entities[0].level === "dong";

  if (detailBox && isSigunguLevel) {
    const prices = entities
      .map((e) => e.avgPriceMan)
      .filter((v) => v && !Number.isNaN(v));
    const counts = entities.map((e) => e.count || 0);
    const avg =
      prices.length > 0
        ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        : 0;
    const totalCount = counts.reduce((a, b) => a + b, 0);

    detailBox.textContent = `${selectedSidoKey} ${formatYmd(
      getDealYmd()
    )} 기준, 시군구 ${entities.length}곳 평균 매매가는 ${formatManwonToUkStr(
      avg
    )}, 총 거래 ${totalCount.toLocaleString()}건입니다. 구를 클릭하면 동별 평균 매매가격을 볼 수 있습니다.`;
  } else if (detailBox && isDongLevel) {
    const totalCount = entities
      .map((e) => e.count || 0)
      .reduce((a, b) => a + b, 0);
    detailBox.textContent = `${selectedSidoKey} ${selectedSigunguName} ${formatYmd(
      getDealYmd()
    )} 기준, 동 ${entities.length}곳의 아파트 매매 실거래를 집계한 결과입니다. 총 거래 ${totalCount.toLocaleString()}건, 박스를 클릭하면 해당 동 기준으로 지도가 이동합니다.`;
  }
}

// ======================
// 시도 선택 → 시군구별 평균 매매가
// ======================

async function loadSigunguAvgPriceForSido(sidoKey) {
  const config = REGION_CONFIG[sidoKey];
  if (!config) return;

  const dealYmd = getDealYmd();
  const sigunguEntries = Object.entries(config.sigungu);

  const tasks = sigunguEntries.map(async ([name, info]) => {
    try {
      const items = await fetchAptTrade(info.lawdCd, dealYmd);
      sigunguDealsCache[info.lawdCd] = items;

      if (!items.length) {
        return {
          name,
          avgPriceMan: 0,
          count: 0,
          lat: info.center.lat,
          lng: info.center.lng,
          level: "sigungu",
        };
      }

      const sum = items
        .map((it) => parsePriceToManwon(it["거래금액"]))
        .reduce((a, b) => a + b, 0);
      const avg = Math.round(sum / items.length);

      return {
        name,
        avgPriceMan: avg,
        count: items.length,
        lat: info.center.lat,
        lng: info.center.lng,
        level: "sigungu",
        onClick: () => handleSigunguSelect(sidoKey, name, info.lawdCd),
      };
    } catch (e) {
      return {
        name,
        avgPriceMan: 0,
        count: 0,
        lat: info.center.lat,
        lng: info.center.lng,
        level: "sigungu",
      };
    }
  });

  const results = await Promise.all(tasks);
  drawPriceOverlays(
    results.filter((r) => r), // null 방지
    { clickable: true }
  );

  // 지도 중심을 시도 중심으로 이동
  map.setCenter(
    new kakao.maps.LatLng(config.center.lat, config.center.lng)
  );
  map.setLevel(10);
}

// ======================
// 시군구 선택 → 동별 평균 매매가
// ======================

async function handleSigunguSelect(sidoKey, sigunguName, lawdCd) {
  selectedSigunguName = sigunguName;
  const config = REGION_CONFIG[sidoKey];
  if (!config) return;

  const sigunguInfo = config.sigungu[sigunguName];
  if (!sigunguInfo) return;

  let deals = sigunguDealsCache[lawdCd];
  if (!deals) {
    deals = await fetchAptTrade(lawdCd, getDealYmd());
    sigunguDealsCache[lawdCd] = deals;
  }

  // 법정동별 그룹핑
  const groups = {}; // dongName -> {sum, count}
  deals.forEach((item) => {
    const dong =
      item["법정동"] || item["법정동명"] || item["동"] || "기타";
    const price = parsePriceToManwon(item["거래금액"]);
    if (!groups[dong]) {
      groups[dong] = { sum: 0, count: 0 };
    }
    groups[dong].sum += price;
    groups[dong].count += 1;
  });

  const dongGrid = document.getElementById("dongGrid");
  dongGrid.innerHTML = "";

  const dongEntities = [];
  const addressPrefix = `${sidoKey} ${sigunguName}`;

  Object.entries(groups).forEach(([dongName, val]) => {
    const avg = Math.round(val.sum / val.count);
    const labelText =
      currentMetric === "count"
        ? `${val.count.toLocaleString()}건`
        : `${formatManwonToUkStr(avg)}`;

    // 동 리스트 버튼
    const btn = document.createElement("button");
    btn.className = "sb-grid-item";
    btn.textContent = `${dongName} (${labelText})`;
    dongGrid.appendChild(btn);

    // 좌표는 지오코더가 비동기로 가져올 것이므로 일단 skeleton
    dongEntities.push({
      dongName,
      avgPriceMan: avg,
      count: val.count,
      address: `${addressPrefix} ${dongName}`,
    });

    btn.addEventListener("click", () => {
      // 버튼 클릭 시 해당 동 위치로 이동
      const key = `${addressPrefix} ${dongName}`;
      const pos = dongGeoCache[key];
      if (pos && map) {
        map.setCenter(new kakao.maps.LatLng(pos.lat, pos.lng));
        map.setLevel(5);
      }
    });
  });

  // 단계 전환: 동
  setStep("dong");

  // 동별 오버레이 생성 (지오코더 사용)
  createDongOverlays(addressPrefix, dongEntities);
}

function createDongOverlays(addressPrefix, dongEntities) {
  const overlayData = [];

  let pending = dongEntities.length;
  if (pending === 0) {
    drawPriceOverlays([], {});
    return;
  }

  dongEntities.forEach((entity) => {
    const key = `${addressPrefix} ${entity.dongName}`;
    const cached = dongGeoCache[key];

    const finalize = (lat, lng) => {
      overlayData.push({
        name: entity.dongName,
        avgPriceMan: entity.avgPriceMan,
        count: entity.count,
        lat,
        lng,
        level: "dong",
        onClick: () => {
          map.setCenter(new kakao.maps.LatLng(lat, lng));
          map.setLevel(5);
        },
      });

      pending -= 1;
      if (pending === 0) {
        drawPriceOverlays(overlayData, { clickable: true });
      }
    };

    if (cached) {
      finalize(cached.lat, cached.lng);
      return;
    }

    geocoder.addressSearch(key, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result[0]) {
        const { y, x } = result[0];
        const lat = parseFloat(y);
        const lng = parseFloat(x);
        dongGeoCache[key] = { lat, lng };
        finalize(lat, lng);
      } else {
        // 좌표 못 찾으면 시군구 중심으로 대체
        const config = REGION_CONFIG[selectedSidoKey];
        const center =
          config?.sigungu[selectedSigunguName]?.center || config?.center;
        finalize(center.lat, center.lng);
      }
    });
  });
}

// ======================
// 사이드바 단계 전환
// ======================

function setStep(stepName) {
  document.querySelectorAll(".sb-step-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.step === stepName);
  });

  const sidoGrid = document.getElementById("sidoGrid");
  const sigunguGrid = document.getElementById("sigunguGrid");
  const dongGrid = document.getElementById("dongGrid");

  if (sidoGrid && sigunguGrid && dongGrid) {
    sidoGrid.classList.toggle("hidden", stepName !== "sido");
    sigunguGrid.classList.toggle("hidden", stepName !== "sigungu");
    dongGrid.classList.toggle("hidden", stepName !== "dong");
  }
}

// ======================
// DOM 이벤트
// ======================

document.addEventListener("DOMContentLoaded", () => {
  // 거래월 기본값 today
  const monthInput = document.getElementById("tradeMonth");
  if (monthInput && !monthInput.value) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    monthInput.value = `${y}-${m}`;
  }

  // 단계 버튼
  document.querySelectorAll(".sb-step-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setStep(btn.dataset.step);
    });
  });

  // 시도 버튼 클릭
  document.querySelectorAll(".sb-grid-item[data-sido-ui]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const sidoUiName = btn.dataset.sidoUi;
      const sidoKey = SIDO_NAME_MAP[sidoUiName];
      if (!sidoKey) return;

      selectedSidoKey = sidoKey;
      selectedSigunguName = null;

      // UI 하이라이트
      document
        .querySelectorAll(".sb-grid-item[data-sido-ui]")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // label 업데이트
      const label = document.getElementById("selectedRegionLabel");
      if (label) {
        label.textContent = `${sidoKey} 시군구별 평균 매매가 (${formatYmd(
          getDealYmd()
        )})`;
      }

      // 시군구 리스트 채우기
      const sigunguGrid = document.getElementById("sigunguGrid");
      sigunguGrid.innerHTML = "";
      const config = REGION_CONFIG[sidoKey];
      if (config) {
        Object.keys(config.sigungu).forEach((sgg) => {
          const sggBtn = document.createElement("button");
          sggBtn.className = "sb-grid-item";
          sggBtn.textContent = sgg;
          sggBtn.dataset.sigungu = sgg;
          sigunguGrid.appendChild(sggBtn);

          sggBtn.addEventListener("click", () => {
            document
              .querySelectorAll("#sigunguGrid .sb-grid-item")
              .forEach((b) => b.classList.remove("active"));
            sggBtn.classList.add("active");
            handleSigunguSelect(sidoKey, sgg, config.sigungu[sgg].lawdCd);
          });
        });
      }

      // 단계 전환: 시군구
      setStep("sigungu");

      // 시군구별 평균 매매가 로딩
      const detailBox = document.getElementById("detailInfo");
      if (detailBox) {
        detailBox.textContent = `${sidoKey} ${formatYmd(
          getDealYmd()
        )} 기준 시군구별 평균 매매가를 불러오는 중입니다...`;
      }
      await loadSigunguAvgPriceForSido(sidoKey);
    });
  });

  // 거래월 변경 시, 시도 선택되어 있으면 다시 로딩
  if (monthInput) {
    monthInput.addEventListener("change", () => {
      if (selectedSidoKey) {
        loadSigunguAvgPriceForSido(selectedSidoKey);
      }
    });
  }

  // 상단 지표 칩
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((c) => {
        c.classList.remove("active");
      });
      chip.classList.add("active");
      currentMetric = chip.dataset.metric || "avgPrice";
      // 지표 바뀌면 같은 데이터로 텍스트만 달라짐 → 현재 데이터 다시 렌더링
      if (selectedSidoKey) {
        loadSigunguAvgPriceForSido(selectedSidoKey);
      }
    });
  });

  // 왼쪽 수직 칩 / 우측 레벨 탭은 디자인용이지만 이벤트는 걸어둔다.
  document.querySelectorAll(".v-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".v-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
    });
  });

  document.querySelectorAll(".legend-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".legend-tab")
        .forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      // 여기서는 실제 레벨 스위치까지는 안 하고 UI 하이라이트만 처리
    });
  });

  // 카카오맵 로딩
  if (window.kakao && window.kakao.maps) {
    kakao.maps.load(initMap);
  }

  // 오버레이 스타일을 동적으로 주입
  const style = document.createElement("style");
  style.innerHTML = `
    .region-overlay {
      display: inline-flex;
      flex-direction: column;
      align-items: stretch;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(15, 23, 42, 0.3);
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, "Noto Sans KR", system-ui;
    }
    .region-overlay-top {
      background-color: #0760ff;
      color: #ffffff;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: 600;
      text-align: center;
      white-space: nowrap;
    }
    .region-overlay-bottom {
      background-color: #ffffff;
      color: #111827;
      padding: 2px 8px;
      font-size: 11px;
      text-align: center;
      white-space: nowrap;
    }
  `;
  document.head.appendChild(style);
});
