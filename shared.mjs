import { getStore } from "@netlify/blobs";
import { createHash, createHmac, timingSafeEqual, randomUUID } from "node:crypto";

export const json = (data, status=200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
export async function body(req) {
  try { return await req.json(); } catch { throw new Error("Isi permintaan bukan JSON yang valid."); }
}
export function normalizeName(name) {
  if (typeof name !== "string") throw new Error("Nama lengkap wajib diisi.");
  const clean = name.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (clean.length < 2 || clean.length > 60 || /[\u0000-\u001f<>]/.test(clean)) throw new Error("Nama harus 2–60 karakter dan tidak boleh berisi karakter kontrol atau tag.");
  return clean;
}
export const studentId = name => createHash("sha256").update(normalizeName(name).toLocaleLowerCase("id-ID")).digest("hex");
export const stores = () => ({
  students: getStore("rani-students-v1"),
  scores: getStore("rani-scores-v1"),
  reflections: getStore("rani-reflections-v1"),
  projects: getStore("rani-projects-v1"),
  images: getStore("rani-project-images-v1")
});
export function teacherToken() {
  const pin = process.env.TEACHER_PIN;
  const secret = process.env.TEACHER_SESSION_SECRET;
  if (!pin || pin.length < 4) throw new Error("Environment variable TEACHER_PIN belum diatur (minimal 4 karakter).");
  if (!secret || secret.length < 32) throw new Error("Environment variable TEACHER_SESSION_SECRET wajib diatur (minimal 32 karakter acak).");
  const exp = Math.floor(Date.now()/1000) + 8*60*60;
  const sig = createHmac("sha256", secret).update(String(exp)).digest("hex");
  return `${exp}.${sig}`;
}
export function validTeacherToken(token) {
  try {
    const [exp, sig] = String(token || "").split(".");
    if (!exp || !sig || Number(exp) < Math.floor(Date.now()/1000)) return false;
    const secret = process.env.TEACHER_SESSION_SECRET;
    if (!secret) return false;
    const expected = createHmac("sha256", secret).update(exp).digest("hex");
    const a=Buffer.from(sig), b=Buffer.from(expected);
    return a.length===b.length && timingSafeEqual(a,b);
  } catch { return false; }
}
export function requireTeacher(req, tokenOverride) {
  const token = tokenOverride || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!validTeacherToken(token)) throw new Error("Sesi guru tidak sah atau kedaluwarsa. Silakan masuk kembali.");
  return token;
}
export async function listAll(store, prefix) {
  const { blobs=[] } = await store.list({ prefix });
  return blobs;
}
export async function readJson(store, key) {
  const raw = await store.get(key, { type: "json", consistency: "strong" });
  return raw ?? null;
}
export async function deletePrefix(store, prefix="") {
  const items = await listAll(store, prefix);
  for (const item of items) await store.delete(item.key);
  return items.length;
}
export function errorResponse(err, status=400) {
  return json({ ok:false, error: err?.message || "Terjadi kesalahan server." }, status);
}
