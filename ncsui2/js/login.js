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
const idInput = document.querySelectorAll(".field")[0];   // 아이디/이메일
const pwInput = document.querySelectorAll(".field")[1];   // 비밀번호
const loginBtn = document.querySelector(".login-btn");

// 입력될 때마다 체크
function validate() {
  const id = idInput.value.trim();
  const pw = pwInput.value.trim();

  if (id !== "" && pw !== "") {
    loginBtn.disabled = false;
    loginBtn.style.opacity = "1";
    loginBtn.style.cursor = "pointer";
  } else {
    loginBtn.disabled = true;
    loginBtn.style.opacity = "0.5";
    loginBtn.style.cursor = "not-allowed";
  }
}

idInput.addEventListener("input", validate);
pwInput.addEventListener("input", validate);

// 처음 로드시에도 실행
validate();
