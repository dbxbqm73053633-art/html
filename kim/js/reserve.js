function goPage(path){
  window.location.href = path;
}

/* ===== 날짜/요일 처리 ===== */

const dateChips = document.querySelectorAll(".date-chip");
const selectedDateText = document.getElementById("selectedDateText");
const todayBtn = document.getElementById("todayBtn");
const trainerListEl = document.getElementById("trainerList");
const modeTabs = document.querySelectorAll(".mode-tab");

const YOIL_KR = ["일","월","화","수","목","금","토"];

let selectedDate = "2026-01-01";  // 기본 선택
let currentMode = "group";        // group | pt

/* ===== 트레이너 데이터 =====
   weekday: 0(일) ~ 6(토)
*/

const TRAINERS = {
  group: [
    {
      id: "g1",
      name: "김운동",
      role: "전신 그룹 수업",
      img: "./images/선생1.png",
      days: [0,2,4] // 일, 화, 목
    },
    {
      id: "g2",
      name: "이유산",
      role: "유산소 서킷",
      img: "./images/선생2.png",
      days: [1,3,5] // 월, 수, 금
    },
    {
      id: "g3",
      name: "박코어",
      role: "코어 & 스트레칭",
      img: "./images/선생3.png",
      days: [2,4,6] // 화, 목, 토
    },
    {
      id: "g4",
      name: "정하체",
      role: "하체 집중 클래스",
      img: "./images/선생4.png",
      days: [1,5] // 월, 금
    },
    {
      id: "g5",
      name: "최모닝",
      role: "모닝 부트캠프",
      img: "./images/선생5.png",
      days: [1,2,3] // 월, 화, 수
    },
    {
      id: "g6",
      name: "한저녁",
      role: "퇴근 후 리셋 클래스",
      img: "./images/선생6.png",
      days: [4,5] // 목, 금
    },
    {
      id: "g7",
      name: "오주말",
      role: "주말 스페셜 WOD",
      img: "./images/선생7.png",
      days: [6,0] // 토, 일
    },
    {
      id: "g8",
      name: "문밸런스",
      role: "밸런스 요가",
      img: "./images/선생8.png",
      days: [2,4] // 화, 목
    }
  ],
  pt: [
    {
      id: "p1",
      name: "레이디핏",
      role: "여성 전담 PT",
      img: "./images/선생9.png",
      days: [1,3,5] // 월, 수, 금
    },
    {
      id: "p2",
      name: "홍복근",
      role: "파워 리프팅",
      img: "./images/선생10.png",
      days: [2,4,6] // 화, 목, 토
    },
    {
      id: "p3",
      name: "김진짜",
      role: "체형 교정 PT",
      img: "./images/선생11.png",
      days: [0,2,5] // 일, 화, 금
    },
    {
      id: "p4",
      name: "박집중",
      role: "집중 다이어트",
      img: "./images/선생12.png",
      days: [1,4] // 월, 목
    },
    {
      id: "p5",
      name: "최지구력",
      role: "지구력 강화",
      img: "./images/선생13.png",
      days: [3,6] // 수, 토
    },
    {
      id: "p6",
      name: "오린이",
      role: "헬린이 전담",
      img: "./images/선생14.png",
      days: [1,2,3] // 월, 화, 수
    },
    {
      id: "p7",
      name: "한시니어",
      role: "시니어 맞춤 PT",
      img: "./images/선생15.png",
      days: [0,5] // 일, 금
    },
    {
      id: "p8",
      name: "문컨디션",
      role: "컨디션 케어",
      img: "./images/선생2.png",
      days: [2,4,6] // 화, 목, 토
    }
  ]
};

/* ===== 렌더링 함수 ===== */

function updateSelectedDateLabel(){
  const d = new Date(selectedDate);
  const yoil = YOIL_KR[d.getDay()];
  selectedDateText.textContent =
    `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")} ${yoil}요일`;
}

function renderTrainers(){
  const d = new Date(selectedDate);
  const weekday = d.getDay(); // 0 ~ 6
  const trainers = TRAINERS[currentMode];

  trainerListEl.innerHTML = "";

  trainers.forEach(t=>{
    const li = document.createElement("li");
    li.className = "trainer-card";

    const profile = document.createElement("div");
    profile.className = "profile";

    const img = document.createElement("img");
    img.src = t.img;
    img.alt = t.name;

    const textBox = document.createElement("div");
    textBox.className = "profile-text";

    const nameP = document.createElement("p");
    nameP.className = "name";
    nameP.textContent = t.name;

    const roleP = document.createElement("p");
    roleP.className = "role";
    roleP.textContent = t.role;

    textBox.appendChild(nameP);
    textBox.appendChild(roleP);

    profile.appendChild(img);
    profile.appendChild(textBox);

    const statusBox = document.createElement("div");
    statusBox.className = "status";

    const badge = document.createElement("span");
    badge.className = "badge";

    const isAvailable = t.days.includes(weekday);

    if(isAvailable){
      badge.classList.add("available");
      badge.textContent = "선택 가능";
    }else{
      badge.classList.add("unavailable");
      badge.textContent = "불가능";
    }

    const moreBtn = document.createElement("button");
    moreBtn.className = "more-btn";
    moreBtn.type = "button";
    moreBtn.textContent = "⋯";

    statusBox.appendChild(badge);
    statusBox.appendChild(moreBtn);

    li.appendChild(profile);
    li.appendChild(statusBox);

    trainerListEl.appendChild(li);
  });
}

/* ===== 이벤트 바인딩 ===== */

// 날짜칩 클릭
dateChips.forEach(chip=>{
  chip.addEventListener("click", ()=>{
    dateChips.forEach(c=>c.classList.remove("active"));
    chip.classList.add("active");
    selectedDate = chip.dataset.date;
    updateSelectedDateLabel();
    renderTrainers();
  });
});

// '오늘' 버튼 (예제에서는 1일을 오늘로 가정)
if(todayBtn){
  todayBtn.addEventListener("click", ()=>{
    const todayChip = document.querySelector('.date-chip[data-date="2026-01-01"]');
    if(todayChip) todayChip.click();
  });
}

// 그룹/개인 모드 탭
modeTabs.forEach(tab=>{
  tab.addEventListener("click", ()=>{
    modeTabs.forEach(t=>t.classList.remove("active"));
    tab.classList.add("active");
    currentMode = tab.dataset.mode;  // group | pt
    renderTrainers();
  });
});

/* 초기 렌더링 */
updateSelectedDateLabel();
renderTrainers();
