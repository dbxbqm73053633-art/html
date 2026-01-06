// notice.js

function goPage(path) {
  window.location.href = path;
}

/**
 * 공지 데이터 (10개)
 * type: operation | event | system
 */
const NOTICE_DATA = [
  {
    id: 1,
    type: "operation",
    title: "설 연휴 센터 운영 시간 안내",
    content:
      "설 연휴(2/17~2/19) 동안 센터는 10:00~18:00 단축 운영됩니다. PT 수업은 담당 트레이너와 별도 조율 바랍니다.",
    date: "2026-02-10",
    tag: "운영시간"
  },
  {
    id: 2,
    type: "event",
    title: "2월 체지방 컷 챌린지 모집",
    content:
      "4주 동안 체지방률 2% 이상 감량 시, 인바디 1회 무료 + PT 1회 50% 할인 혜택을 드립니다.",
    date: "2026-02-05",
    tag: "이벤트"
  },
  {
    id: 3,
    type: "system",
    title: "모바일 회원증 바코드 오류 안내",
    content:
      "일부 안드로이드 기기에서 바코드 인식이 원활하지 않은 문제가 확인되었습니다. 앱을 최신 버전으로 업데이트 후 다시 시도해주세요.",
    date: "2026-01-28",
    tag: "앱 업데이트"
  },
  {
    id: 4,
    type: "operation",
    title: "새로운 스미스 머신 입고 및 배치 변경",
    content:
      "웨이트 존에 스미스 머신 1대가 추가 입고되며, 3번 파워랙 위치가 소폭 조정됩니다.",
    date: "2026-01-20",
    tag: "시설 안내"
  },
  {
    id: 5,
    type: "event",
    title: "주말 무료 PT 체험 데이",
    content:
      "매월 첫째 주 토요일, 신규 회원 대상 1:1 PT 20분 무료 체험을 진행합니다. 선착순 예약제로 운영됩니다.",
    date: "2026-01-15",
    tag: "프로모션"
  },
  {
    id: 6,
    type: "operation",
    title: "샤워실 정기 점검 안내",
    content:
      "매주 수요일 14:00~15:00 사이 샤워실/사우나 정기 점검으로 이용이 제한됩니다.",
    date: "2026-01-10",
    tag: "시설 점검"
  },
  {
    id: 7,
    type: "system",
    title: "푸시 알림 설정 관련 안내",
    content:
      "예약 알림, 출석 리마인더를 받으시려면 앱 설정 > 알림 허용을 ON으로 변경해주세요.",
    date: "2026-01-05",
    tag: "알림 설정"
  },
  {
    id: 8,
    type: "event",
    title: "친구 추천 프로그램 오픈",
    content:
      "지인 추천 가입 시, 추천인·피추천인 모두 인바디 1회 무료 이용 혜택을 드립니다.",
    date: "2025-12-28",
    tag: "추천 이벤트"
  },
  {
    id: 9,
    type: "operation",
    title: "주차 등록 정책 변경 안내",
    content:
      "무료 주차 2시간 제공 후, 추가 시간은 유료로 전환됩니다. 자세한 내용은 데스크를 확인해주세요.",
    date: "2025-12-20",
    tag: "주차 안내"
  },
  {
    id: 10,
    type: "system",
    title: "데이터 백업 점검 공지",
    content:
      "다음 주 일요일 새벽 2시~4시 사이, 서버 점검으로 일부 기능 이용이 제한될 수 있습니다.",
    date: "2025-12-10",
    tag: "시스템 점검"
  }
];

const filterTabs = document.querySelectorAll(".filter-tab");
const noticeListEl = document.getElementById("noticeList");
const noticeCountBadgeEl = document.getElementById("noticeCountBadge");

let currentFilter = "all";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const yoil = "일월화수목금토"[d.getDay()];
  return `${m}/${day}(${yoil})`;
}

function getFilteredNotices() {
  if (currentFilter === "all") return NOTICE_DATA;
  return NOTICE_DATA.filter((n) => n.type === currentFilter);
}

function updateCountBadge() {
  if (!noticeCountBadgeEl) return;
  const count = getFilteredNotices().length;
  if (currentFilter === "all") {
    noticeCountBadgeEl.textContent = `총 ${NOTICE_DATA.length}건`;
  } else {
    noticeCountBadgeEl.textContent = `총 ${count}건`;
  }
}

function createCategoryClass(type) {
  if (type === "operation") return "operation";
  if (type === "event") return "event";
  if (type === "system") return "system";
  return "";
}

function createCategoryLabel(type) {
  if (type === "operation") return "운영 안내";
  if (type === "event") return "이벤트";
  if (type === "system") return "시스템";
  return "기타";
}

function renderNotices() {
  if (!noticeListEl) return;

  const list = getFilteredNotices();
  noticeListEl.innerHTML = "";

  if (list.length === 0) {
    const li = document.createElement("li");
    li.className = "notice-empty";
    li.textContent = "해당 카테고리에 등록된 공지사항이 없습니다.";
    noticeListEl.appendChild(li);
    updateCountBadge();
    return;
  }

  list
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1)) // 최신순
    .forEach((n) => {
      const li = document.createElement("li");
      li.className = "notice-item";

      const left = document.createElement("div");
      left.className = "notice-left";
      const bullet = document.createElement("div");
      bullet.className = "notice-bullet";
      bullet.textContent = "N";
      left.appendChild(bullet);

      const body = document.createElement("div");
      body.className = "notice-body";

      const header = document.createElement("div");
      header.className = "notice-header";

      const titleSpan = document.createElement("span");
      titleSpan.className = "notice-title";
      titleSpan.textContent = n.title;

      const dateSpan = document.createElement("span");
      dateSpan.className = "notice-date";
      dateSpan.textContent = formatDate(n.date);

      header.appendChild(titleSpan);
      header.appendChild(dateSpan);

      const metaRow = document.createElement("div");
      metaRow.className = "notice-meta-row";

      const catSpan = document.createElement("span");
      catSpan.className =
        "notice-category " + createCategoryClass(n.type);
      catSpan.textContent = createCategoryLabel(n.type);

      const tagSpan = document.createElement("span");
      tagSpan.className = "notice-tag";
      tagSpan.textContent = n.tag;

      metaRow.appendChild(catSpan);
      metaRow.appendChild(tagSpan);

      const contentP = document.createElement("p");
      contentP.className = "notice-content";
      contentP.textContent = n.content;

      body.appendChild(header);
      body.appendChild(metaRow);
      body.appendChild(contentP);

      li.appendChild(left);
      li.appendChild(body);

      noticeListEl.appendChild(li);
    });

  updateCountBadge();
}

// 필터 탭 이벤트
filterTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    filterTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentFilter = tab.dataset.filter;
    renderNotices();
  });
});

// 초기 렌더링
window.addEventListener("DOMContentLoaded", () => {
  renderNotices();
});
