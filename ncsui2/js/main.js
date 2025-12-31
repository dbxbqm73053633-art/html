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
