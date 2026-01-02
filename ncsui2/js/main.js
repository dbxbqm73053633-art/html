// 탭바 활성화(데모)
const tabs = document.querySelectorAll(".tab");
tabs.forEach((t) => {
  t.addEventListener("click", () => {
    tabs.forEach((x) => x.classList.remove("active"));
    t.classList.add("active");
  });
});

// 데모용 수치(원하면 API/데이터로 교체)
const $ = (sel) => document.querySelector(sel);
$("#temp").textContent = "20";
$("#courseNow").textContent = "1";
$("#courseAll").textContent = "10";
$("#distance").textContent = "15";

// 3초 로딩 후 이동 함수
function showLoadingAndGo(targetUrl) {
  const overlay = document.getElementById("loading-overlay");
  if (!overlay) return;

  overlay.classList.remove("hidden");

  setTimeout(() => {
    window.location.href = targetUrl;
  }, 3000); // 3초 후 이동
}

// 페이지가 로드되면 자동으로 3초 후 이동시키고 싶을 때 사용 예시
// (원하는 파일명으로 target.html만 바꿔서 쓰면 됨)
document.addEventListener("DOMContentLoaded", () => {
  // 주석 풀면 자동으로 로딩 → 이동 동작
  // showLoadingAndGo("target.html");
})
document.querySelector('[data-tab="community"]').addEventListener("click", () => {
  window.location.href = "community.html";   // 파일명에 맞게 수정
});
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

// 마이 버튼 클릭 → 나중에 my.html 만들면 거기로 이동
if (myTab) {
  myTab.addEventListener('click', () => {
    // window.location.href = 'my.html';
    alert('마이 페이지는 나중에 만들 수 있어.');
  });
}
