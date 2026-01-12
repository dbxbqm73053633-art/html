// 요소
const nameEl = document.getElementById("memberName");
const idEl = document.getElementById("memberId");
const typeEl = document.getElementById("memberType");
const cardEl = document.getElementById("membershipCard");
const historyList = document.getElementById("historyList");
const selectedDateLabel = document.getElementById("selectedDateLabel");
const calendarEl = document.getElementById("historyCalendar");

// 🔹 회원 정보 (나중에 API 연동 가능)
const member = {
  name: localStorage.getItem("fh_user_name") || "김영우",
  id: "FH-2025-0007",
  type: "프리미엄", // 일반 / PT / 프리미엄
};

// 화면에 기본 정보 반영
nameEl.textContent = member.name;
idEl.textContent = member.id;
typeEl.textContent = member.type;

// 🔹 유형별 카드 테마 적용
switch (member.type) {
  case "일반":
    cardEl.classList.add("normal");
    break;
  case "PT":
    cardEl.classList.add("pt");
    break;
  case "프리미엄":
    cardEl.classList.add("premium");
    break;
}

// 🔹 최근 7일 히스토리 샘플 데이터
// key: 'YYYY-MM-DD', value: ["입장 · 09:12", "퇴장 · 10:44", ...]
const today = new Date();
today.setHours(0, 0, 0, 0);

const toKey = (d) => d.toISOString().slice(0, 10);

// 예시 데이터 (원하면 실제 데이터로 교체)
const historyByDate = {};
historyByDate[toKey(today)] = ["입장 · 09:12", "퇴장 · 10:44", "입장 · 19:01", "퇴장 · 20:10"];

const d1 = new Date(today);
d1.setDate(today.getDate() - 1);
historyByDate[toKey(d1)] = ["입장 · 18:50", "퇴장 · 20:02"];

const d2 = new Date(today);
d2.setDate(today.getDate() - 2);
historyByDate[toKey(d2)] = ["입장 · 07:10", "퇴장 · 08:00"];

const d4 = new Date(today);
d4.setDate(today.getDate() - 4);
historyByDate[toKey(d4)] = []; // 방문 X 예시

// 🔹 7일 달력 렌더링
const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

let selectedKey = toKey(today);

function renderCalendar() {
  calendarEl.innerHTML = "";
  // 6일 전 ~ 오늘까지 왼쪽 → 오른쪽
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    const key = toKey(d);

    const logs = historyByDate[key] || [];
    const visitedCount = logs.length;

    const dayEl = document.createElement("button");
    dayEl.type = "button";
    dayEl.className = "history-day";
    dayEl.dataset.dateKey = key;

    if (visitedCount > 1) {
      dayEl.classList.add("visited-multi");
    } else if (visitedCount === 1) {
      dayEl.classList.add("visited");
    }

    if (key === selectedKey) {
      dayEl.classList.add("active");
    }

    const dowSpan = document.createElement("div");
    dowSpan.className = "dow";
    dowSpan.textContent = DAYS[d.getDay()];

    const dateSpan = document.createElement("div");
    dateSpan.className = "date";
    dateSpan.textContent = d.getDate();

    const dotSpan = document.createElement("div");
    dotSpan.className = "status-dot";

    dayEl.appendChild(dowSpan);
    dayEl.appendChild(dateSpan);
    dayEl.appendChild(dotSpan);

    dayEl.addEventListener("click", () => {
      selectedKey = key;
      renderCalendar();
      renderHistory();
    });

    calendarEl.appendChild(dayEl);
  }
}

// 🔹 선택한 날짜 기록 렌더링
function renderHistory() {
  const logs = historyByDate[selectedKey] || [];
  historyList.innerHTML = "";

  const d = new Date(selectedKey);
  const isToday = toKey(today) === selectedKey;

  const labelPrefix = isToday ? "오늘" : `${d.getMonth() + 1}월 ${d.getDate()}일`;
  selectedDateLabel.textContent = `${labelPrefix} 입·퇴장 기록`;

  if (logs.length === 0) {
    const li = document.createElement("li");
    li.textContent = "방문 기록이 없습니다.";
    historyList.appendChild(li);
    return;
  }

  logs.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    historyList.appendChild(li);
  });
}

// 초기 렌더링
renderCalendar();
renderHistory();

// 뒤로가기
function goBack() {
  window.location.href = "main.html";
}
// 공지 페이지로 이동 (준비되면 notice.html 등으로 연결)
function openNotice() {
  // 나중에 실제 공지 리스트 페이지로 바꾸면 됨
  window.location.href = "notice.html";
}