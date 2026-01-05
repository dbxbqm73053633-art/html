// 공통 페이지 이동
function goPage(path) {
  window.location.href = path;
}

// 상단 이름 (회원가입에서 저장한 이름 사용)
const nameFromStorage = localStorage.getItem("fh_user_name");
const userNameEl = document.getElementById("myfitUserName");

if (userNameEl) {
  if (nameFromStorage && nameFromStorage.trim() !== "") {
    userNameEl.textContent = nameFromStorage;
  } else {
    userNameEl.textContent = "맨시";
  }
}

// 날짜 라벨을 오늘 기준으로 표시
const dateLabelEl = document.getElementById("myfitDateLabel");
if (dateLabelEl) {
  const today = new Date();
  const yoil = ["일", "월", "화", "수", "목", "금", "토"][today.getDay()];
  const month = today.getMonth() + 1;
  const date = today.getDate();
  dateLabelEl.textContent = `${month}월 ${date}일 (${yoil})`;
}

/* ====== 오늘 운동 타이머 ====== */

const timerEl = document.getElementById("todayTimer");
const startBtn = document.getElementById("startTodayBtn");
const resetBtn = document.getElementById("resetTodayBtn");
const statusDot = document.getElementById("todayStatus");

let isRunning = false;
let startTimestamp = 0;
let elapsedMs = 0;
let timerInterval = null;

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function updateTimer() {
  const now = Date.now();
  const diff = now - startTimestamp + elapsedMs;
  timerEl.textContent = formatTime(diff);
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startTimestamp = Date.now();
  timerInterval = setInterval(updateTimer, 500);
  startBtn.textContent = "일시 정지";
  statusDot.classList.add("active");
}

function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  const now = Date.now();
  elapsedMs += now - startTimestamp;
  startBtn.textContent = "다시 시작";
  statusDot.classList.remove("active");
}

function resetTimer() {
  isRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  elapsedMs = 0;
  startTimestamp = 0;
  if (timerEl) timerEl.textContent = "00:00:00";
  if (startBtn) startBtn.textContent = "오늘 운동 시작";
  if (statusDot) statusDot.classList.remove("active");
}

if (startBtn && resetBtn && timerEl && statusDot) {
  startBtn.addEventListener("click", () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  resetBtn.addEventListener("click", resetTimer);
}

/* ====== 이번 주 운동 기록 리스트 ====== */

const workoutListEl = document.getElementById("workoutList");
const YOIL_KR = ["일", "월", "화", "수", "목", "금", "토"];

// 이번 주(월~일) 날짜 계산 + 더미 데이터
function getThisWeekWorkouts() {
  const today = new Date();
  const day = today.getDay(); // 0(일)~6(토)
  const diffToMonday = (day + 6) % 7; // 월=0이 되도록
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffToMonday);

  const templates = [
    { title: "전신 근력 루틴", type: "근력", kcal: 320, distance: 0, duration: "00:55:10" },
    { title: "런닝머신 인터벌", type: "유산소", kcal: 280, distance: 4.2, duration: "00:42:30" },
    { title: "하체 집중 루틴", type: "하체", kcal: 350, distance: 0, duration: "01:05:20" },
    { title: "상체 + 코어", type: "상체/코어", kcal: 300, distance: 0, duration: "00:50:00" },
    { title: "가벼운 조깅", type: "유산소", kcal: 210, distance: 3.5, duration: "00:35:10" },
    { title: "휴식 또는 스트레칭", type: "회복", kcal: 80, distance: 0, duration: "00:20:00" },
    { title: "프리 프로그램", type: "자유운동", kcal: 260, distance: 2.3, duration: "00:45:00" }
  ];

  const list = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const t = templates[i];
    list.push({
      date: d,
      title: t.title,
      type: t.type,
      kcal: t.kcal,
      distance: t.distance,
      duration: t.duration,
      isToday:
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
    });
  }

  return list;
}

function renderWorkouts() {
  if (!workoutListEl) return;
  workoutListEl.innerHTML = "";

  const workouts = getThisWeekWorkouts();

  workouts.forEach((w) => {
    const li = document.createElement("li");
    li.className = "workout-card";

    const yoil = YOIL_KR[w.date.getDay()];
    const month = w.date.getMonth() + 1;
    const date = w.date.getDate();

    li.innerHTML = `
      <div class="workout-top-row">
        <div>
          <div class="workout-day">${month}월 ${date}일 (${yoil})</div>
          <div class="workout-day-sub">${w.isToday ? "오늘" : "이번 주 기록"}</div>
        </div>
        <span class="workout-badge">${w.type}</span>
      </div>

      <div class="workout-main">
        <div class="workout-thumb">
          <img src="./images/마이2.png" alt="${w.title}">
        </div>
        <div class="workout-text">
          <h4>${w.title}</h4>
          <p class="goal">${w.isToday ? "진행 중 / 최근 기록" : "완료된 세션"}</p>
          <p class="time">세션 시간: ${w.duration}</p>
        </div>
      </div>

      <div class="workout-stats-bottom">
        <div class="stat-block">
          <span class="stat-label">거리</span>
          <span class="stat-main">
            ${w.distance.toFixed(1)}<span class="unit">km</span>
          </span>
        </div>
        <div class="stat-block">
          <span class="stat-label">소모 칼로리</span>
          <span class="stat-main">
            ${w.kcal}<span class="unit">kcal</span>
          </span>
        </div>
        <div class="stat-block">
          <span class="stat-label">세션 유형</span>
          <span class="stat-main">${w.type}</span>
        </div>
        <div class="stat-block">
          <span class="stat-label">진행 상태</span>
          <span class="stat-main">${w.isToday ? "오늘" : "완료"}</span>
        </div>
      </div>
    `;

    workoutListEl.appendChild(li);
  });
}

// 초기 렌더링
renderWorkouts();
