// =====================================
// Firebase (RTDB + Storage) - FIXED
// - 핵심 수정: Storage 버킷을 명시적으로 지정
// - 업로드 실패 시 에러코드/메시지 alert + console 출력
// =====================================

const PASSWORD = "0113";
const SESSION_KEY = "ywjy_unlocked_v2";

// ✅ 너희 시작일(필요하면 바꿔)
const START = new Date(2026, 0, 13, 0, 0, 0);

const MILESTONES = [
  { days: 100, name: "100일 (우리, 꽤 멋지게 여기까지)" },
  { days: 200, name: "200일 (서로에게 더 편해진 날)" },
  { days: 365, name: "1주년 (처음부터 지금까지, 너라서)" },
  { days: 500, name: "500일 (사랑은 오늘도 진행 중)" },
  { days: 730, name: "2주년 (익숙함 속 설렘)" },
  { days: 1000, name: "1000일 (우리만의 전설)" },
];

const MAX_IMAGE_LONG_SIDE = 1600;
const JPG_QUALITY = 0.86;
const PAGE_SIZE = 12;

// -------------------------------
// Firebase imports
// -------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js";

import {
  getDatabase, ref, onValue, set, update, remove, get
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

import {
  getStorage, ref as sref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-storage.js";

// ✅✅✅ 여기 2개가 핵심!
// 1) 실제 Storage bucket으로 바꿔주세요. (Firebase 콘솔 Project settings에 나옵니다)
//    보통: "duddn730.appspot.com"
const STORAGE_BUCKET = "duddn730.appspot.com"; // <- 이 값이 다르면 꼭 수정!

const firebaseConfig = {
  apiKey: "AIzaSyCbAWAchLN1IRitre_VW-drnSoPPBkVDSo",
  authDomain: "duddn730.firebaseapp.com",
  projectId: "duddn730",
  storageBucket: STORAGE_BUCKET, // ✅ bucket 정확히!
  messagingSenderId: "326941968662",
  appId: "1:326941968662:web:a1d756ce52e22a92fd2837",
  measurementId: "G-XJCZH9SJLS"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);

// ✅ RTDB 주소 명시
const db = getDatabase(app, "https://duddn730-default-rtdb.asia-southeast1.firebasedatabase.app/");

// ✅✅✅ Storage를 gs://로 명시 지정 (retry-limit 해결에 매우 중요)
const storage = getStorage(app, `gs://${STORAGE_BUCKET}`);

// DB 경로
const PHOTOS_PATH = "photos";
const MEMOS_PATH = "memos";

// -------------------------------
// Utils
// -------------------------------
const $ = (id) => document.getElementById(id);
const week = ["일","월","화","수","목","금","토"];
const pad2 = (n) => String(n).padStart(2, "0");

function fmtDate(d) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}.${m}.${day} (${week[d.getDay()]})`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toISODateInputValue(tsOrDate) {
  if (!tsOrDate) return "";
  const d = (tsOrDate instanceof Date) ? tsOrDate : new Date(tsOrDate);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function fromISODateInputValue(v) {
  if (!v) return null;
  const [y, m, d] = v.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0).getTime();
}

function niceShortDate(ts) {
  if (!ts) return "날짜 없음";
  const d = new Date(ts);
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
}

function humanName(filename) {
  if (!filename) return "photo";
  const base = filename.replace(/\.[^/.]+$/, "");
  return base.length > 18 ? base.slice(0, 18) + "…" : base;
}

function normalizePass(v) { return String(v || "").trim(); }
function normalizeAlbum(v) {
  const t = String(v || "").trim();
  return t ? t : "기본앨범";
}
function uid() { return (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()); }

function dataUrlToBlob(dataUrl) {
  const [meta, b64] = dataUrl.split(",");
  const mime = (meta.match(/data:(.*?);base64/) || [])[1] || "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// -------------------------------
// Lock
// -------------------------------
function showLock() {
  $("lock").classList.add("show");
  $("lock").setAttribute("aria-hidden", "false");
  $("lockPass").value = "";
  $("lockPass").focus();
}
function hideLock() {
  $("lock").classList.remove("show");
  $("lock").setAttribute("aria-hidden", "true");
}
function initLock() {
  const unlocked = sessionStorage.getItem(SESSION_KEY) === "1";
  if (!unlocked) showLock();

  $("lockForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const pass = normalizePass($("lockPass").value);
    const hint = $("lockHint");
    const card = document.querySelector(".lock__card");

    if (pass === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      hint.classList.remove("error");
      hint.textContent = "열렸어요. 우리만의 공간으로 ♡";
      hideLock();
      return;
    }
    hint.classList.add("error");
    hint.textContent = "앗, 비밀번호가 달라요. 우리만 아는 숫자 4자리 ♡";
    card.classList.remove("shake");
    void card.offsetWidth;
    card.classList.add("shake");
    $("lockPass").select();
  });
}

// -------------------------------
// Counter
// -------------------------------
function diffNow() {
  const now = new Date();
  const ms = Math.max(0, now - START);

  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  const remSeconds = totalSeconds % 60;
  const remMinutes = totalMinutes % 60;
  const remHours = totalHours % 24;

  return {
    now,
    totalSeconds,
    totalMinutes,
    totalHours,
    totalDays,
    hhmmss: `${pad2(remHours)}:${pad2(remMinutes)}:${pad2(remSeconds)}`,
  };
}

function renderCounter() {
  const { now, totalDays, totalHours, totalMinutes, totalSeconds, hhmmss } = diffNow();

  $("startDateLabel").textContent = fmtDate(START);
  $("todayLabel").textContent = fmtDate(now);

  $("dDay").textContent = `D+${totalDays}`;
  $("sinceText").textContent = `${fmtDate(START)}부터 우리가 만든 따뜻한 시간`;
  $("hhmmss").textContent = hhmmss;

  $("days").textContent = totalDays.toLocaleString();
  $("hours").textContent = totalHours.toLocaleString();
  $("minutes").textContent = totalMinutes.toLocaleString();
  $("seconds").textContent = totalSeconds.toLocaleString();
}

function renderMilestones() {
  const { totalDays } = diffNow();
  const list = $("milestoneList");

  list.innerHTML = MILESTONES.map((m) => {
    const target = addDays(START, m.days);
    const left = m.days - totalDays;
    const pill = left <= 0 ? `D+${m.days}` : `D-${left}`;
    const msg = left <= 0 ? `이미 도착했어 ♡` : `${left}일 남았어 ♡`;

    return `
      <div class="milestone">
        <div class="milestone__left">
          <div class="milestone__name">${escapeHtml(m.name)}</div>
          <div class="milestone__date">${fmtDate(target)} · ${msg}</div>
        </div>
        <div class="pill">${pill}</div>
      </div>
    `;
  }).join("");

  const next = MILESTONES
    .map((m) => ({ ...m, left: m.days - totalDays, date: addDays(START, m.days) }))
    .filter((x) => x.left > 0)
    .sort((a, b) => a.left - b.left)[0];

  if (next) {
    $("nextLabel").textContent = `${next.name}까지`;
    $("nextValue").textContent = `${next.left}일 · ${fmtDate(next.date)}`;
  } else {
    $("nextLabel").textContent = "다음 기념일";
    $("nextValue").textContent = "새 마일스톤을 추가해도 좋아요 ♡";
  }
}

// -------------------------------
// Image compress
// -------------------------------
function fileToDataUrlCompressed(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("파일을 읽을 수 없어요."));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const longSide = Math.max(width, height);
        const scale = longSide > MAX_IMAGE_LONG_SIDE ? (MAX_IMAGE_LONG_SIDE / longSide) : 1;

        const w = Math.round(width * scale);
        const h = Math.round(height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        const dataUrl = canvas.toDataURL("image/jpeg", JPG_QUALITY);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("이미지를 불러올 수 없어요."));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// -------------------------------
// Gallery state
// -------------------------------
let galleryAll = [];
let galleryView = [];
let gallerySlice = [];
let currentAlbum = "__ALL__";
let page = 0;

function resetPagingState(resetPage = true) {
  if (resetPage) page = 0;
  gallerySlice = [];
}

function applyFilterAndPaging() {
  galleryView = (currentAlbum === "__ALL__")
    ? [...galleryAll]
    : galleryAll.filter(x => (x.album || "기본앨범") === currentAlbum);

  const total = galleryView.length;
  const nextEnd = Math.min(total, (page + 1) * PAGE_SIZE);
  gallerySlice = galleryView.slice(0, nextEnd);

  $("pagingHint").textContent = `${gallerySlice.length} / ${total}장`;
  $("loadMore").style.display = (gallerySlice.length < total) ? "inline-flex" : "none";
}

function rebuildAlbumOptionsFromList(items) {
  const albums = new Set(items.map(x => x.album || "기본앨범"));
  const list = [...albums].sort((a,b) => a.localeCompare(b, "ko"));
  const sel = $("albumFilter");
  const prev = sel.value || "__ALL__";

  sel.innerHTML = `<option value="__ALL__">전체 앨범</option>` + list.map(a =>
    `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`
  ).join("");

  sel.value = ([ "__ALL__", ...list ].includes(prev)) ? prev : "__ALL__";
  currentAlbum = sel.value;
}

function renderGallery() {
  const wrap = $("gallery");
  $("photoCount").textContent = String(galleryAll.length);

  applyFilterAndPaging();

  if (!gallerySlice.length) {
    wrap.innerHTML = `<p class="hint">아직 사진이 없어요. 우리 첫 장을 담아볼까요?</p>`;
    return;
  }

  wrap.innerHTML = gallerySlice.map((it, idx) => {
    const caption = it.caption?.trim() ? it.caption.trim() : "캡션 없음";
    const dateLabel = it.date ? niceShortDate(it.date) : "날짜 없음";
    const fileLabel = it.name ? it.name : "photo";

    return `
      <div class="photo" data-id="${escapeHtml(it.id)}" data-idx="${idx}">
        <img class="photo__img" src="${it.url}" alt="${escapeHtml(caption)}" loading="lazy" />
        <div class="photo__tags">
          <span class="tag">${escapeHtml(it.album || "기본앨범")}</span>
          <span class="tag">${escapeHtml(dateLabel)}</span>
        </div>

        <div class="photo__bar">
          <div class="photo__name">
            <div class="photo__caption">${escapeHtml(caption)}</div>
            <div class="photo__sub">${escapeHtml(fileLabel)}</div>
          </div>

          <div class="photo__actions">
            <button class="iconBtn" type="button" title="삭제" data-del="${escapeHtml(it.id)}">✕</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  wrap.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-del");
      await deletePhotoFirebase(id);
    });
  });
}

// -------------------------------
// ✅ Firebase Photo CRUD (핵심: 업로드 실패 디버그)
// -------------------------------
async function uploadPhotoToStorageAndSaveMeta({ file, album, dateTs, caption, order }) {
  const dataUrl = await fileToDataUrlCompressed(file);
  const blob = dataUrlToBlob(dataUrl);

  const id = uid();
  const storagePath = `photos/${id}.jpg`;
  const storageRef = sref(storage, storagePath);

  try {
    await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  } catch (e) {
    console.log("STORAGE_BUCKET =", STORAGE_BUCKET);
    console.log("STORAGE ERROR CODE:", e.code);
    console.log("STORAGE ERROR MSG:", e.message);
    console.log("FULL ERROR:", e);
    alert(`사진 업로드 실패\n\n${e.code}\n${e.message}\n\n버킷(STORAGE_BUCKET)이 맞는지/Storage Rules를 확인해줘!`);
    throw e;
  }

  const url = await getDownloadURL(storageRef);

  const item = {
    id,
    album,
    name: humanName(file.name),
    caption: caption?.trim() || "",
    date: dateTs || null,
    createdAt: Date.now(),
    order: typeof order === "number" ? order : 0,
    storagePath,
    url
  };

  await set(ref(db, `${PHOTOS_PATH}/${id}`), item);
}

async function deletePhotoFirebase(id) {
  const target = galleryAll.find(x => x.id === id);
  if (!target) return;

  if (target.storagePath) {
    try { await deleteObject(sref(storage, target.storagePath)); } catch {}
  }
  await remove(ref(db, `${PHOTOS_PATH}/${id}`));
}

async function clearAllPhotosFirebase() {
  const tasks = galleryAll.map(async (it) => {
    if (it.storagePath) {
      try { await deleteObject(sref(storage, it.storagePath)); } catch {}
    }
  });
  await Promise.allSettled(tasks);
  await remove(ref(db, PHOTOS_PATH));
}

// -------------------------------
// Memo (RTDB)
// -------------------------------
function renderMemosFromList(list) {
  const wrap = $("memoList");
  const memos = [...list].sort((a,b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  if (!memos.length) {
    wrap.innerHTML = `<p class="hint">아직 메모가 없어요. 오늘의 다정함을 한 줄 남겨볼까요?</p>`;
    return;
  }

  wrap.innerHTML = memos.map((m) => `
    <div class="memo">
      <div class="memo__top">
        <div>
          <div class="memo__title">${escapeHtml(m.title || "제목 없음")}</div>
          <div class="memo__date">${fmtDate(new Date(m.createdAt))}</div>
        </div>
      </div>
      <div class="memo__body">${escapeHtml(m.body || "")}</div>
      <div class="memo__actions">
        <button class="btn btn--ghost" data-memo-del="${escapeHtml(m.id)}">삭제</button>
      </div>
    </div>
  `).join("");

  wrap.querySelectorAll("[data-memo-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-memo-del");
      await remove(ref(db, `${MEMOS_PATH}/${id}`));
    });
  });
}

function initMemoUI() {
  $("memoForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = $("memoTitle").value.trim();
    const body = $("memoBody").value.trim();
    if (!title && !body) return;

    const id = uid();
    await set(ref(db, `${MEMOS_PATH}/${id}`), { id, title, body, createdAt: Date.now() });

    $("memoTitle").value = "";
    $("memoBody").value = "";
  });

  $("clearMemos").addEventListener("click", async () => {
    await remove(ref(db, MEMOS_PATH));
  });
}

// Backup/Restore
function downloadJSON(filename, obj) {
  const blob = new Blob([JSON.stringify(obj)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function exportAll() {
  const snap = await get(ref(db));
  const all = snap.val() || {};
  downloadJSON("yw_jy_backup.json", {
    exportedAt: Date.now(),
    photos: all[PHOTOS_PATH] || {},
    memos: all[MEMOS_PATH] || {}
  });
}

async function importAllFromFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);

  await set(ref(db, MEMOS_PATH), parsed?.memos || {});

  const photosObj = parsed?.photos || {};
  const photoEntries = Object.values(photosObj);

  for (const p of photoEntries) {
    if (p && p.id && p.url) {
      await set(ref(db, `${PHOTOS_PATH}/${String(p.id)}`), {
        id: String(p.id),
        album: normalizeAlbum(p.album),
        name: String(p.name || "photo"),
        caption: String(p.caption || ""),
        date: (typeof p.date === "number" ? p.date : null),
        createdAt: (typeof p.createdAt === "number" ? p.createdAt : Date.now()),
        order: (typeof p.order === "number" ? p.order : 0),
        storagePath: p.storagePath || null,
        url: String(p.url)
      });
    }
  }
  alert("복원 완료 ♡");
}

// Listeners
function listenPhotos() {
  onValue(ref(db, PHOTOS_PATH), (snap) => {
    const obj = snap.val() || {};
    const rows = Object.values(obj).sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
    galleryAll = rows;

    rebuildAlbumOptionsFromList(galleryAll);
    renderGallery();
  });
}

function listenMemos() {
  onValue(ref(db, MEMOS_PATH), (snap) => {
    const obj = snap.val() || {};
    renderMemosFromList(Object.values(obj));
  });
}

// UI handlers
function initGalleryUI() {
  $("photoDate").value = toISODateInputValue(new Date());

  $("photoInput").addEventListener("change", async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;

    const album = normalizeAlbum($("albumName").value);
    const dateTs = fromISODateInputValue($("photoDate").value);
    const caption = $("photoCaption").value.trim();

    try {
      const startOrder = galleryAll.length;
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (!f.type.startsWith("image/")) continue;
        await uploadPhotoToStorageAndSaveMeta({
          file: f, album, dateTs, caption, order: startOrder + i
        });
      }
      e.target.value = "";
      resetPagingState(true);
    } catch {
      // alert는 uploadPhotoToStorage... 에서 이미 띄움
    }
  });

  $("albumFilter").addEventListener("change", (e) => {
    currentAlbum = e.target.value;
    resetPagingState(true);
    renderGallery();
  });

  $("loadMore").addEventListener("click", () => {
    page += 1;
    renderGallery();
  });

  $("resetPaging").addEventListener("click", () => {
    resetPagingState(true);
    renderGallery();
  });

  $("clearDB").addEventListener("click", async () => {
    const ok = confirm("갤러리를 전부 지울까요? (사진이 정말 다 사라져요)");
    if (!ok) return;
    await clearAllPhotosFirebase();
    resetPagingState(true);
  });

  $("exportDB").addEventListener("click", exportAll);

  $("importDB").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importAllFromFile(file);
      e.target.value = "";
    } catch (err) {
      alert(err?.message || "복원에 실패했어요.");
    }
  });
}

// Boot
function boot() {
  initLock();
  initMemoUI();
  initGalleryUI();

  renderCounter();
  renderMilestones();

  listenPhotos();
  listenMemos();

  setInterval(() => {
    renderCounter();
    renderMilestones();
  }, 1000);
}

boot();
