const slides = document.querySelectorAll(".onboard-slide");
const dots = document.querySelectorAll(".dot");
const nextBtn = document.getElementById("nextBtn");
const skipBtn = document.getElementById("skipBtn");

let currentIndex = 0;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });

  // 🔥 마지막 페이지면 skip 숨김
  if (index === slides.length - 1) {
    skipBtn.style.display = "none";
    nextBtn.textContent = "지금 시작하기";
  } 
  else {
    skipBtn.style.display = "inline-block";
    nextBtn.textContent = "다음";
  }

  currentIndex = index;
}

function goLogin() {
  window.location.href = "login.html";
}

nextBtn.addEventListener("click", () => {
  if (currentIndex < slides.length - 1) {
    showSlide(currentIndex + 1);
  } else {
    goLogin();
  }
});

skipBtn.addEventListener("click", goLogin);

// 첫 페이지 세팅
showSlide(0);
