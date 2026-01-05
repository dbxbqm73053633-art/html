// 공통 페이지 이동
function goPage(path) {
  window.location.href = path;
}

// 상단 이름 (localStorage에 저장된 이름 사용)
const planUserNameEl = document.getElementById("planUserName");
const storedName = localStorage.getItem("fh_user_name");

if (planUserNameEl) {
  if (storedName && storedName.trim() !== "") {
    planUserNameEl.textContent = storedName + "님의";
  } else {
    planUserNameEl.textContent = "회원님의";
  }
}

// 목표별 데이터
const PLAN_DATA = {
  diet: {
    label: "다이어트 · 주 4회",
    total: 4,
    done: 1,
    time: "4h 20m",
    todayFocus: "하체 + 유산소",
    duration: "예상 60분",
    intensity: "난이도 중상",
    exercises: [
      { name: "스쿼트 머신", meta: "4세트 · 12회", tag: "하체" },
      { name: "런지 워킹", meta: "3세트 · 20보", tag: "하체" },
      { name: "런닝머신 인터벌", meta: "20분 · 1분 빠르게/1분 천천히", tag: "유산소" },
      { name: "플랭크", meta: "3세트 · 40초", tag: "코어" }
    ],
    weekPlan: [
      { day: "월", focus: "상체 + 코어", type: "근력" },
      { day: "화", focus: "하체 + 유산소", type: "다이어트" },
      { day: "수", focus: "전신 서킷", type: "서킷" },
      { day: "목", focus: "휴식 또는 스트레칭", type: "회복" },
      { day: "금", focus: "하체 집중", type: "근력" },
      { day: "토", focus: "가벼운 조깅", type: "유산소" },
      { day: "일", focus: "완전 휴식", type: "휴식" }
    ]
  },
  bulk: {
    label: "벌크업 · 주 5회",
    total: 5,
    done: 0,
    time: "6h 10m",
    todayFocus: "상체 고중량",
    duration: "예상 75분",
    intensity: "난이도 상",
    exercises: [
      { name: "벤치 프레스", meta: "5세트 · 5~8회", tag: "가슴" },
      { name: "바벨 로우", meta: "4세트 · 8회", tag: "등" },
      { name: "숄더 프레스", meta: "4세트 · 10회", tag: "어깨" },
      { name: "사이드 레터럴 레이즈", meta: "3세트 · 15회", tag: "보조" }
    ],
    weekPlan: [
      { day: "월", focus: "가슴 + 삼두", type: "근비대" },
      { day: "화", focus: "등 + 이두", type: "근비대" },
      { day: "수", focus: "하체", type: "근력" },
      { day: "목", focus: "어깨 + 코어", type: "근비대" },
      { day: "금", focus: "전신 보충", type: "보조" },
      { day: "토", focus: "가벼운 유산소", type: "회복" },
      { day: "일", focus: "휴식", type: "휴식" }
    ]
  },
  posture: {
    label: "체형 교정 · 주 3회",
    total: 3,
    done: 0,
    time: "3h 00m",
    todayFocus: "자세 교정 & 스트레칭",
    duration: "예상 50분",
    intensity: "난이도 중",
    exercises: [
      { name: "고관절 스트레칭", meta: "각 3세트 · 30초", tag: "스트레칭" },
      { name: "밴드 로우", meta: "3세트 · 15회", tag: "등" },
      { name: "힙 브릿지", meta: "3세트 · 15회", tag: "엉덩이" },
      { name: "목/어깨 릴리즈", meta: "폼롤러 10분", tag: "이완" }
    ],
    weekPlan: [
      { day: "월", focus: "골반/척추 정렬", type: "교정" },
      { day: "화", focus: "가벼운 걷기", type: "유산소" },
      { day: "수", focus: "어깨 자세 교정", type: "교정" },
      { day: "목", focus: "휴식", type: "휴식" },
      { day: "금", focus: "전신 스트레칭", type: "회복" },
      { day: "토", focus: "코어 안정화", type: "코어" },
      { day: "일", focus: "휴식", type: "휴식" }
    ]
  },
  health: {
    label: "건강 유지 · 주 3~4회",
    total: 4,
    done: 0,
    time: "3h 40m",
    todayFocus: "가볍게 전신 운동",
    duration: "예상 45분",
    intensity: "난이도 하~중",
    exercises: [
      { name: "빠른 걷기", meta: "20분", tag: "유산소" },
      { name: "레그프레스", meta: "3세트 · 15회", tag: "하체" },
      { name: "랫풀다운", meta: "3세트 · 12회", tag: "등" },
      { name: "크런치", meta: "3세트 · 20회", tag: "코어" }
    ],
    weekPlan: [
      { day: "월", focus: "전신 가볍게", type: "밸런스" },
      { day: "화", focus: "빠른 걷기", type: "유산소" },
      { day: "수", focus: "근력 + 스트레칭", type: "밸런스" },
      { day: "목", focus: "휴식", type: "휴식" },
      { day: "금", focus: "전신 서킷", type: "밸런스" },
      { day: "토", focus: "조깅 또는 자전거", type: "유산소" },
      { day: "일", focus: "휴식", type: "휴식" }
    ]
  }
};

const goalChips = document.querySelectorAll(".goal-chip");
const summaryLabelEl = document.getElementById("summaryLabel");
const statTotalEl = document.getElementById("statTotal");
const statDoneEl = document.getElementById("statDone");
const statRemainEl = document.getElementById("statRemain");
const statTimeEl = document.getElementById("statTime");
const todayFocusLabelEl = document.getElementById("todayFocusLabel");
const routineDurationEl = document.getElementById("routineDuration");
const routineIntensityEl = document.getElementById("routineIntensity");
const todayBadgeEl = document.getElementById("todayBadge");
const exerciseListEl = document.getElementById("exerciseList");
const dayPlanListEl = document.getElementById("dayPlanList");

const YOIL_KR = ["일", "월", "화", "수", "목", "금", "토"];

function getTodayYoil() {
  const today = new Date();
  return YOIL_KR[today.getDay()];
}

function renderPlan(goalKey) {
  const data = PLAN_DATA[goalKey];
  if (!data) return;

  // 요약
  summaryLabelEl.textContent = data.label;
  statTotalEl.textContent = data.total;
  statDoneEl.textContent = data.done;
  statRemainEl.textContent = data.total - data.done;
  statTimeEl.textContent = data.time;

  // 오늘 루틴
  todayFocusLabelEl.textContent = data.todayFocus;
  routineDurationEl.textContent = data.duration;
  routineIntensityEl.textContent = data.intensity;
  todayBadgeEl.textContent = `D-${Math.max(data.total - data.done, 1)} / ${data.total}세션`;

  // 운동 리스트
  exerciseListEl.innerHTML = "";
  data.exercises.forEach((ex) => {
    const li = document.createElement("li");
    li.className = "exercise-item";
    li.innerHTML = `
      <div class="exercise-main">
        <span class="exercise-name">${ex.name}</span>
        <span class="exercise-meta">${ex.meta}</span>
      </div>
      <span class="exercise-tag">${ex.tag}</span>
    `;
    exerciseListEl.appendChild(li);
  });

  // 요일별 계획
  const todayYoil = getTodayYoil();
  dayPlanListEl.innerHTML = "";

  data.weekPlan.forEach((d) => {
    const li = document.createElement("li");
    li.className = "day-plan-item";
    if (d.day === todayYoil) {
      li.classList.add("today");
    }

    li.innerHTML = `
      <div class="day-main">
        <span class="day-name">${d.day}요일</span>
        <span class="day-focus">${d.focus}</span>
      </div>
      <span class="day-badge">${d.type}</span>
    `;
    dayPlanListEl.appendChild(li);
  });
}

// 목표 버튼 클릭
goalChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    goalChips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    const goal = chip.dataset.goal;
    renderPlan(goal);
  });
});

// 초기 렌더링: 다이어트
renderPlan("diet");
