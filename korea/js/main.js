const swiper = new Swiper('.swiper', {
  // Optional parameters
  effect:"fade",
  direction: 'horizontal',
  loop: true,
//   자동실행
autoplay: {
  delay: 2000,
//   사용자와의 상호작용
  disableOnInteraction: false,
//   마우스 포인터가 슬라이더위에 있을때 자동 재생
  pauseOnMouseEnter: true,
//   한번 실행 후 멈춤
},

  // If we need pagination
//   페이지버튼
  pagination: {
    el: '.swiper-pagination',
    // 페이지 버튼 클릭시 링크설정
    clickable:true
  },

  // Navigation arrows
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },

  // And if we need scrollbar
  scrollbar: {
    el: '.swiper-scrollbar',
  },
});