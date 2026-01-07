// =========================
//  설정
// =========================
const SERVICE_KEY =
  "37441f86a6fdf7eed59e7a176e50c990c64d651d3fb878215ba1972265e1028a";

// 거래유형 → EndPoint 매핑
const API_ENDPOINTS = {
  aptTrade: "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev",
  aptRent: "https://apis.data.go.kr/1613000/RTMSDataSvcAptRent",
  offiTrade: "https://apis.data.go.kr/1613000/RTMSDataSvcOffiTrade",
  offiRent: "https://apis.data.go.kr/1613000/RTMSDataSvcOffiRent",
  rhTrade: "https://apis.data.go.kr/1613000/RTMSDataSvcRHTrade",
  induTrade: "https://apis.data.go.kr/1613000/RTMSDataSvcInduTrade",
  nrgTrade: "https://apis.data.go.kr/1613000/RTMSDataSvcNrgTrade",
  landTrade: "https://apis.data.go.kr/1613000/RTMSDataSvcLandTrade",
  silvTrade: "https://apis.data.go.kr/1613000/RTMSDataSvcSilvTrade",
};

// 간단 예시용: 임의의 법정동 코드 매핑 (실서비스에서는 검색/선택 UI 필요)
const DONG_CODE_MAP = {
  "서초구 서초동": "11650",
  "강남구 대치동": "11680",
  "부산 해운대구 우동": "26350",
};

// =========================
//  DOM 요소
// =========================
const dealTypeTabs = document.getElementById("dealTypeTabs");
const btnSearch = document.getElementById("btnSearch");
const resultList = document.getElementById("resultList");
const resultMeta = document.getElementById("resultMeta");
const btnMore = document.getElementById("btnMore");
const inputDong = document.getElementById("inputDong");
const inputMonth = document.getElementById("inputMonth");
const selectSort = document.getElementById("selectSort");
const inputMinArea = document.getElementById("inputMinArea");
const inputMaxPrice = document.getElementById("inputMaxPrice");
const btnCurrentLocation = document.getElementById("btnCurrentLocation");

let currentDealType = "aptTrade";
let currentPage = 1;
let totalCount = 0;
let currentList = [];

// =========================
//  Kakao Map 초기화
// =========================
let map;
let currentMarker;

function initMap() {
  const container = document.getElementById("map");
  const options = {
    center: new kakao.maps.LatLng(37.4979, 127.0276), // 강남역 근처
    level: 5,
  };
  map = new kakao.maps.Map(container, options);
}

if (window.kakao && window.kakao.maps) {
  kakao.maps.load(initMap);
}

// 선택된 매물 위치로 이동
function focusOnDeal(deal) {
  if (!map || !deal.lat || !deal.lng) return;

  const latLng = new kakao.maps.LatLng(deal.lat, deal.lng);
  map.setCenter(latLng);
  map.setLevel(4);

  if (!currentMarker) {
    currentMarker = new kakao.maps.Marker({
      position: latLng,
      map,
    });
  } else {
    currentMarker.setPosition(latLng);
  }
}

// =========================
//  거래유형 탭 이벤트
// =========================
dealTypeTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".chip-tab");
  if (!btn) return;

  document
    .querySelectorAll(".chip-tab")
    .forEach((el) => el.classList.remove("active"));
  btn.classList.add("active");

  currentDealType = btn.dataset.dealType;
});

// =========================
//  필터에서 법정동 코드 찾기 (예시)
// =========================
function getLawdCdFromInput() {
  const text = inputDong.value.trim();
  if (DONG_CODE_MAP[text]) return DONG_CODE_MAP[text];
  // 실제 서비스에서는 여기서 검색 API 연동 또는 선택 UI로 대체
  return null;
}

// =========================
//  공공데이터 호출 (예시)
// =========================
async function fetchDeals(pageNo = 1) {
  const lawdCd = getLawdCdFromInput();
  const monthValue = inputMonth.value; // "2026-01"
  if (!lawdCd || !monthValue) {
    alert("지역과 거래월을 입력해주세요.");
    return { deals: [], totalCount: 0 };
  }

  const dealYmd = monthValue.replace("-", ""); // "202601"

  const endpoint = API_ENDPOINTS[currentDealType];
  const url = new URL(endpoint);

  // 실제 문서에 맞게 파라미터 조정 필요
  url.searchParams.set("serviceKey", SERVICE_KEY);
  url.searchParams.set("LAWD_CD", lawdCd);
  url.searchParams.set("DEAL_YMD", dealYmd);
  url.searchParams.set("pageNo", pageNo);
  url.searchParams.set("numOfRows", 50);
  url.searchParams.set("type", "json");

  const res = await fetch(url.toString());
  if (!res.ok) {
    alert("API 호출 중 문제가 발생했습니다.");
    return { deals: [], totalCount: 0 };
  }

  const data = await res.json();

  // 공공데이터 응답 구조에 맞춰 파싱 (예시)
  // 실제: data.response.body.items.item 배열 형태일 가능성 높음
  const items =
    data?.response?.body?.items?.item && Array.isArray(data.response.body.items.item)
      ? data.response.body.items.item
      : [];

  const total =
    typeof data?.response?.body?.totalCount === "number"
      ? data.response.body.totalCount
      : items.length;

  const deals = items.map((item) => normalizeDeal(item, currentDealType));

  return { deals, totalCount: total };
}

// =========================
//  응답 → 화면용 데이터로 변환 (예시)
// =========================
function normalizeDeal(item, dealType) {
  // 공공데이터 항목은 각 서비스마다 약간 다름
  // 대표적으로 아파트 매매 기준 예시:
  // 법정동: item.법정동, 아파트명: item.아파트, 전용면적: item.전용면적, 층: item.층,
  // 거래금액: item.거래금액, 년/월/일: item.년, item.월, item.일 등

  const isRent = dealType === "aptRent" || dealType === "offiRent";
  const isLand = dealType === "landTrade";

  const name =
    item["아파트"] ||
    item["단지명"] ||
    item["건물명"] ||
    item["지번"] ||
    "이름 없음";

  const dong = item["법정동"] || item["법정동명"] || "";
  const jibun = item["지번"] || "";

  const area = parseFloat(item["전용면적"] || item["대지면적"] || 0);
  const floor = item["층"] || "";
  const year = item["년"] || item["dealYear"];
  const month = item["월"] || item["dealMonth"];
  const day = item["일"] || item["dealDay"];

  let priceStr = "";
  if (isRent) {
    const deposit = (item["보증금액"] || "").toString().trim();
    const rent = (item["월세금액"] || "").toString().trim();
    priceStr = `보증금 ${deposit} / 월세 ${rent}`;
  } else {
    const rawPrice = (item["거래금액"] || "").toString().replace(/,/g, "").trim();
    if (rawPrice) {
      const num = Number(rawPrice);
      const uk = Math.floor(num / 10000);
      const man = num % 10000;
      priceStr = uk > 0 ? `${uk}억 ${man.toLocaleString()}만` : `${num.toLocaleString()}만`;
    } else {
      priceStr = "가격 정보 없음";
    }
  }

  const tradeDate = year && month && day ? `${year}.${month}.${day}` : "";

  // 지도 위치는 공공데이터에 좌표가 없을 수 있으므로, 우선 null로 두고
  // 추후 주소로 kakao geocoder 사용
  return {
    name,
    dong,
    jibun,
    area,
    floor,
    priceStr,
    tradeDate,
    dealType,
    lat: null,
    lng: null,
    raw: item,
  };
}

// =========================
//  리스트 렌더링
// =========================
function renderDeals(list, append = false) {
  if (!append) {
    resultList.innerHTML = "";
  }

  if (!list.length && !append) {
    resultList.innerHTML =
      '<div class="deal-sub">조건에 해당하는 실거래가가 없습니다.</div>';
    return;
  }

  const frag = document.createDocumentFragment();

  list.forEach((deal, idx) => {
    const card = document.createElement("article");
    card.className = "deal-card";
    card.dataset.index = idx;

    card.innerHTML = `
      <div class="deal-card-header">
        <div>
          <div class="deal-title">${deal.name}</div>
          <div class="deal-tag-row">
            <span class="deal-tag primary">${formatDealType(deal.dealType)}</span>
            ${
              deal.floor
                ? `<span class="deal-tag">${deal.floor}층</span>`
                : ""
            }
            ${
              deal.area
                ? `<span class="deal-tag">${deal.area.toFixed(1)}m²</span>`
                : ""
            }
          </div>
        </div>
        <div class="deal-price">${deal.priceStr}</div>
      </div>
      <div class="deal-sub">
        ${deal.dong} ${deal.jibun}
      </div>
      <div class="deal-meta-row">
        <span>${deal.tradeDate || ""}</span>
        <span>상세보기 · 지도</span>
      </div>
    `;

    card.addEventListener("click", () => {
      focusOnDeal(deal);
    });

    frag.appendChild(card);
  });

  resultList.appendChild(frag);
}

// 거래유형 텍스트
function formatDealType(dealType) {
  switch (dealType) {
    case "aptTrade":
      return "아파트 매매";
    case "aptRent":
      return "아파트 전월세";
    case "offiTrade":
      return "오피스텔 매매";
    case "offiRent":
      return "오피스텔 전월세";
    case "rhTrade":
      return "연립다세대 매매";
    case "induTrade":
      return "공장·창고 매매";
    case "nrgTrade":
      return "상업업무용 매매";
    case "landTrade":
      return "토지 매매";
    case "silvTrade":
      return "분양권 전매";
    default:
      return "실거래";
  }
}

// =========================
//  정렬 & 필터
// =========================
function applySortAndFilter(list) {
  const minArea = Number(inputMinArea.value || 0);
  const maxPriceUk = Number(inputMaxPrice.value || 0);
  const sort = selectSort.value;

  let filtered = list.filter((d) => {
    if (minArea && d.area && d.area < minArea) return false;

    if (maxPriceUk && !d.dealType.endsWith("Rent")) {
      // 가격 문자열에서 억 기준으로 대략 추출 (예시)
      const match = d.priceStr.match(/(\d+)억/);
      if (match) {
        const uk = Number(match[1]);
        if (uk > maxPriceUk) return false;
      }
    }
    return true;
  });

  if (sort === "priceDesc" || sort === "priceAsc") {
    filtered.sort((a, b) => extractPrice(a) - extractPrice(b));
    if (sort === "priceDesc") filtered.reverse();
  } else if (sort === "areaDesc" || sort === "areaAsc") {
    filtered.sort((a, b) => (a.area || 0) - (b.area || 0));
    if (sort === "areaDesc") filtered.reverse();
  } else if (sort === "recent") {
    filtered.sort((a, b) => {
      const da = new Date(a.tradeDate.replace(/\./g, "-"));
      const db = new Date(b.tradeDate.replace(/\./g, "-"));
      return db - da;
    });
  }

  return filtered;
}

function extractPrice(deal) {
  // "12억 300만" → 대충 만원 단위 숫자로 변환 (예시)
  const matchUk = deal.priceStr.match(/(\d+)억/);
  const matchMan = deal.priceStr.match(/(\d+)만/);
  const uk = matchUk ? Number(matchUk[1]) : 0;
  const man = matchMan ? Number(matchMan[1]) : 0;
  return uk * 10000 + man;
}

// =========================
//  검색 실행
// =========================
btnSearch.addEventListener("click", async () => {
  currentPage = 1;
  resultMeta.textContent = "실거래가 조회 중...";
  btnSearch.disabled = true;

  try {
    const { deals, totalCount: total } = await fetchDeals(currentPage);
    totalCount = total;
    currentList = deals;

    const processed = applySortAndFilter(currentList);
    renderDeals(processed);

    resultMeta.textContent = `총 ${total.toLocaleString()}건 중 ${
      processed.length
    }건 표시`;
    btnMore.disabled = total <= deals.length;
  } catch (e) {
    resultMeta.textContent = "데이터를 불러오는 중 문제가 발생했습니다.";
  } finally {
    btnSearch.disabled = false;
  }
});

// 더 불러오기
btnMore.addEventListener("click", async () => {
  if (btnMore.disabled) return;
  currentPage += 1;
  btnMore.disabled = true;

  try {
    const { deals } = await fetchDeals(currentPage);
    currentList = currentList.concat(deals);

    const processed = applySortAndFilter(currentList);
    renderDeals(processed);

    resultMeta.textContent = `총 ${totalCount.toLocaleString()}건 중 ${
      processed.length
    }건 표시`;
    if (currentList.length >= totalCount) {
      btnMore.disabled = true;
    } else {
      btnMore.disabled = false;
    }
  } catch (e) {
    btnMore.disabled = false;
  }
});

// 필터 변경 시 즉시 재정렬
[selectSort, inputMinArea, inputMaxPrice].forEach((el) => {
  el.addEventListener("change", () => {
    const processed = applySortAndFilter(currentList);
    renderDeals(processed);
    if (totalCount) {
      resultMeta.textContent = `총 ${totalCount.toLocaleString()}건 중 ${
        processed.length
      }건 표시`;
    }
  });
});

// 현위치 버튼 (예시: 좌표만 확보, 실제로는 역지오코딩 후 법정동 코드 매핑)
btnCurrentLocation.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("현재 위치를 가져올 수 없습니다.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      if (map) {
        map.setCenter(new kakao.maps.LatLng(latitude, longitude));
        map.setLevel(4);
      }
      // 실제 서비스에서는 kakao geocoder로 주소 → 법정동 코드 매핑 필요
    },
    () => {
      alert("위치 정보를 활성화 해주세요.");
    }
  );
});
