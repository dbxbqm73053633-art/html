// 공통 페이지 이동
function goPage(path) {
  window.location.href = path;
}

/** 더미 게시물 데이터
 * category: post | routine | diet | proof
 */
const posts = [
  {
    id: 1,
    category: "post",
    title: "벤치 프레스 중량이 정체됐는데, 극복할만한 팁 있을까요? 드롭세트 vs 피라미드?",
    author: "김영우",
    time: "1시간 전",
    likes: 7,
    comments: 5,
    scrap: 0,
    tag: "질문",
    img: "./images/커뮤1.png"
  },
  {
    id: 2,
    category: "diet",
    title: "내일 치팅데이인데, 뭘 먹을지 행복한 고민 중이에요! 다들 어떤 거 드실 건가요?",
    author: "김영우",
    time: "1시간 전",
    likes: 4,
    comments: 2,
    scrap: 1,
    tag: "식단",
    img: "./images/커뮤2.png"
  },
  {
    id: 3,
    category: "proof",
    title: "오늘 운동 완료 인증! 땀 흘린 만큼 뿌듯한 이 기분! 다들 오늘 몇 분 운동하셨나요?",
    author: "김영우",
    time: "2시간 전",
    likes: 6,
    comments: 6,
    scrap: 0,
    tag: "인증샷",
    img: "./images/커뮤3.png"
  },
  {
    id: 4,
    category: "post",
    title: "헬린이인데 머신 사용법 좀 알려주실 고수님 계신가요? 랫풀다운이 잘 안 돼요 😭",
    author: "김영우",
    time: "3시간 전",
    likes: 9,
    comments: 4,
    scrap: 2,
    tag: "도움요청",
    img: "./images/커뮤4.png"
  },
  {
    id: 5,
    category: "proof",
    title: "오늘 운동 완료 인증! 땀 흘린 만큼 뿌듯한 이 기분! 다들 오늘 몇 분 운동하셨나요?",
    author: "김영우",
    time: "6시간 전",
    likes: 6,
    comments: 5,
    scrap: 1,
    tag: "인증샷",
    img: "./images/커뮤5.png"
  },
  {
    id: 6,
    category: "post",
    title: "개인 PT 받아보신 분들, 트레이너 선택 팁이나 비용 정보 좀 공유해 주세요.",
    author: "김영우",
    time: "11시간 전",
    likes: 7,
    comments: 2,
    scrap: 3,
    tag: "PT",
    img: "./images/커뮤6.png"
  },
  {
    id: 7,
    category: "routine",
    title: "러닝머신 인터벌 트레이닝 루틴(속도/시간) 공유합니다! 칼로리 폭발 🔥",
    author: "김영우",
    time: "하루 전",
    likes: 9,
    comments: 4,
    scrap: 1,
    tag: "운동루틴",
    img: "./images/커뮤7.png"
  },
  {
    id: 8,
    category: "diet",
    title: "프로틴(보충제) 성분 비교 및 추천 부탁드려요. 가성비 좋은 거 찾습니다!",
    author: "김영우",
    time: "하루 전",
    likes: 7,
    comments: 5,
    scrap: 2,
    tag: "영양",
    img: "./images/커뮤8.png"
  },
  {
    id: 9,
    category: "post",
    title: "요즘 헬스장 음악 플레이리스트 공유 부탁드려요! 힙합/락/EDM 취향별로!",
    author: "김영우",
    time: "하루 전",
    likes: 5,
    comments: 1,
    scrap: 0,
    tag: "자유글",
    img: "./images/커뮤9.png"
  }
];

const postListEl = document.getElementById("postList");
const categoryButtons = document.querySelectorAll(".category-btn");

function getBadgeClass(category) {
  switch (category) {
    case "diet":
      return "badge-tag diet";
    case "routine":
      return "badge-tag routine";
    case "proof":
      return "badge-tag proof";
    default:
      return "badge-tag";
  }
}

function renderPosts(filter = "all") {
  postListEl.innerHTML = "";

  const filtered = filter === "all"
    ? posts
    : posts.filter((p) => p.category === filter);

  filtered.forEach((post) => {
    const li = document.createElement("li");
    li.className = "post-card";

    li.innerHTML = `
      <div class="post-thumb">
        <img src="${post.img}" alt="${post.title}">
      </div>
      <div class="post-body">
        <div>
          <h2 class="post-title">${post.title}</h2>
          <p class="post-meta">
            <span>${post.author}</span>
            <span>·</span>
            <span>${post.time}</span>
          </p>
        </div>
        <div class="post-footer">
          <span class="${getBadgeClass(post.category)}">${post.tag}</span>
          <div class="actions">
            <span><span class="icon">♥</span>${post.likes}</span>
            <span><span class="icon">💬</span>${post.comments}</span>
            <span><span class="icon">★</span>${post.scrap}</span>
          </div>
        </div>
      </div>
    `;

    postListEl.appendChild(li);
  });
}

// 카테고리 버튼 이벤트
categoryButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    categoryButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.dataset.filter;
    renderPosts(filter);
  });
});

// 초기 렌더링
renderPosts("all");
