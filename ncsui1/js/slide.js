// Swiper 초기화
const swiper = new Swiper('.myOnboardingSwiper', {
  loop: true,
  speed: 450,
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  autoplay: {
    delay: 3000,            // 3초마다 자동 변경
    disableOnInteraction: false, // 손으로 스와이프해도 자동재생 유지
  },
});

// 시작하기 버튼 (예시 액션)
document.querySelector('.start-button').addEventListener('click', () => {
  console.log('시작하기 버튼 클릭');
  // 실제 서비스에서는 이동 URL 지정
  // window.location.href = '/home';
});
