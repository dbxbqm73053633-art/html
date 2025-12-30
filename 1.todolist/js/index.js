// 요소 선택
const todoInput = document.getElementById("todoInput");
const addBtn = document.getElementById("addBtn");
const todoList = document.getElementById("todoList");
const filterChips = document.querySelectorAll(".filter-chip");
const clearAllBtn = document.getElementById("clearAllBtn");
const todayDateEl = document.getElementById("todayDate");
const todayWeekdayEl = document.getElementById("todayWeekday");
const doneCountEl = document.getElementById("doneCount");
const focusRateEl = document.getElementById("focusRate");

// 날짜 표시
(function setToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const weekdayNames = [
    "일요일",
    "월요일",
    "화요일",
    "수요일",
    "목요일",
    "금요일",
    "토요일",
  ];
  todayDateEl.textContent = `${year}년 ${month}월 ${date}일`;
  todayWeekdayEl.textContent = weekdayNames[today.getDay()];
})();

// 필터 상태
let currentFilter = "all";

// 초기 예시 데이터
let todos = [
  {
    id: Date.now(),
    text: "아침 운동 30분 · 07:30까지",
    status: "done",
    meta: "개인",
  },
  {
    id: Date.now() + 1,
    text: "주요 업무 1개 끝내기 · 11:00까지",
    status: "doing",
    meta: "업무",
  },
  {
    id: Date.now() + 2,
    text: "장보기 · 18:00까지",
    status: "wait",
    meta: "집",
  },
];

// 통계 업데이트
function updateStats() {
  const total = todos.length;
  const done = todos.filter((t) => t.status === "done").length;
  doneCountEl.textContent = done;
  const rate = total === 0 ? 0 : Math.round((done / total) * 100);
  focusRateEl.textContent = `${rate}%`;
}

// 렌더링
function renderTodos() {
  todoList.innerHTML = "";

  const filtered = todos.filter((t) => {
    if (currentFilter === "all") return true;
    if (currentFilter === "active")
      return t.status === "wait" || t.status === "doing";
    if (currentFilter === "done") return t.status === "done";
  });

  filtered.forEach((todo) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.status === "done" ? " done" : "");
    li.dataset.id = todo.id;

    const isDone = todo.status === "done";

    li.innerHTML = `
      <button class="todo-check ${isDone ? "done" : ""}">
        ${isDone ? "✓" : ""}
      </button>
      <div class="todo-line">
        <span class="todo-title ${isDone ? "done" : ""}">${todo.text}</span>
        <span class="todo-meta">· ${todo.meta || "오늘"}</span>
      </div>
      <span class="todo-status ${
        todo.status === "wait"
          ? "wait"
          : todo.status === "doing"
          ? "doing"
          : "done"
      }">
        ${
          todo.status === "wait"
            ? "대기"
            : todo.status === "doing"
            ? "진행중"
            : "완료"
        }
      </span>
      <div class="todo-actions">
        <span class="todo-edit">수정</span>
        <span class="todo-delete">삭제</span>
      </div>
    `;

    todoList.appendChild(li);
  });

  updateStats();
}

// 할 일 추가
function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;

  todos.unshift({
    id: Date.now(),
    text,
    status: "wait",
    meta: "오늘",
  });

  todoInput.value = "";
  renderTodos();
}

// 상태 토글
function toggleTodo(id) {
  todos = todos.map((todo) => {
    if (todo.id === id) {
      if (todo.status === "done") {
        return { ...todo, status: "wait" };
      } else {
        return { ...todo, status: "done" };
      }
    }
    return todo;
  });
  renderTodos();
}

// 삭제
function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  renderTodos();
}

// 수정
function editTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;

  const updated = window.prompt("내용을 수정하세요.", todo.text);
  if (updated === null) return;
  const trimmed = updated.trim();
  if (!trimmed) return;

  todo.text = trimmed;
  renderTodos();
}

// 전체 완료
function completeAll() {
  todos = todos.map((t) => ({ ...t, status: "done" }));
  renderTodos();
}

/* 이벤트 등록 */
addBtn.addEventListener("click", addTodo);
todoInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") addTodo();
});

filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    filterChips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    currentFilter = chip.dataset.filter;
    renderTodos();
  });
});

clearAllBtn.addEventListener("click", completeAll);

todoList.addEventListener("click", (e) => {
  const li = e.target.closest(".todo-item");
  if (!li) return;
  const id = Number(li.dataset.id);

  if (e.target.classList.contains("todo-check")) {
    toggleTodo(id);
  }
  if (e.target.classList.contains("todo-edit")) {
    editTodo(id);
  }
  if (e.target.classList.contains("todo-delete")) {
    deleteTodo(id);
  }
});

// 초기 렌더
renderTodos();
