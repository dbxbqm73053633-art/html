const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const keepLoginCheckbox = document.getElementById("keepLogin");
const loginBtn = document.getElementById("loginBtn");
const errorMsg = document.getElementById("errorMsg");
const loginForm = document.getElementById("loginForm");

// 🔥 메인 페이지 경로 (서비스에 맞게 수정)
const MAIN_PAGE_URL = "main.html";

// 페이지 로드 시 자동 로그인 체크
window.addEventListener("DOMContentLoaded", () => {
  const autoLogin = localStorage.getItem("fh_auto_login") === "true";
  const savedEmail = localStorage.getItem("fh_email");

  if (savedEmail) {
    emailInput.value = savedEmail;
  }

  if (autoLogin) {
    // 실제 서비스에서는 토큰 검증 등 필요
    window.location.href = MAIN_PAGE_URL;
    return;
  }

  // 저장된 상태 그대로 체크 표시
  if (localStorage.getItem("fh_keep_login") === "true") {
    keepLoginCheckbox.checked = true;
  }

  validateForm();
});

function validateForm() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  const isValid = email !== "" && password.length >= 8;

  if (isValid) {
    loginBtn.disabled = false;
    loginBtn.classList.add("btn-active"); // 스타일 활성화
    errorMsg.textContent = "";
  } else {
    loginBtn.disabled = true;
    loginBtn.classList.remove("btn-active"); // 스타일 제거
  }
}

emailInput.addEventListener("input", validateForm);
passwordInput.addEventListener("input", validateForm);

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    errorMsg.textContent = "이메일과 비밀번호를 모두 입력해 주세요.";
    return;
  }

  if (password.length < 8) {
    errorMsg.textContent = "비밀번호는 8자 이상 입력해 주세요.";
    return;
  }

  // 🔐 여기서 실제 서버 로그인 요청을 보내는 부분이 들어감
  // 예: fetch("/api/login", { ... })

  // 로그인 성공했다고 가정하고 상태 저장
  localStorage.setItem("fh_email", email);

  if (keepLoginCheckbox.checked) {
    localStorage.setItem("fh_keep_login", "true");
    localStorage.setItem("fh_auto_login", "true");
  } else {
    localStorage.removeItem("fh_keep_login");
    localStorage.removeItem("fh_auto_login");
  }

  errorMsg.textContent = "";

  // 메인 페이지로 이동 (경로는 프로젝트에 맞게 수정)
  window.location.href = MAIN_PAGE_URL;
});
const goSignupBtn = document.getElementById("goSignupBtn");

goSignupBtn.addEventListener("click", () => {
  window.location.href = "signup.html";
});
