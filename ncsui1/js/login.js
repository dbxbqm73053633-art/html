// 간단한 로그인 동작 예시

document.addEventListener("DOMContentLoaded", () => {
  const userId = document.getElementById("userId");
  const userPw = document.getElementById("userPw");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");

  // 로그인 버튼 클릭
  loginBtn.addEventListener("click", () => {
    const id = userId.value.trim();
    const pw = userPw.value.trim();

    if (!id) {
      alert("아이디를 입력하세요");
      userId.focus();
      return;
    }

    if (!pw) {
      alert("비밀번호를 입력하세요");
      userPw.focus();
      return;
    }

    alert(`로그인 시도: ${id}`);
    // 실제 로그인 처리 로직을 여기에 추가
    // 예: location.href = "main.html";
  });

  // 비밀번호 입력창에서 Enter 키로 로그인
  userPw.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      loginBtn.click();
    }
  });

  // 회원가입 버튼 클릭
  document.getElementById("signupBtn").addEventListener("click", function () {
  location.href = "resgister.html";
});
    // 예: location.href = "signup.html";
  });
