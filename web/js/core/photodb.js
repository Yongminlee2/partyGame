// 사진 퀴즈용 IndexedDB 저장소. 사진은 이 기기 안에만 저장되고 어디로도 전송되지 않는다.
const DB_NAME = 'partygame-photos';
const STORE = 'photos';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const result = fn(store);
    t.oncomplete = () => resolve(result?.result ?? result);
    t.onerror = () => reject(t.error);
  });
}

export async function allPhotos() {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const req = db.transaction(STORE).objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return []; // IndexedDB 불가 환경(시크릿 모드 등)은 세션 한정으로만 동작
  }
}

export async function addPhoto(blob, answer) {
  const db = await openDb();
  return tx(db, 'readwrite', s => s.add({ blob, answer, created: Date.now() }));
}

export async function updateAnswer(id, answer) {
  const db = await openDb();
  return tx(db, 'readwrite', s => {
    const req = s.get(id);
    req.onsuccess = () => {
      const rec = req.result;
      if (rec) { rec.answer = answer; s.put(rec); }
    };
  });
}

export async function removePhoto(id) {
  const db = await openDb();
  return tx(db, 'readwrite', s => s.delete(id));
}
