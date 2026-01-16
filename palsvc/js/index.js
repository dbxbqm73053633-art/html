// =====================================================
// Firestore + Storage + Anonymous Auth
// - Photos: Storage(file) + Firestore(meta)
// - Memos : Firestore
// =====================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js";

import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

import {
  getStorage,
  ref as sref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-storage.js";

// -----------------------
// 1) Config
// -----------------------
const PASSWORD = "0113";
const SESSION_KEY = "ywjy_unlocked_v3";

// ✅ 우리 시작일(원하는 날짜로 수정 가능)
const START = new Date(2026, 0, 13, 0, 0, 0);

// ✅ 콘솔(Project settings)에서 본 Storage bucket 값으로!
const STORAGE_BUCKET = "duddn730.appspot.com";

const firebaseConfig = {
  apiKey: "AIzaSyCbAWAchLN1IRitre_VW-drnSoPPBkVDSo",
  authDomain: "duddn730.firebaseapp.com",
  projectId: "duddn730",
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: "326941968662",
  appId: "1:326941968662:web:a1d756ce52e22a92fd2837",
  measurementId: "G-XJCZH9SJLS"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);

const auth = getAuth(app);
const fs = getFirestore(app);
const storage = getStorage(app, `gs://${STORAGE_BUCKET}`);

// Firestore collections
const photosCol = collection(fs, "photos");
const memosCol  = collection(fs, "memos");

// -----------------------
// 2) DOM helpers
// -----------------------
const $ = (id) => document.getElementById(id);
const pad2 = (n) => String(n).padStart(2, "0");

function fmtDate(d) {
  const week = ["일","월","화","수","목","금","토"];
  return `${d.getFullYear()}.${pad2(d.getMonth()+1)}.${pad2(d.getDate())} (${week[d.getDay()]})`;
}

function toISODateInputValue(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth()+1)}-${pad2(date.getDate())}`;
}
function fromISODateInputValue(v) {
  if (!v) return null;
  const [y,m,d] = v.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m-1, d, 0,0,0).getTime();
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function normalizeAlbum(v) {
  const t = String(v || "").trim();
  return t ? t : "기본앨범";
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : (String(Date.now()) + Math.random());
}

// -----------------------
// 3) Anonymous Auth
// -----------------------
async function ensureAnonAuth() {
  const hint = $("authStateHint");
  if (!hint) return;

  if (auth.currentUser) {
    hint.textContent = `인증 OK (uid: ${auth.currentUser.uid.slice(0,6)}…)`;
    return auth.currentUser;
  }

  hint.textContent = "익명 로그인 중…";
  try {
    const cred = await signInAnonymously(auth);
    hint.textContent = `인증 OK (uid: ${cred.user.uid.slice(0,6)}…)`;
    return cred.user;
  } catch (e) {
    console.log("ANON AUTH ERROR:", e);
    hint.textContent = "익명 로그인 실패 (콘솔에서 Anonymous ON 확인)";
    alert(`익명 로그인 실패\n${e.code}\n${e.message}`);
    throw e;
  }
}

// -----------------------
// 4) Lock screen (로컬 UI)
// -----------------------
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
    const pass = String($("lockPass").value || "").trim();
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

// -----------------------
// 5) Counter
// -----------------------
function renderCounter() {
  const now = new Date();
  const ms = Math.max(0, now - START);

  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours   = Math.floor(totalMinutes / 60);
  const totalDays    = Math.floor(totalHours / 24);

  const remSeconds = totalSeconds % 60;
  const remMinutes = totalMinutes % 60;
  const remHours   = totalHours % 24;

  $("startDateLabel").textContent = fmtDate(START);
  $("todayLabel").textContent = fmtDate(now);

  $("dDay").textContent = `D+${totalDays}`;
  $("sinceText").textContent = `${fmtDate(START)}부터 우리가 만든 따뜻한 시간`;
  $("hhmmss").textContent = `${pad2(remHours)}:${pad2(remMinutes)}:${pad2(remSeconds)}`;

  $("days").textContent = totalDays.toLocaleString();
  $("hours").textContent = totalHours.toLocaleString();
  $("minutes").textContent = totalMinutes.toLocaleString();
  $("seconds").textContent = totalSeconds.toLocaleString();
}

// -----------------------
// 6) Image compression
// -----------------------
const MAX_IMAGE_LONG_SIDE = 1600;
const JPG_QUALITY = 0.86;

function dataUrlToBlob(dataUrl) {
  const [meta, b64] = dataUrl.split(",");
  const mime = (meta.match(/data:(.*?);base64/) || [])[1] || "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

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
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);

        resolve(canvas.toDataURL("image/jpeg", JPG_QUALITY));
      };
      img.onerror = () => reject(new Error("이미지를 불러올 수 없어요."));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// -----------------------
// 7) Photos (Firestore + Storage)
// -----------------------
let photosAll = [];
let currentAlbum = "__ALL__";

function rebuildAlbumOptions() {
  const sel = $("albumFilter");
  const prev = sel.value || "__ALL__";

  const albums = new Set(photosAll.map(p => p.album || "기본앨범"));
  const list = [...albums].sort((a,b)=>a.localeCompare(b,"ko"));

  sel.innerHTML = `<option value="__ALL__">전체 앨범</option>` + list.map(a =>
    `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`
  ).join("");

  sel.value = ([ "__ALL__", ...list ].includes(prev)) ? prev : "__ALL__";
  currentAlbum = sel.value;
}

function renderGallery() {
  const wrap = $("gallery");
  $("photoCount").textContent = String(photosAll.length);

  const view = (currentAlbum === "__ALL__")
    ? photosAll
    : photosAll.filter(p => (p.album || "기본앨범") === currentAlbum);

  if (!view.length) {
    wrap.innerHTML = `<p class="hint">아직 사진이 없어요. 우리 첫 장을 담아볼까요?</p>`;
    return;
  }

  wrap.innerHTML = view.map((p) => {
    const caption = p.caption?.trim() ? p.caption.trim() : "캡션 없음";
    const dateLabel = p.date ? new Date(p.date) : null;
    const dateText = dateLabel ? `${dateLabel.getFullYear()}.${pad2(dateLabel.getMonth()+1)}.${pad2(dateLabel.getDate())}` : "날짜 없음";
    return `
      <div class="photo">
        <img class="photo__img" src="${p.url}" alt="${escapeHtml(caption)}" loading="lazy" />
        <div class="photo__tags">
          <span class="tag">${escapeHtml(p.album || "기본앨범")}</span>
          <span class="tag">${escapeHtml(dateText)}</span>
        </div>
        <div class="photo__bar">
          <div class="photo__name">
            <div class="photo__caption">${escapeHtml(caption)}</div>
            <div class="photo__sub">${escapeHtml(p.name || "photo")}</div>
          </div>
          <div class="photo__actions">
            <button class="iconBtn" type="button" data-del="${escapeHtml(p.id)}" title="삭제">✕</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  wrap.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del");
      await deletePhoto(id);
    });
  });
}

async function uploadOnePhoto(file, album, dateTs, caption) {
  await ensureAnonAuth();

  const dataUrl = await fileToDataUrlCompressed(file);
  const blob = dataUrlToBlob(dataUrl);

  const id = uid();
  const storagePath = `photos/${id}.jpg`;
  const storageRef = sref(storage, storagePath);

  try {
    await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  } catch (e) {
    console.log("STORAGE ERROR:", e);
    alert(`사진 업로드 실패\n${e.code}\n${e.message}\n\n(1) Anonymous ON (2) Storage Rules auth!=null 확인`);
    throw e;
  }

  const url = await getDownloadURL(storageRef);

  await setDoc(doc(fs, "photos", id), {
    album,
    caption: caption || "",
    date: dateTs || null,
    name: file.name || "photo",
    url,
    storagePath,
    createdAt: serverTimestamp()
  });
}

async function deletePhoto(id) {
  await ensureAnonAuth();

  const target = photosAll.find(p => p.id === id);
  if (!target) return;

  if (target.storagePath) {
    try { await deleteObject(sref(storage, target.storagePath)); } catch {}
  }
  await deleteDoc(doc(fs, "photos", id));
}

async function clearAllPhotos() {
  await ensureAnonAuth();
  const ok = confirm("갤러리를 전부 지울까요? (사진이 정말 다 사라져요)");
  if (!ok) return;

  // Firestore 전체 문서 조회 후 삭제
  const snap = await getDocs(collection(fs, "photos"));
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Storage 파일 삭제
  await Promise.allSettled(docs.map(async (p) => {
    if (p.storagePath) {
      try { await deleteObject(sref(storage, p.storagePath)); } catch {}
    }
  }));

  // Firestore 문서 삭제
  await Promise.allSettled(docs.map(async (p) => deleteDoc(doc(fs, "photos", p.id))));

  alert("전체 삭제 완료 ♡");
}

function listenPhotos() {
  // createdAt 최신순 (서버타임)
  const q = query(photosCol, orderBy("createdAt", "desc"));

  onSnapshot(q, (snap) => {
    photosAll = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    rebuildAlbumOptions();
    renderGallery();
  });
}

// -----------------------
// 8) Memos (Firestore)
// -----------------------
function renderMemos(memos) {
  const wrap = $("memoList");
  if (!memos.length) {
    wrap.innerHTML = `<p class="hint">아직 메모가 없어요. 오늘의 다정함을 한 줄 남겨볼까요?</p>`;
    return;
  }

  wrap.innerHTML = memos.map(m => {
    const created = m.createdAt?.toDate ? m.createdAt.toDate() : null;
    return `
      <div class="memo">
        <div class="memo__top">
          <div>
            <div class="memo__title">${escapeHtml(m.title || "제목 없음")}</div>
            <div class="memo__date">${created ? fmtDate(created) : ""}</div>
          </div>
        </div>
        <div class="memo__body">${escapeHtml(m.body || "")}</div>
        <div class="memo__actions">
          <button class="btn btn--ghost" data-mdel="${escapeHtml(m.id)}">삭제</button>
        </div>
      </div>
    `;
  }).join("");

  wrap.querySelectorAll("[data-mdel]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await ensureAnonAuth();
      const id = btn.getAttribute("data-mdel");
      await deleteDoc(doc(fs, "memos", id));
    });
  });
}

function listenMemos() {
  const q = query(memosCol, orderBy("createdAt", "desc"));
  onSnapshot(q, (snap) => {
    const memos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderMemos(memos);
  });
}

// -----------------------
// 9) UI wiring
// -----------------------
function initUI() {
  $("photoDate").value = toISODateInputValue(new Date());

  $("photoInput").addEventListener("change", async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;

    const album = normalizeAlbum($("albumName").value);
    const dateTs = fromISODateInputValue($("photoDate").value);
    const caption = String($("photoCaption").value || "").trim();

    try {
      for (const f of files) {
        if (!f.type.startsWith("image/")) continue;
        await uploadOnePhoto(f, album, dateTs, caption);
      }
      e.target.value = "";
    } catch {
      // alert는 내부에서 출력
    }
  });

  $("albumFilter").addEventListener("change", (e) => {
    currentAlbum = e.target.value;
    renderGallery();
  });

  $("resetAlbum").addEventListener("click", () => {
    currentAlbum = "__ALL__";
    $("albumFilter").value = "__ALL__";
    renderGallery();
  });

  $("clearPhotos").addEventListener("click", clearAllPhotos);

  $("memoForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await ensureAnonAuth();

    const title = String($("memoTitle").value || "").trim();
    const body  = String($("memoBody").value || "").trim();
    if (!title && !body) return;

    await addDoc(memosCol, {
      title,
      body,
      createdAt: serverTimestamp()
    });

    $("memoTitle").value = "";
    $("memoBody").value = "";
  });

  $("clearMemos").addEventListener("click", async () => {
    await ensureAnonAuth();
    const snap = await getDocs(collection(fs, "memos"));
    await Promise.allSettled(snap.docs.map(d => deleteDoc(d.ref)));
  });
}

// -----------------------
// 10) Boot
// -----------------------
async function boot() {
  initLock();
  initUI();

  // Counter
  renderCounter();
  setInterval(renderCounter, 1000);

  // Auth status watcher
  onAuthStateChanged(auth, (user) => {
    const hint = $("authStateHint");
    if (!hint) return;
    hint.textContent = user ? `인증 OK (uid: ${user.uid.slice(0,6)}…)` : "인증 없음";
  });

  // ✅ 시작 시 익명 로그인 시도
  await ensureAnonAuth();

  // Listen Firestore
  listenPhotos();
  listenMemos();
}

boot().catch(() => {});
