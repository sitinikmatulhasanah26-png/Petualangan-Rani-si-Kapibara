import { json, body, normalizeName, studentId, stores, readJson, errorResponse } from "./lib/shared.mjs";
export default async (req) => {
  try {
    const { students } = stores();
    if (req.method === "POST") {
      const { name } = await body(req);
      const clean = normalizeName(name), id = studentId(clean);
      const record = { id, name: clean, firstLogin: new Date().toISOString(), lastLogin: new Date().toISOString() };
      const result = await students.setJSON(id, record, { onlyIfNew:true });
      if (!result.modified) {
        const old = await readJson(students, id);
        record.firstLogin = old?.firstLogin || record.firstLogin;
        record.lastLogin = new Date().toISOString();
        await students.setJSON(id, record);
      }
      return json({ ok:true, student:record, created:result.modified });
    }
    return json({ok:false,error:"Metode tidak didukung."},405);
  } catch(e) { return errorResponse(e); }
};
