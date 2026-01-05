// 상단 인사에 이름 표시 (회원가입 때 저장해 둔 값 사용)
const userNameEl = document.getElementById("userName");
const storedName = localStorage.getItem("fh_user_name");

if (storedName && storedName.trim() !== "") {
  userNameEl.textContent = storedName + "님,";
} else {
  userNameEl.textContent = "회원님,";
}

/**
 * 페이지 이동 (탭바 공통)
 * 실제 파일 이름에 맞게 경로만 맞춰 주면 됨
 */
function goPage(path) {
  window.location.href = path;
}

// 필요하면 나중에 탭 상태를 JS로 제어할 수도 있음
// (지금은 HTML에서 active 클래스로 구분)
