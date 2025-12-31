// 토글 스위치 동작 (디자인용)
const options = document.querySelectorAll(".option");

options.forEach((opt) => {
  opt.addEventListener("click", () => {
    const switchEl = opt.querySelector(".option-switch");
    switchEl.classList.toggle("on");
  });
});

// 로그인 버튼 예시 동작
document.querySelector(".login-btn").addEventListener("click", () => {
  // TODO: 실제 로그인 처리 or 메인 화면 이동으로 교체
  // 예: window.location.href = "main.html";
  window.location.href = "main.html";
  
});
