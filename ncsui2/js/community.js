// 탭바 활성화(데모)
const tabs = document.querySelectorAll(".tab");
tabs.forEach((t) => {
  t.addEventListener("click", () => {
    tabs.forEach((x) => x.classList.remove("active"));
    t.classList.add("active");
  });
});
// 만들기 버튼(데모)
document.getElementById("btnCreate").addEventListener("click", () => {
  alert("게시글 작성 화면으로 연결 예정!");
});

/* -----------------------------
   1) 임의 프로필 아바타(SVG) 생성
------------------------------ */
function avatarSVG({ bg1, bg2, hair, shirt, skin, acc }) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${bg1}"/>
        <stop offset="1" stop-color="${bg2}"/>
      </linearGradient>
      <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#0f172a" flood-opacity=".18"/>
      </filter>
    </defs>

    <!-- bg -->
    <rect width="128" height="128" rx="28" fill="url(#g)"/>
    <circle cx="64" cy="56" r="30" fill="${skin}" filter="url(#s)"/>

    <!-- hair -->
    <path d="M34 58c2-22 18-34 30-34s28 12 30 34c-6-7-16-11-30-11S40 51 34 58Z" fill="${hair}"/>
    <path d="M36 56c3-10 11-18 28-18s25 8 28 18c-8-6-17-9-28-9s-20 3-28 9Z" fill="${acc}" opacity=".35"/>

    <!-- eyes -->
    <circle cx="53" cy="58" r="3" fill="#111827" opacity=".75"/>
    <circle cx="75" cy="58" r="3" fill="#111827" opacity=".75"/>

    <!-- mouth -->
    <path d="M54 72c7 6 13 6 20 0" fill="none" stroke="#111827" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>

    <!-- body -->
    <path d="M20 128c8-32 28-42 44-42s36 10 44 42" fill="${shirt}"/>
    <path d="M36 92c8 8 17 12 28 12s20-4 28-12" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="6" stroke-linecap="round"/>
  </svg>`;
}

function toDataURI(svg) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.trim());
}

const avatars = [
  toDataURI(avatarSVG({ bg1:"#E7F2FF", bg2:"#FFFFFF", hair:"#1F2937", shirt:"#0EA5A4", skin:"#F4D7C6", acc:"#22C55E" })),
  toDataURI(avatarSVG({ bg1:"#FFF1F2", bg2:"#FFFFFF", hair:"#111827", shirt:"#F59E0B", skin:"#F1C7B6", acc:"#FB7185" })),
  toDataURI(avatarSVG({ bg1:"#F0FDF4", bg2:"#FFFFFF", hair:"#0F172A", shirt:"#2563EB", skin:"#EFC6B2", acc:"#16A34A" })),
  toDataURI(avatarSVG({ bg1:"#FAF5FF", bg2:"#FFFFFF", hair:"#312E81", shirt:"#9333EA", skin:"#F5D0B8", acc:"#A78BFA" })),
  toDataURI(avatarSVG({ bg1:"#FFF7ED", bg2:"#FFFFFF", hair:"#0B1220", shirt:"#14B8A6", skin:"#F2C2A8", acc:"#F59E0B" })),
  toDataURI(avatarSVG({ bg1:"#F8FAFC", bg2:"#E2E8F0", hair:"#334155", shirt:"#D6B25E", skin:"#F6D2BE", acc:"#0EA5E9" })),
];

// HTML의 data-avatar에 자동 적용
document.querySelectorAll("img[data-avatar]").forEach((img) => {
  const idx = Number(img.getAttribute("data-avatar") || 0);
  img.src = avatars[idx % avatars.length];
});

/* -----------------------------
   2) 이름/시간/레벨/숫자 임의 데이터 주입
------------------------------ */
const storyNames = [
  "하나", "서준", "민지"
];

const posts = [
  { name:"김도윤", level: 18, time:"7min",  media:"./images/커뮤4.png", like: 132, comment: 14, view: 860 },
  { name:"박서연", level: 41, time:"32min", media:"./images/커뮤5.png", like: 84,  comment: 9,  view: 512 },
  { name:"이준호", level: 27, time:"1h",   media:"./images/커뮤6.png", like: 219, comment: 22, view: 1204 },
  { name:"최유나", level: 9,  time:"어제",  media:"./images/커뮤7.png", like: 56,  comment: 3,  view: 340 },
];

// 스토리 이름 적용
storyNames.forEach((n, i) => {
  const el = document.querySelector(`[data-story-name="${i+1}"]`);
  if (el) el.textContent = n;
});

// 게시글 적용
document.querySelectorAll(".post").forEach((postEl, i) => {
  const data = posts[i];
  if (!data) return;

  postEl.querySelector('[data-field="name"]').textContent = data.name;
  postEl.querySelector('[data-field="level"]').textContent = `Lv ${data.level}`;
  postEl.querySelector('[data-field="time"]').textContent = data.time;

  const mediaImg = postEl.querySelector('[data-field="media"]');
  mediaImg.src = data.media;

  postEl.querySelector('[data-count="like"]').textContent = String(data.like);
  postEl.querySelector('[data-count="comment"]').textContent = String(data.comment);
  postEl.querySelector('[data-count="view"]').textContent = String(data.view);
});

/* -----------------------------
   3) 좋아요 토글(데모: +1 / -1)
------------------------------ */
document.querySelectorAll('.post .act.like').forEach((btn) => {
  btn.addEventListener('click', () => {
    const countEl = btn.querySelector('[data-count="like"]');
    const cur = Number(countEl.textContent || 0);
    const isOn = btn.classList.toggle('is-on');
    countEl.textContent = String(isOn ? cur + 1 : Math.max(0, cur - 1));
  });
});

// 스토리 클릭(데모)
document.querySelectorAll('.story').forEach((s, idx) => {
  s.addEventListener('click', () => {
    alert(`스토리 ${idx + 1} 보기 (연결 예정)`);
  });
});
document.querySelector('[data-tab="home"]').addEventListener("click", () => {
  window.location.href = "main.html";   // 홈 파일명에 맞게 수정
});

// 탭 버튼들 가져오기
const homeTab      = document.querySelector('[data-tab="home"]');
const communityTab = document.querySelector('[data-tab="community"]');
const courseTab    = document.querySelector('[data-tab="course"]');
const campingTab   = document.querySelector('[data-tab="camping"]');
const myTab        = document.querySelector('[data-tab="my"]');

// 홈 버튼 클릭 → main.html 로 이동
if (homeTab) {
  homeTab.addEventListener('click', () => {
    window.location.href = 'main.html';
  });
}

// 커뮤니티 버튼 클릭 → community.html 로 이동
if (communityTab) {
  communityTab.addEventListener('click', () => {
    window.location.href = 'community.html';
  });
}

// 코스 버튼 클릭 → course.html 로 이동
if (courseTab) {
  courseTab.addEventListener('click', () => {
    window.location.href = 'cos.html';
  });
}

// 캠핑 버튼 클릭 → camping.html 로 이동
if (campingTab) {
  campingTab.addEventListener('click', () => {
    window.location.href = 'camp.html';
  });
}

if (myTab) {
  myTab.addEventListener('click', () => {
    window.location.href = 'my.html';
  });
}
