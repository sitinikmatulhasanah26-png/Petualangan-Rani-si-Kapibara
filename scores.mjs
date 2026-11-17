import { json, body, normalizeName, studentId, stores, readJson, errorResponse } from "./lib/shared.mjs";
export default async (req) => {
  try {
    const { students, scores } = stores();
    if (req.method === "POST") {
      const d = await body(req), name=normalizeName(d.name), id=studentId(name);
      const student = await readJson(students,id);
      if (!student) return json({ok:false,error:"Sesi siswa belum tercatat. Silakan login kembali."},404);
      const qid = String(d.questionId || "").trim();
      const allowed = /^(?:Quiz (?:Gunung (?:Kompas|Benua|Samudra|Nusantara|Pengaruh)|Puncak Strategis)::Soal [1-4]|Pemantapan Bab [12]::Soal [1-5]|Tantangan Puncak::Soal [1-5])$/;
      if (!allowed.test(qid)) return json({ok:false,error:"Identitas soal tidak termasuk bank soal aplikasi."},400);
      const score = Number(d.score);
      if (![0,10].includes(score)) return json({ok:false,error:"Nilai soal harus 0 atau 10."},400);
      const key = `${id}/${encodeURIComponent(qid)}`;
      await scores.setJSON(key,{studentId:id,name:student.name,questionId:qid,score,updatedAt:new Date().toISOString()});
      return json({ok:true,score});
    }
    if (req.method === "GET") {
      const u=new URL(req.url), name=u.searchParams.get("name");
      if (!name) return json({ok:false,error:"Nama wajib disertakan."},400);
      const id=studentId(name), entries=await scores.list({prefix:`${id}/`});
      const rows=[];
      for (const item of entries.blobs||[]) { const v=await readJson(scores,item.key); if(v) rows.push(v); }
      return json({ok:true,scores:rows,total:rows.reduce((a,x)=>a+x.score,0)});
    }
    return json({ok:false,error:"Metode tidak didukung."},405);
  } catch(e) { return errorResponse(e); }
};
