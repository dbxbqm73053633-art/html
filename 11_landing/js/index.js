(() => {
  const applyBtn = document.getElementById("applyBtn");

  const modal = document.getElementById("applyModal");
  const backdrop = document.getElementById("modalBackdrop");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  const form = document.getElementById("applyForm");
  const formMsg = document.getElementById("formMsg");

  const nameEl = document.getElementById("name");
  const phoneEl = document.getElementById("phone");
  const emailEl = document.getElementById("email");

  function openModal() {
    modal.hidden = false;
    backdrop.hidden = false;
    formMsg.textContent = "";
    // 초기 포커스
    setTimeout(() => nameEl.focus(), 0);
    // 스크롤 잠금
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.hidden = true;
    backdrop.hidden = true;
    document.body.style.overflow = "";
    applyBtn.focus();
  }

  function onlyDigits(str) {
    return (str || "").replace(/\D/g, "");
  }

  applyBtn.addEventListener("click", () => {
    openModal();
  });

  closeModalBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  backdrop.addEventListener("click", closeModal);

  // ESC 닫기
  window.addEventListener("keydown", (e) => {
    if (!modal.hidden && e.key === "Escape") closeModal();
  });

  // 연락처는 숫자만 유지
  phoneEl.addEventListener("input", () => {
    const digits = onlyDigits(phoneEl.value);
    if (phoneEl.value !== digits) phoneEl.value = digits;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = nameEl.value.trim();
    const phone = onlyDigits(phoneEl.value).trim();
    const email = emailEl.value.trim();

    if (!name) {
      formMsg.textContent = "이름을 입력해 주세요.";
      nameEl.focus();
      return;
    }
    if (phone.length < 10) {
      formMsg.textContent = "연락처를 정확히 입력해 주세요. (예: 01012345678)";
      phoneEl.focus();
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      formMsg.textContent = "이메일 형식이 올바르지 않습니다.";
      emailEl.focus();
      return;
    }

    // 여기서 서버로 전송하거나(localStorage 저장 등) 원하는 동작으로 교체하면 됩니다.
    // 데모: 콘솔 출력 + 성공 메시지
    console.log("[응모 데이터]", { name, phone, email });

    formMsg.textContent = "제출되었습니다! (데모: 콘솔을 확인하세요)";
    // 폼 리셋은 원하면 해제
    // form.reset();

    // 1초 후 닫기 (원하면 즉시 닫기로 바꿔도 됨)
    setTimeout(() => {
      closeModal();
    }, 900);
  });
})();
