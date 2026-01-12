const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const passwordConfirmInput = document.getElementById("passwordConfirm");
const termsCheckbox = document.getElementById("terms");
const signupBtn = document.getElementById("signupBtn");
const errorMsg = document.getElementById("errorMsg");
const signupForm = document.getElementById("signupForm");
const goLoginBtn = document.getElementById("goLoginBtn");

// 회원가입 후 이동할 로그인 페이지 경로
const LOGIN_PAGE_URL = "login.html";

// 실사용이라면 이메일 형식 검증은 더 정교하게 할 수 있음
function isEmailValid(email) {
  return email.includes("@") && email.includes(".");
}

function validateForm() {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const passwordConfirm = passwordConfirmInput.value.trim();
  const termsChecked = termsCheckbox.checked;

  let valid = true;
  let message = "";

  if (!name || !email || !password || !passwordConfirm) {
    valid = false;
  }

  if (email && !isEmailValid(email)) {
    valid = false;
    message = "이메일 형식을 다시 확인해 주세요.";
  }

  if (password && password.length < 8) {
    valid = false;
    message = "비밀번호는 8자 이상이어야 합니다.";
  }

  if (password && passwordConfirm && password !== passwordConfirm) {
    valid = false;
    message = "비밀번호와 비밀번호 확인이 일치하지 않습니다.";
  }

  if (!termsChecked) {
    valid = false;
    if (!message) {
      message = "이용약관 및 개인정보 처리방침에 동의해 주세요.";
    }
  }

  if (valid) {
    signupBtn.disabled = false;
    signupBtn.classList.add("btn-active");
    errorMsg.textContent = "";
  } else {
    signupBtn.disabled = true;
    signupBtn.classList.remove("btn-active");
    errorMsg.textContent = message;
  }
}

[nameInput, emailInput, passwordInput, passwordConfirmInput, termsCheckbox].forEach(
  (el) => {
    el.addEventListener("input", validateForm);
    el.addEventListener("change", validateForm);
  }
);

signupForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // 마지막 방어 로직 한 번 더 체크
  validateForm();

  if (signupBtn.disabled) {
    return;
  }

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();

  // 실제로는 여기서 서버에 회원가입 요청을 보냄
  // 예: fetch("/api/signup", { method: "POST", body: JSON.stringify({...}) })

  // 데모용: 이메일을 localStorage에 저장해두고 로그인 페이지에서 활용할 수 있게
  localStorage.setItem("fh_email", email);
  localStorage.setItem("fh_user_name", name);

  alert("회원가입이 완료되었습니다. 로그인 화면으로 이동합니다.");
  window.location.href = LOGIN_PAGE_URL;
});

// 로그인 화면으로 이동 버튼
goLoginBtn.addEventListener("click", () => {
  window.location.href = LOGIN_PAGE_URL;
});

// 초기 상태 검증 한 번 실행
validateForm();
