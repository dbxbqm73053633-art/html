// 공통 페이지 이동
function goPage(path) {
  window.location.href = path;
}

// 오늘의 추천 루틴 데이터 (5단계)
const TODAY_ROUTINE = {
  name: "전신 리셋 45분 루틴",
  goal: "전신 근육을 가볍게 깨우고, 다음 강도 높은 운동을 위한 베이스 만들기",
  duration: "45분",
  level: "난이도 · 보통",
  kcal: "예상 소모 320kcal",
  focusParts: ["전신", "코어 안정성", "자세 교정"],
  phases: [
    {
      phaseName: "1단계 · 준비 & 관절 풀기",
      time: "5분",
      detail: "몸을 깨우는 가벼운 준비 단계",
      exercises: [
        { name: "러닝머신 걷기", detail: "3분 · 아주 가볍게" },
        { name: "목·어깨·허리 워밍업", detail: "2분" }
      ]
    },
    {
      phaseName: "2단계 · 하체 활성화",
      time: "10분",
      detail: "하체 큰 근육을 가볍게 사용",
      exercises: [
        { name: "레그프레스", detail: "3세트 × 12회 (가벼운 중량)" },
        { name: "레그컬 또는 레그익스텐션", detail: "2세트 × 12회" }
      ]
    },
    {
      phaseName: "3단계 · 상체 + 등 중심",
      time: "12분",
      detail: "상체 당기는/미는 패턴 균형 맞추기",
      exercises: [
        { name: "랫풀다운", detail: "3세트 × 12회" },
        { name: "체스트프레스", detail: "3세트 × 12회" }
      ]
    },
    {
      phaseName: "4단계 · 코어 & 컨디셔닝",
      time: "10분",
      detail: "코어를 잡아주면서 심박수 올리기",
      exercises: [
        { name: "플랭크", detail: "3세트 × 30초" },
        { name: "버드독 또는 데드버그", detail: "2세트 × 10회" }
      ]
    },
    {
      phaseName: "5단계 · 쿨다운 & 스트레칭",
      time: "8분",
      detail: "호흡 정리 + 타이트한 부위 풀기",
      exercises: [
        { name: "천천히 걷기", detail: "3분" },
        { name: "하체·상체 스트레칭", detail: "5분 · 햄스트링/둔근/어깨" }
      ]
    }
  ]
};

// 요약 DOM
const nameEl = document.getElementById("routineName");
const goalEl = document.getElementById("routineGoal");
const durationEl = document.getElementById("routineDuration");
const levelEl = document.getElementById("routineLevel");
const kcalEl = document.getElementById("routineKcal");
const focusTagsEl = document.getElementById("focusTags");

// 단계 리스트 DOM
const phaseListEl = document.getElementById("phaseList");

// 오늘 라벨
const todayLabelEl = document.getElementById("todayLabel");

function formatTodayLabel() {
  const now = new Date();
  const yoil = "일월화수목금토"[now.getDay()];
  return `오늘 · ${now.getMonth() + 1}/${now.getDate()}(${yoil})`;
}

function renderSummary() {
  if (!nameEl) return;

  nameEl.textContent = TODAY_ROUTINE.name;
  goalEl.textContent = TODAY_ROUTINE.goal;
  durationEl.textContent = TODAY_ROUTINE.duration;
  levelEl.textContent = TODAY_ROUTINE.level;
  kcalEl.textContent = TODAY_ROUTINE.kcal;

  focusTagsEl.innerHTML = "";
  TODAY_ROUTINE.focusParts.forEach((part) => {
    const span = document.createElement("span");
    span.className = "tag-pill";
    span.textContent = part;
    focusTagsEl.appendChild(span);
  });

  if (todayLabelEl) {
    todayLabelEl.textContent = formatTodayLabel();
  }
}

function renderPhases() {
  if (!phaseListEl) return;

  phaseListEl.innerHTML = "";

  TODAY_ROUTINE.phases.forEach((p) => {
    const li = document.createElement("li");
    li.className = "phase-item";

    const header = document.createElement("div");
    header.className = "phase-header";

    const nameSpan = document.createElement("span");
    nameSpan.className = "phase-name";
    nameSpan.textContent = p.phaseName;

    const metaSpan = document.createElement("span");
    metaSpan.className = "phase-meta";
    metaSpan.textContent = `${p.time} · ${p.detail}`;

    header.appendChild(nameSpan);
    header.appendChild(metaSpan);

    const ul = document.createElement("ul");
    ul.className = "exercise-list";

    p.exercises.forEach((ex) => {
      const exLi = document.createElement("li");
      exLi.className = "exercise-item";

      const exName = document.createElement("span");
      exName.className = "exercise-name";
      exName.textContent = ex.name;

      const exDetail = document.createElement("span");
      exDetail.className = "exercise-detail";
      exDetail.textContent = ex.detail;

      exLi.appendChild(exName);
      exLi.appendChild(exDetail);
      ul.appendChild(exLi);
    });

    li.appendChild(header);
    li.appendChild(ul);
    phaseListEl.appendChild(li);
  });
}

// 루틴 시작 버튼 클릭 시: MY FIT와 연동하기 좋게 구조만 잡아둠
function startRoutine() {
  localStorage.setItem("fh_last_routine_name", TODAY_ROUTINE.name);
  localStorage.setItem("fh_last_routine_date", new Date().toISOString());
  goPage("myfit.html");
}

// 초기 렌더링
window.addEventListener("DOMContentLoaded", () => {
  renderSummary();
  renderPhases();
});
