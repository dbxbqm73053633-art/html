// ===================== 공통 페이지 이동 =====================
function goPage(path) {
  window.location.href = path;
}

// ===================== 이름 / 날짜 라벨 =====================

const guideUserNameEl = document.getElementById("guideUserName");
const guideDateLabelEl = document.getElementById("guideDateLabel");
const storedName = localStorage.getItem("fh_user_name");

if (guideUserNameEl) {
  if (storedName && storedName.trim() !== "") {
    guideUserNameEl.textContent = storedName + "님,";
  } else {
    guideUserNameEl.textContent = "회원님,";
  }
}

if (guideDateLabelEl) {
  const now = new Date();
  const YOIL_KR = ["일", "월", "화", "수", "목", "금", "토"];
  const yoil = YOIL_KR[now.getDay()];
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  guideDateLabelEl.textContent = `${month}월 ${date}일 (${yoil}) 기준 추천 영상이에요.`;
}

/* ===== 유튜브 영상 데이터 =====
   category: full | upper | lower | core | cardio | stretch
   level: beginner | intermediate | advanced
*/

const VIDEOS = [
  // 1. 전신 - 초급 (새로 교체)
  // https://www.youtube.com/watch?v=ADc8TaxAVMU
  {
    id: "ADc8TaxAVMU",
    title: "20 Min Full Body Workout - Build Strength & Burn Fat At Home",
    category: "full",
    level: "beginner",
    duration: "20:00",
    focus: "전신 · 기초체력 · 무기구",
    part: "전신",
    tag: "Full Body"
  },

  // 2. 하체 - 중급
  // https://www.youtube.com/watch?v=1IQGtcv3eRY
  {
    id: "1IQGtcv3eRY",
    title: "15 MIN AT HOME LEG/BUTT/THIGH WORKOUT (No Equipment)",
    category: "lower",
    level: "intermediate",
    duration: "15:00",
    focus: "하체 · 둔근 · 허벅지",
    part: "하체",
    tag: "Leg / Glutes"
  },

  // 3. 하체 - 중급 (다른 스타일)
  // https://www.youtube.com/watch?v=zhWEt45GKK0
  {
    id: "zhWEt45GKK0",
    title: "NO EQUIPMENT LOWER BODY WORKOUT (15 min)",
    category: "lower",
    level: "intermediate",
    duration: "15:00",
    focus: "하체 · 힙업 · 지구력",
    part: "하체",
    tag: "Lower Body"
  },

  // 4. 전신 스트레칭
  // https://www.youtube.com/watch?v=lxuTCHJSers
  {
    id: "lxuTCHJSers",
    title: "10 Minute Full Body Stretch",
    category: "stretch",
    level: "beginner",
    duration: "10:00",
    focus: "전신 스트레칭 · 유연성",
    part: "전신",
    tag: "Stretch"
  },

  // 5. 복부 - 완전 초급 (새로 교체)
  // https://www.youtube.com/watch?v=uO2UMEKlBTo
  {
    id: "uO2UMEKlBTo",
    title: "10 MIN BEGINNER AB WORKOUT (Sixpack Abs, No Equipment)",
    category: "core",
    level: "beginner",
    duration: "10:00",
    focus: "복부 · 코어 · 입문",
    part: "복부/코어",
    tag: "Beginner Abs"
  },

  // 6. 복부 - 중급 (새로 교체)
  // https://www.youtube.com/watch?v=AHxTcTZQ4tw
  {
    id: "AHxTcTZQ4tw",
    title: "10 MIN AB WORKOUT - Six Pack Abs At Home (No Equipment)",
    category: "core",
    level: "intermediate",
    duration: "10:00",
    focus: "식스팩 · 코어 집중",
    part: "복부/코어",
    tag: "Six Pack"
  },

  // 7. 전신 모빌리티 + 스트레칭
  // https://www.youtube.com/watch?v=KOvE5oAubpA
  {
    id: "KOvE5oAubpA",
    title: "10 Minute Full Body Stretch & Mobility",
    category: "stretch",
    level: "beginner",
    duration: "10:00",
    focus: "관절 가동범위 · 회복",
    part: "전신",
    tag: "Mobility"
  },

  // 8. 전신 HIIT 유산소
  // https://www.youtube.com/watch?v=-hSma-BRzoo
  {
    id: "-hSma-BRzoo",
    title: "20 Min Fat Burning HIIT Workout - Full body, No Equipment",
    category: "cardio",
    level: "intermediate",
    duration: "20:00",
    focus: "전신 · 유산소 · 체지방",
    part: "전신",
    tag: "HIIT Cardio"
  }
];

// ===================== DOM 요소 =====================

const playerEl = document.getElementById("mainPlayer");
const playerTitleEl = document.getElementById("playerTitle");
const playerMetaEl = document.getElementById("playerMeta");
const playerTagEl = document.getElementById("playerTag");
const videoListEl = document.getElementById("videoList");
const filterChips = document.querySelectorAll(".filter-chip");

let currentFilter = "all";
let currentVideoId = null;

// ===================== 헬퍼 함수 =====================

function getLevelLabel(level) {
  if (level === "beginner") return "입문";
  if (level === "intermediate") return "중급";
  if (level === "advanced") return "고급";
  return "";
}

function getLevelTagClass(level) {
  if (level === "beginner") return "video-tag tag-level-beginner";
  if (level === "intermediate") return "video-tag tag-level-intermediate";
  if (level === "advanced") return "video-tag tag-level-advanced";
  return "video-tag";
}

function getCategoryLabel(category) {
  switch (category) {
    case "full":
      return "전신";
    case "upper":
      return "상체";
    case "lower":
      return "하체";
    case "core":
      return "코어";
    case "cardio":
      return "유산소";
    case "stretch":
      return "스트레칭";
    default:
      return "전체";
  }
}

// ===================== 메인 플레이어 로딩 =====================

function loadVideo(video, autoplay = false) {
  if (!playerEl || !video) return;

  // ✅ 반드시 embed 형식 사용
  const baseUrl = `https://www.youtube.com/embed/${video.id}`;
  const query = autoplay
    ? "?rel=0&modestbranding=1&playsinline=1&autoplay=1"
    : "?rel=0&modestbranding=1&playsinline=1";

  playerEl.src = baseUrl + query;

  if (playerTitleEl) {
    playerTitleEl.textContent = video.title;
  }

  if (playerMetaEl) {
    const levelLabel = getLevelLabel(video.level);
    playerMetaEl.textContent = `${video.part} · ${levelLabel} · 약 ${video.duration}`;
  }

  if (playerTagEl) {
    const catLabel = getCategoryLabel(video.category);
    playerTagEl.textContent = `${catLabel} 가이드`;
  }

  currentVideoId = video.id;

  // 리스트에서 선택된 카드 표시
  if (videoListEl) {
    const cards = videoListEl.querySelectorAll(".video-card");
    cards.forEach((card) => {
      const vid = card.dataset.videoId;
      if (vid === currentVideoId) {
        card.classList.add("active");
      } else {
        card.classList.remove("active");
      }
    });
  }
}

// ===================== 리스트 렌더링 =====================

function renderVideos() {
  if (!videoListEl) return;
  videoListEl.innerHTML = "";

  let list = VIDEOS.slice();
  if (currentFilter !== "all") {
    list = list.filter((v) => v.category === currentFilter);
  }

  list.forEach((video, index) => {
    const li = document.createElement("li");
    li.className = "video-card";
    li.dataset.videoId = video.id;

    const levelLabel = getLevelLabel(video.level);
    const levelClass = getLevelTagClass(video.level);
    const catLabel = getCategoryLabel(video.category);

    const thumbUrl = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;

    li.innerHTML = `
      <div class="video-thumb-wrap">
        <img src="${thumbUrl}" alt="${video.title}">
        <div class="video-duration">${video.duration}</div>
      </div>
      <div class="video-body">
        <div>
          <p class="video-title">${video.title}</p>
          <div class="video-meta-top">
            <span>${catLabel}</span>
            <span class="dot">·</span>
            <span>${video.part}</span>
            <span class="dot">·</span>
            <span>${levelLabel}</span>
          </div>
          <div class="video-tags">
            <span class="${levelClass}">${levelLabel}</span>
            <span class="video-tag">${video.tag}</span>
            <span class="video-tag">${video.focus}</span>
          </div>
        </div>
      </div>
    `;

    li.addEventListener("click", () => {
      loadVideo(video, true);
    });

    videoListEl.appendChild(li);

    // 첫 번째 카드면 플레이어 초기 세팅 (자동재생 X)
    if (index === 0 && !currentVideoId) {
      loadVideo(video, false);
    }
  });
}

// ===================== 필터 이벤트 =====================

filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    filterChips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    currentFilter = chip.dataset.filter || "all";
    currentVideoId = null; // 필터 바뀔 때 첫 영상 다시 세팅
    renderVideos();
  });
});

// ===================== 초기 렌더링 =====================

renderVideos();
