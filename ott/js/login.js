orm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = form.email.value.trim();
  const password = form.password.value.trim();

  if (!email || !password) return;
  if (password.length < 6) return;

  // 메인으로 이동
  window.location.href = "index.html";
});