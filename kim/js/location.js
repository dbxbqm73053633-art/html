// 공통 페이지 이동
function goPage(path) {
  window.location.href = path;
}

/* ===== 카카오맵 설정 ===== */

// 장기역 근처 가상의 좌표
const JANGGI_LAT = 37.644028;
const JANGGI_LNG = 126.669;
let map;
let marker;

function initMap() {
  const container = document.getElementById("kakaoMap");
  if (!container || !window.kakao || !kakao.maps) return;

  const center = new kakao.maps.LatLng(JANGGI_LAT, JANGGI_LNG);

  const options = {
    center,
    level: 3 // 숫자 작을수록 확대 (헬스장 위치가 바로 보이게)
  };

  map = new kakao.maps.Map(container, options);

  // 메인 헬스장 마커
  marker = new kakao.maps.Marker({
    position: center
  });
  marker.setMap(map);

  const overlayContent =
    '<div style="padding:4px 8px;border-radius:999px;background:#111827;color:#fff;font-size:11px;box-shadow:0 2px 6px rgba(15,23,42,.35);">MyFit 장기점</div>';

  const overlay = new kakao.maps.CustomOverlay({
    content: overlayContent,
    position: center,
    yAnchor: 1.7
  });
  overlay.setMap(map);

  // 주변 랜드마크 (장기역, 뉴고려병원) 간단히 표시 (대략 좌표)
  const landmarks = [
    {
      name: "장기역 1번 출구",
      lat: 37.6429,
      lng: 126.671,
      color: "#0ea5e9"
    },
    {
      name: "뉴고려병원",
      lat: 37.6414,
      lng: 126.6693,
      color: "#22c55e"
    }
  ];

  landmarks.forEach((lm) => {
    const pos = new kakao.maps.LatLng(lm.lat, lm.lng);
    const circle = new kakao.maps.Circle({
      center: pos,
      radius: 35,
      strokeWeight: 1,
      strokeColor: lm.color,
      strokeOpacity: 0.7,
      strokeStyle: "solid",
      fillColor: lm.color,
      fillOpacity: 0.25
    });
    circle.setMap(map);

    const label = new kakao.maps.CustomOverlay({
      content:
        '<div style="padding:2px 6px;border-radius:999px;background:#ffffff;color:#111827;border:1px solid rgba(148,163,184,.8);font-size:10px;white-space:nowrap;">' +
        lm.name +
        "</div>",
      position: pos,
      yAnchor: 1.5
    });
    label.setMap(map);
  });
}

// 지도 중심 재설정
function recenterMap() {
  if (!map) return;
  const center = new kakao.maps.LatLng(JANGGI_LAT, JANGGI_LNG);
  map.setCenter(center);
  map.setLevel(3);
}

/* ===== 외부 지도 링크 ===== */

function openKakaoDirection() {
  const name = encodeURIComponent("MyFit 장기점");
  const lat = JANGGI_LAT;
  const lng = JANGGI_LNG;
  // 길찾기 링크
  const url = `https://map.kakao.com/link/to/${name},${lat},${lng}`;
  window.open(url, "_blank");
}

function openNaverMap() {
  const query = encodeURIComponent("MyFit 장기점");
  const url = `https://map.naver.com/v5/search/${query}`;
  window.open(url, "_blank");
}

/* ===== 주소 복사 ===== */

function copyAddress() {
  const road = document.getElementById("addrRoad")?.textContent || "";
  const jibeon = document.getElementById("addrJibeon")?.textContent || "";
  const text = `${road}\n(${jibeon})`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => {
        alert("주소가 복사되었습니다.");
      },
      () => {
        fallbackCopy(text);
      }
    );
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand("copy");
    alert("주소가 복사되었습니다.");
  } catch (e) {
    alert("주소 복사에 실패했습니다. 직접 복사해 주세요.");
  } finally {
    document.body.removeChild(textarea);
  }
}

/* ===== 교통수단별 안내 내용 ===== */

const routeTabContents = {
  subway: `
    <p><strong>지하철 이용 시</strong></p>
    <p>· 김포골드라인 <strong>장기역 1번 출구</strong> 하차</p>
    <p>· 1번 출구로 나와 횡단보도 2개 건너신 후, 한강중앙공원 방면 직진</p>
    <p>· 1층에 카페가 있는 <strong>한강뷰타워 건물 5층 MyFit 장기점</strong></p>
    <p>· 도보 시간: <strong>약 3분</strong></p>
  `,
  bus: `
    <p><strong>버스 이용 시</strong></p>
    <p>· 인근 정류장: <strong>장기역</strong>, <strong>뉴고려병원</strong>, <strong>장기주민센터</strong></p>
    <p>· 주요 노선</p>
    <p>  - 간선: 8600, 8601</p>
    <p>  - 지선: 22, 30, 60 등</p>
    <p>· 정류장에서 장기역 사거리 방향으로 도보 3~5분 거리</p>
  `,
  car: `
    <p><strong>자가용 이용 시</strong></p>
    <p>· 내비게이션 검색어: <strong>“MyFit 장기점”</strong> 또는 “한강뷰타워”</p>
    <p>· 김포대로 → 김포한강로 → 장기역 사거리에서 유턴 후 우회전</p>
    <p>· 건물 뒷편 지하 주차장 램프 진입 후, 엘리베이터로 5층 이동</p>
    <p>· 퇴근 시간(18~20시)에는 장기역 사거리 정체가 심하니, 대중교통 이용을 권장합니다.</p>
  `
};

function setRouteContent(type) {
  const container = document.getElementById("routeContent");
  if (!container) return;
  container.innerHTML = routeTabContents[type] || "";
}

function initRouteTabs() {
  const tabs = document.querySelectorAll(".route-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const type = tab.dataset.type;
      setRouteContent(type);
    });
  });

  setRouteContent("subway");
}

/* ===== 초기화 ===== */

document.addEventListener("DOMContentLoaded", () => {
  initMap();
  initRouteTabs();

  const btnRecenter = document.getElementById("btnRecenter");
  const btnKakaoDirection = document.getElementById("btnKakaoDirection");
  const btnNaverMap = document.getElementById("btnNaverMap");
  const btnCopyAddress = document.getElementById("btnCopyAddress");

  if (btnRecenter) btnRecenter.addEventListener("click", recenterMap);
  if (btnKakaoDirection) btnKakaoDirection.addEventListener("click", openKakaoDirection);
  if (btnNaverMap) btnNaverMap.addEventListener("click", openNaverMap);
  if (btnCopyAddress) btnCopyAddress.addEventListener("click", copyAddress);
});
