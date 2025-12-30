const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const taskCounter = document.getElementById('task-counter');
const summaryTitle = document.getElementById('summary-title');
const summarySub = document.getElementById('summary-sub');
const progressText = document.getElementById('progress-text');
const chips = document.querySelectorAll('.chip');
const todayDate = document.getElementById('today-date');
const statusTime = document.getElementById('status-time');
const timeIndicator = document.getElementById('time-indicator');

let tasks = [];
let filter = 'all';

function formatDate(date) {
  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const dayName = dayNames[date.getDay()];
  return `${year}. ${month}. ${day}. ${dayName}`;
}

function updateClock() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  statusTime.textContent = `${h}:${m}`;
  timeIndicator.textContent = `${h}:${m}`;
}

function saveTasks() {
  localStorage.setItem('todayTasks', JSON.stringify(tasks));
}

function loadTasks() {
  const saved = localStorage.getItem('todayTasks');
  if (saved) {
    try {
      tasks = JSON.parse(saved);
    } catch {
      tasks = [];
    }
  }
  renderTasks();
}

function addTask(title) {
  const trimmed = title.trim();
  if (!trimmed) return;

  const now = new Date();
  const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  const task = {
    id: Date.now(),
    title: trimmed,
    time: timeLabel,
    completed: false,
    createdAt: now.toISOString(),
  };
  tasks.unshift(task);
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map((t) =>
    t.id === id
      ? {
          ...t,
          completed: !t.completed,
        }
      : t
  );
  saveTasks();
  renderTasks();
}

function editTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  const nextTitle = prompt('할 일을 수정하세요.', task.title);
  if (nextTitle === null) return;
  const trimmed = nextTitle.trim();
  if (!trimmed) return;

  tasks = tasks.map((t) =>
    t.id === id
      ? {
          ...t,
          title: trimmed,
        }
      : t
  );
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  const ok = confirm('이 할 일을 삭제할까요?');
  if (!ok) return;
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderTasks();
}

function renderTasks() {
  taskList.innerHTML = '';

  const filtered = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  filtered.forEach((task) => {
    const item = document.createElement('div');
    item.className = 'task-item' + (task.completed ? ' completed' : '');

    const left = document.createElement('div');
    left.className = 'task-left';

    const checkbox = document.createElement('button');
    checkbox.className = 'checkbox' + (task.completed ? ' checked' : '');
    checkbox.innerHTML = `
      <svg viewBox="0 0 20 20">
        <path d="M7.5 13.5L4.5 10.5L5.91 9.09L7.5 10.67L13.09 5.09L14.5 6.5L7.5 13.5Z" />
      </svg>
    `;
    checkbox.addEventListener('click', () => toggleTask(task.id));

    const texts = document.createElement('div');
    texts.className = 'task-texts';

    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = task.title;

    const meta = document.createElement('div');
    meta.className = 'task-meta';
    meta.textContent = `오늘 · ${task.time}`;

    texts.appendChild(title);
    texts.appendChild(meta);

    left.appendChild(checkbox);
    left.appendChild(texts);

    const right = document.createElement('div');
    right.className = 'task-right';

    const rightPill = document.createElement('div');
    rightPill.className = 'pill ' + (task.completed ? 'done' : 'urgent');
    rightPill.textContent = task.completed ? '완료됨' : '오늘';

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn';
    editBtn.innerText = '✏️';
    editBtn.title = '수정';
    editBtn.addEventListener('click', () => editTask(task.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-btn';
    deleteBtn.innerText = '🗑';
    deleteBtn.title = '삭제';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    right.appendChild(rightPill);
    right.appendChild(editBtn);
    right.appendChild(deleteBtn);

    item.appendChild(left);
    item.appendChild(right);

    taskList.appendChild(item);
  });

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  taskCounter.textContent = `${total}개`;
  summaryTitle.textContent = `오늘 ${total}개 할 일`;

  if (total === 0) {
    summarySub.textContent = '가볍게 하나만 적어볼까?';
  } else if (completed === 0) {
    summarySub.textContent = '시작이 반이야, 하나만 끝내보자.';
  } else if (completed < total) {
    summarySub.textContent = `${completed}개 완료! 조금만 더 가보자.`;
  } else {
    summarySub.textContent = '완료! 오늘 할 일 끝 🎉';
  }

  progressText.textContent = `${percent}%`;
}

addBtn.addEventListener('click', () => {
  addTask(taskInput.value);
  taskInput.value = '';
  taskInput.focus();
});

taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addTask(taskInput.value);
    taskInput.value = '';
  }
});

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    filter = chip.dataset.filter;
    renderTasks();
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  todayDate.textContent = formatDate(now);
  updateClock();
  setInterval(updateClock, 1000 * 30);
  loadTasks();
});
