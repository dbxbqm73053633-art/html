// 공통 페이지 이동
function goPage(path) {
  window.location.href = path;
}

/* ===== 유저 이름 / 기준 시각 ===== */

const facilityUserNameEl = document.getElementById("facilityUserName");
const facilityDateLabelEl = document.getElementById("facilityDateLabel");
const storedName = localStorage.getItem("fh_user_name");

if (facilityUserNameEl) {
  if (storedName && storedName.trim() !== "") {
    facilityUserNameEl.textContent = storedName + "님,";
  } else {
    facilityUserNameEl.textContent = "회원님,";
  }
}

function updateTimeLabel() {
  if (!facilityDateLabelEl) return;
  const now = new Date();
  const YOIL_KR = ["일", "월", "화", "수", "목", "금", "토"];
  const yoil = YOIL_KR[now.getDay()];
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");

  facilityDateLabelEl.textContent = `${month}월 ${date}일 (${yoil}) · ${hh}:${mm} 기준`;
}

updateTimeLabel();

/* ===== 시설 데이터 =====
   type: workout | relax | infra
*/

const FACILITIES = [
  {
    id: "f1",
    name: "프리웨이트 존",
    type: "workout",
    floor: "2F",
    openTime: "06:00 ~ 23:00",
    baseCapacity: 32,
    description: "스쿼트랙, 벤치프레스, 덤벨존 등 근력 위주 장비 구역",
    tag: "근력"
  },
  {
    id: "f2",
    name: "머신 존",
    type: "workout",
    floor: "2F",
    openTime: "06:00 ~ 23:00",
    baseCapacity: 28,
    description: "초보자도 쉽게 이용 가능한 풀머신 라인업",
    tag: "머신"
  },
  {
    id: "f3",
    name: "러닝 & 유산소 존",
    type: "workout",
    floor: "3F",
    openTime: "06:00 ~ 23:00",
    baseCapacity: 24,
    description: "트레드밀, 싸이클, 계단오르기 등 유산소 장비",
    tag: "유산소"
  },
  {
    id: "f4",
    name: "GX 스튜디오",
    type: "workout",
    floor: "3F",
    openTime: "정시 클래스 기준",
    baseCapacity: 20,
    description: "요가, 필라테스, 줌바 등 그룹 수업이 열리는 공간",
    tag: "그룹수업"
  },
  {
    id: "f5",
    name: "스트레칭 & 코어 존",
    type: "workout",
    floor: "2F",
    openTime: "06:00 ~ 23:00",
    baseCapacity: 14,
    description: "매트, 폼롤러, 슬링 등 회복/코어 트레이닝 구역",
    tag: "스트레칭"
  },
  {
    id: "f6",
    name: "사우나 · 샤워실",
    type: "relax",
    floor: "B1",
    openTime: "06:00 ~ 23:30",
    baseCapacity: 18,
    description: "운동 후 피로 회복을 위한 사우나 & 샤워 시설",
    tag: "휴식"
  },
  {
    id: "f7",
    name: "라운지 & 카페",
    type: "relax",
    floor: "1F",
    openTime: "08:00 ~ 22:00",
    baseCapacity: 26,
    description: "간단한 음료와 프로틴, 상담이 가능한 라운지",
    tag: "라운지"
  },
  {
    id: "f8",
    name: "락커룸 / 탈의실",
    type: "infra",
    floor: "B1",
    openTime: "06:00 ~ 24:00",
    baseCapacity: 40,
    description: "개인 락커, 탈의 공간, 기본 어메니티 제공",
    tag: "공용"
  }
];

/* ===== 랜덤 혼잡도 / 이용률 생성 ===== */

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCongestionInfo(current, capacity) {
  const ratio = capacity === 0 ? 0 : current / capacity;
  if (ratio <= 0.4) {
    return { level: "low", label: "여유" };
  } else if (ratio <= 0.7) {
    return { level: "medium", label: "보통" };
  } else {
    return { level: "high", label: "혼잡" };
  }
}

/* ===== 렌더링 ===== */

const facilityListEl = document.getElementById("facilityList");
const filterChips = document.querySelectorAll(".filter-chip");
const refreshBtn = document.getElementById("refreshFacilityBtn");

let currentFilter = "all";

function generateStatusForFacility(facility) {
  const now = new Date();
  const hour = now.getHours();

  // 간단 예시: 0~5시는 운영 종료
  const isOpen = hour >= 6 && hour <= 23;

  const currentUse = isOpen
    ? randomBetween(
        Math.floor(facility.baseCapacity * 0.2),
        Math.floor(facility.baseCapacity * 0.9)
      )
    : 0;

  const { level, label } = getCongestionInfo(currentUse, facility.baseCapacity);

  return {
    isOpen,
    currentUse,
    congestionLevel: level,
    congestionLabel: label
  };
}

function renderFacilities() {
  if (!facilityListEl) return;
  facilityListEl.innerHTML = "";

  let list = FACILITIES.slice();

  if (currentFilter !== "all") {
    list = list.filter((f) => f.type === currentFilter);
  }

  // 정렬: 정원 큰 순(주요 시설 위쪽)
  list.sort((a, b) => b.baseCapacity - a.baseCapacity);

  list.forEach((facility) => {
    const status = generateStatusForFacility(facility);
    const li = document.createElement("li");
    li.className = "facility-card";

    const usageRatio =
      facility.baseCapacity === 0
        ? 0
        : Math.round((status.currentUse / facility.baseCapacity) * 100);

    const badgeClass = status.isOpen ? "badge-open" : "badge-closed";
    const badgeText = status.isOpen ? "운영 중" : "운영 종료";

    const headerHtml = `
      <div class="facility-header">
        <div class="facility-main">
          <div class="facility-name">${facility.name}</div>
          <div class="facility-meta">
            ${facility.floor} · ${facility.tag} · 정원 ${facility.baseCapacity}명
          </div>
        </div>
        <span class="${badgeClass}">${badgeText}</span>
      </div>
    `;

    const congestionClass = `congestion-pill ${status.congestionLevel}`;
    const congestionDotClass = `congestion-dot ${status.congestionLevel}`;

    const bodyHtml = `
      <div class="facility-body">
        <div>
          <strong>혼잡도</strong>
          <div class="${congestionClass}">
            <span class="${congestionDotClass}"></span>
            <span>${status.congestionLabel}</span>
          </div>
        </div>
        <div>
          <strong>예상 이용 인원</strong>
          <div>${status.currentUse}명 / ${facility.baseCapacity}명</div>
        </div>
        <div>
          <strong>운영 시간</strong>
          <div>${facility.openTime}</div>
        </div>
        <div>
          <strong>안내</strong>
          <div>${facility.description}</div>
        </div>
        <div style="grid-column: 1 / -1;">
          <strong>현재 이용률</strong>
          <div class="usage-bar-wrap">
            <div class="usage-bar-inner" style="width:${usageRatio}%;"></div>
          </div>
        </div>
      </div>
    `;

    li.innerHTML = headerHtml + bodyHtml;
    facilityListEl.appendChild(li);
  });
}

/* 필터 이벤트 */
filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    filterChips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    currentFilter = chip.dataset.filter || "all";
    renderFacilities();
  });
});

/* 새로고침 버튼 */
if (refreshBtn) {
  refreshBtn.addEventListener("click", () => {
    updateTimeLabel();
    renderFacilities();
  });
}

/* 초기 렌더링 */
renderFacilities();
