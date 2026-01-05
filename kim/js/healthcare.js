// 공통 페이지 이동
function goPage(path) {
  window.location.href = path;
}

// 이름 표시 (마이핏/회원가입과 동일한 키 사용)
const hcUserNameEl = document.getElementById("hcUserName");
const hcStoredName = localStorage.getItem("fh_user_name");

if (hcUserNameEl) {
  if (hcStoredName && hcStoredName.trim() !== "") {
    hcUserNameEl.textContent = hcStoredName + "님의";
  } else {
    hcUserNameEl.textContent = "회원님의";
  }
}

/* ===== 오늘 컨디션 더미 데이터 ===== */

const recoveryScoreEl = document.getElementById("hcRecoveryScore");
const moodLabelEl = document.getElementById("hcMoodLabel");
const todayTypeEl = document.getElementById("hcTodayType");
const tagListEl = document.getElementById("hcTagList");
const restHrEl = document.getElementById("hcRestHr");
const stressEl = document.getElementById("hcStress");
const sleepEl = document.getElementById("hcSleep");
const waterEl = document.getElementById("hcWater");
const refreshBtn = document.getElementById("refreshConditionBtn");

const HISTORY_STRIP_EL = document.getElementById("hcHistoryStrip");
const HISTORY_LIST_EL = document.getElementById("hcHistoryList");

const YOIL_KR = ["일", "월", "화", "수", "목", "금", "토"];

function randomBetween(min, max, fixed = 0) {
  const val = Math.random() * (max - min) + min;
  return Number(val.toFixed(fixed));
}

function buildTags(mood) {
  const base = ["가벼운 스트레칭 완료", "수분 보충", "워밍업 철저히"];
  const good = ["고강도 세션도 소화 가능", "컨디션 상위 20%"];
  const normal = ["중강도 위주로 진행", "호흡·심박 체크하면서 운동"];
  const bad = ["오늘은 회복 위주", "과부하 주의"];

  if (mood === "좋음") return base.concat(good);
  if (mood === "보통") return base.concat(normal);
  return base.concat(bad);
}

function updateCondition() {
  const score = randomBetween(55, 95, 0);
  const restHr = randomBetween(58, 72, 0);
  const stress = randomBetween(25, 80, 0);
  const sleep = randomBetween(5.5, 8.5, 1);
  const water = randomBetween(1.0, 2.5, 1);

  let mood = "좋음";
  let emoji = "😊";
  let todayType = "중강도 근력";

  if (score >= 85) {
    mood = "최상";
    emoji = "🔥";
    todayType = "고강도 근력/HIIT";
  } else if (score >= 70) {
    mood = "좋음";
    emoji = "😊";
    todayType = "중강도 근력";
  } else if (score >= 60) {
    mood = "보통";
    emoji = "🙂";
    todayType = "가벼운 전신/유산소";
  } else {
    mood = "휴식 권장";
    emoji = "🌙";
    todayType = "회복·스트레칭 위주";
  }

  if (recoveryScoreEl) recoveryScoreEl.textContent = score;
  if (moodLabelEl) moodLabelEl.textContent = `${mood} ${emoji}`;
  if (todayTypeEl) todayTypeEl.textContent = todayType;
  if (restHrEl) restHrEl.textContent = restHr;
  if (stressEl) stressEl.textContent = stress;
  if (sleepEl) sleepEl.textContent = sleep;
  if (waterEl) waterEl.textContent = water;

  if (tagListEl) {
    tagListEl.innerHTML = "";
    buildTags(mood === "최상" ? "좋음" : mood).forEach((t) => {
      const span = document.createElement("span");
      span.className = "condition-tag";
      span.textContent = t;
      tagListEl.appendChild(span);
    });
  }

  renderHistory(score);
}

if (refreshBtn) {
  refreshBtn.addEventListener("click", updateCondition);
}

/* ===== 최근 7일 히스토리 (링 아이콘 버전) ===== */

function renderHistory(todayScore) {
  if (!HISTORY_STRIP_EL || !HISTORY_LIST_EL) return;

  HISTORY_STRIP_EL.innerHTML = "";
  HISTORY_LIST_EL.innerHTML = "";

  const today = new Date();

  // 최근 7일 점수 생성 (오늘 점수 포함)
  const scores = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    let score;
    if (i === 0) {
      score = todayScore;
    } else {
      score = randomBetween(55, 95, 0);
    }
    scores.push({ date: d, score });
  }

  scores.forEach(({ date, score }) => {
    const yoil = YOIL_KR[date.getDay()];
    const level =
      score >= 85 ? "높음" : score >= 70 ? "양호" : score >= 60 ? "보통" : "낮음";

    /* 색상/스타일 결정 */
    let fillGradient;
    let borderColor;

    if (score >= 85) {
      fillGradient = "linear-gradient(135deg,#22c55e,#16a34a)";
      borderColor = "#16a34a";
    } else if (score >= 70) {
      fillGradient = "linear-gradient(135deg,#4ade80,#22c55e)";
      borderColor = "#22c55e";
    } else if (score >= 60) {
      fillGradient = "linear-gradient(135deg,#facc15,#eab308)";
      borderColor = "#eab308";
    } else {
      fillGradient = "linear-gradient(135deg,#f97316,#ef4444)";
      borderColor = "#ef4444";
    }

    // 점수에 따라 안쪽 원 크기 조금씩 변경 (55~95 → 0.7~1.0 스케일)
    const scaleBase = 0.7;
    const scaleExtra = ((score - 55) / 40) * 0.3; // 최대 +0.3
    const scale = Math.min(1.0, Math.max(scaleBase, scaleBase + scaleExtra));

    /* 상단 링 아이콘 DOM */
    const dot = document.createElement("div");
    dot.className = "history-dot";
    dot.innerHTML = `
      <div class="history-ring" style="border-color:${borderColor}">
        <div class="history-ring-fill"
             style="background:${fillGradient}; transform:scale(${scale});"></div>
      </div>
      <span class="history-day-label">${yoil}</span>
    `;
    HISTORY_STRIP_EL.appendChild(dot);

    /* 아래 텍스트 리스트 */
    const li = document.createElement("li");
    li.className = "history-item";
    const month = date.getMonth() + 1;
    const day = date.getDate();
    li.innerHTML = `
      <span>${month}월 ${day}일 (${yoil})</span>
      <span>${score}점 · ${level}</span>
    `;
    HISTORY_LIST_EL.appendChild(li);
  });
}

/* ===== 메모 저장 (localStorage) ===== */

const memoEl = document.getElementById("hcMemo");
const memoSaveBtn = document.getElementById("hcMemoSaveBtn");
const memoStatusEl = document.getElementById("hcMemoStatus");
const MEMO_KEY = "fh_healthcare_memo_today";

function loadMemo() {
  if (!memoEl) return;
  const saved = localStorage.getItem(MEMO_KEY);
  if (saved) {
    memoEl.value = saved;
    if (memoStatusEl) memoStatusEl.textContent = "이전에 작성한 메모를 불러왔어요.";
  }
}

function saveMemo() {
  if (!memoEl) return;
  const text = memoEl.value.trim();
  localStorage.setItem(MEMO_KEY, text);
  if (memoStatusEl) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    memoStatusEl.textContent = `오늘 메모 저장됨 · ${hh}:${mm}`;
  }
}

if (memoSaveBtn) {
  memoSaveBtn.addEventListener("click", saveMemo);
}

/* 초기 실행 */
loadMemo();
updateCondition();
