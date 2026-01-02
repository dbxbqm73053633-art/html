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

// 스토리 CTA 데모
document.querySelectorAll(".story-cta").forEach((btn) => {
  btn.addEventListener("click", () => {
    // 예: window.location.href = "course_detail.html";
    alert("코스 상세 화면으로 연결 예정!");
  });
});
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