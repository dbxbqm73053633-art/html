const slides = document.querySelectorAll(".slide");
const dots = document.querySelectorAll(".dot");
const primaryBtn = document.querySelector(".primary-btn");
const skipBtn = document.querySelector(".skip-btn");

let currentIndex = 0;

function updateUI() {
  // 슬라이드 활성 상태
  slides.forEach((slide, index) => {
    slide.classList.toggle("active", index === currentIndex);
  });

  // 진행 점 활성 상태
  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === currentIndex);
  });

  // 버튼 텍스트 / Skip 표시
  if (currentIndex === slides.length - 1) {
    primaryBtn.textContent = "바로 시작하기";
    skipBtn.style.visibility = "hidden";
  } else {
    primaryBtn.textContent = "다음";
    skipBtn.style.visibility = "visible";
  }
}

function goToNext() {
  if (currentIndex < slides.length - 1) {
    currentIndex++;
    updateUI();
  } else {
    startApp();
  }
}

function skipToLast() {
  currentIndex = slides.length - 1;
  updateUI();
}

function startApp() {
  // TODO: 실제 메인 페이지 링크로 변경
  // 예: window.location.href = "main.html";
  window.location.href = "login.html";
}

primaryBtn.addEventListener("click", goToNext);
skipBtn.addEventListener("click", skipToLast);
