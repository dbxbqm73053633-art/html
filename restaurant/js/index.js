// ===============================
// 0) 설정값
// ===============================

// ✅ 앱 입장 비밀번호(화면 잠금용)
const APP_PASSWORD = "0113";

// ✅ 같은 ROOM을 쓰는 사람들은 모두 데이터를 공유합니다.
const ROOM_ID = "shared-room-1";

// ✅ 세션(브라우저 탭)에서만 잠금 해제 유지
const SESSION_UNLOCK_KEY = "shared_unlocked_v1";

// 이미지 압축 옵션
const MAX_IMAGE_LONG_SIDE = 1600;
const JPG_QUALITY = 0.86;


// ===============================
// 1) Firebase SDK (ESM)
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getStorage,
  ref as sRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";


// 🔥 Firebase 콘솔에서 복사한 config로 교체하세요
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


// ===============================
// 2) DOM 유틸
// ===============================
const $ = (id) => document.getElementById(id);

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmtTime(dateObj) {
  if (!dateObj) return "—";
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${day} ${hh}:${mm}`;
}


// ===============================
// 3) 잠금(비밀번호) + 익명 로그인
// ===============================
function showLock() {
  $("lock").classList.remove("hide");
  $("lock").setAttribute("aria-hidden", "false");
  $("lockHint").classList.remove("error");
  $("lockHint").textContent = "비밀번호를 입력해주세요.";
  $("lockPass").value = "";
  $("lockPass").focus();
}

function hideLock() {
  $("lock").classList.add("hide");
  $("lock").setAttribute("aria-hidden", "true");
}

async function ensureSignedIn() {
  // 익명 로그인 (Firestore/Storage 규칙에서 request.auth != null 만족)
  await signInAnonymously(auth);
}

function initLock() {
  $("roomLabel").textContent = `ROOM: ${ROOM_ID}`;

  const unlocked = sessionStorage.getItem(SESSION_UNLOCK_KEY) === "1";
  if (!unlocked) showLock();
  else hideLock();

  $("lockForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const pass = String($("lockPass").value || "").trim();

    if (pass !== APP_PASSWORD) {
      $("lockHint").classList.add("error");
      $("lockHint").textContent = "비밀번호가 틀렸어요.";
      $("lockPass").select();
      return;
    }

    try {
      await ensureSignedIn();
      sessionStorage.setItem(SESSION_UNLOCK_KEY, "1");
      hideLock();
    } catch (err) {
      $("lockHint").classList.add("error");
      $("lockHint").textContent = err?.message || "Firebase 연결에 실패했어요.";
    }
  });

  $("lockBtn").addEventListener("click", async () => {
    sessionStorage.removeItem(SESSION_UNLOCK_KEY);
    try { await signOut(auth); } catch {}
    showLock();
  });
}

onAuthStateChanged(auth, (user) => {
  $("connState").textContent = user ? "연결됨" : "연결 안됨";
});


// ===============================
// 4) Firestore 경로 헬퍼
// ===============================
function memosCol() {
  return collection(db, "shared", ROOM_ID, "memos");
}
function photosCol() {
  return collection(db, "shared", ROOM_ID, "photos");
}


// ===============================
// 5) 메모 (Firestore, 실시간)
// ===============================
async function addMemo(title, body) {
  await addDoc(memosCol(), {
    title: title || "",
    body: body || "",
    createdAt: serverTimestamp(),
    authorUid: auth.currentUser?.uid || "",
  });
}

async function deleteMemo(memoId) {
  await deleteDoc(doc(db, "shared", ROOM_ID, "memos", memoId));
}

function renderMemos(rows) {
  const wrap = $("memoList");

  if (!rows.length) {
    wrap.innerHTML = `<p class="hint">아직 메모가 없어요.</p>`;
    return;
  }

  wrap.innerHTML = rows.map((m) => {
    const created = m.createdAt?.toDate ? m.createdAt.toDate() : null;
    return `
      <div class="item">
        <div class="item__top">
          <div class="item__title">${escapeHtml(m.title || "제목 없음")}</div>
          <div class="item__meta">${fmtTime(created)}</div>
        </div>
        <div class="item__body">${escapeHtml(m.body || "")}</div>
        <div class="item__actions">
          <button class="btn btn--ghost" data-memo-del="${escapeHtml(m.id)}">삭제</button>
        </div>
      </div>
    `;
  }).join("");

  wrap.querySelectorAll("[data-memo-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-memo-del");
      await deleteMemo(id);
    });
  });
}

let unsubMemos = null;
function listenMemos() {
  if (unsubMemos) unsubMemos();
  const q = query(memosCol(), orderBy("createdAt", "desc"));
  unsubMemos = onSnapshot(q, (snap) => {
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderMemos(rows);
  });
}

function initMemos() {
  $("memoForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = $("memoTitle").value.trim();
    const body = $("memoBody").value.trim();
    if (!title && !body) return;

    await addMemo(title, body);
    $("memoTitle").value = "";
    $("memoBody").value = "";
  });

  $("memoRefresh").addEventListener("click", () => {
    listenMemos();
  });
}


// ===============================
// 6) 사진 (Storage 업로드 + Firestore 메타, 실시간)
// ===============================
function fileToCompressedBlob(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("파일을 읽을 수 없어요."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("이미지를 불러올 수 없어요."));
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

        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("이미지 변환 실패")),
          "image/jpeg",
          JPG_QUALITY
        );
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadPhotoFile(file, album, caption) {
  const blob = await fileToCompressedBlob(file);
  const photoId = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

  // Storage에 저장될 경로
  const storagePath = `shared/${ROOM_ID}/photos/${photoId}.jpg`;
  const r = sRef(storage, storagePath);

  await uploadBytes(r, blob, { contentType: "image/jpeg" });
  const url = await getDownloadURL(r);

  // Firestore에 메타 저장
  await addDoc(photosCol(), {
    storagePath,
    url,
    album: album || "기본앨범",
    caption: caption || "",
    createdAt: serverTimestamp(),
    authorUid: auth.currentUser?.uid || "",
  });
}

async function deletePhoto(photoDocId, storagePath) {
  await deleteDoc(doc(db, "shared", ROOM_ID, "photos", photoDocId));
  try {
    await deleteObject(sRef(storage, storagePath));
  } catch {
    // 파일 삭제가 실패해도 문서 삭제는 유지
  }
}

function renderPhotos(rows) {
  const wrap = $("photoGrid");

  if (!rows.length) {
    wrap.innerHTML = `<p class="hint">아직 사진이 없어요.</p>`;
    return;
  }

  wrap.innerHTML = rows.map((p) => {
    const created = p.createdAt?.toDate ? p.createdAt.toDate() : null;
    const cap = p.caption?.trim() ? p.caption.trim() : "캡션 없음";
    const album = p.album || "기본앨범";
    const url = p.url || "";
    const storagePath = p.storagePath || "";

    return `
      <div class="photo">
        <img src="${escapeHtml(url)}" alt="${escapeHtml(cap)}" loading="lazy" />
        <div class="photo__cap">
          <div class="photo__line1">${escapeHtml(cap)}</div>
          <div class="photo__line2">${escapeHtml(album)} · ${fmtTime(created)}</div>
        </div>
        <div class="photo__bar">
          <button class="btn btn--ghost"
            data-photo-del="${escapeHtml(p.id)}"
            data-photo-path="${escapeHtml(storagePath)}">삭제</button>
        </div>
      </div>
    `;
  }).join("");

  wrap.querySelectorAll("[data-photo-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-photo-del");
      const path = btn.getAttribute("data-photo-path");
      await deletePhoto(id, path);
    });
  });
}

let unsubPhotos = null;
function listenPhotos() {
  if (unsubPhotos) unsubPhotos();
  const q = query(photosCol(), orderBy("createdAt", "desc"));
  unsubPhotos = onSnapshot(q, (snap) => {
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderPhotos(rows);
  });
}

function initPhotos() {
  $("photoInput").addEventListener("change", async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;

    const album = $("photoAlbum").value.trim() || "기본앨범";
    const caption = $("photoCaption").value.trim();

    try {
      for (const f of files) {
        if (!f.type.startsWith("image/")) continue;
        await uploadPhotoFile(f, album, caption);
      }
      e.target.value = "";
    } catch (err) {
      alert(err?.message || "사진 업로드에 실패했어요.");
    }
  });
}


// ===============================
// 7) Boot
// ===============================
async function boot() {
  initLock();
  initMemos();
  initPhotos();

  // 이미 잠금 해제 상태면 자동 로그인 시도
  if (sessionStorage.getItem(SESSION_UNLOCK_KEY) === "1") {
    try {
      await ensureSignedIn();
      hideLock();
    } catch {
      showLock();
    }
  }

  // 실시간 구독 시작
  listenMemos();
  listenPhotos();
}

boot();
