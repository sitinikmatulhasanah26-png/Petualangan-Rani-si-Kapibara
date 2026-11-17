import { json, body, normalizeName, studentId, stores, readJson, errorResponse } from "./lib/shared.mjs";
import { randomUUID } from "node:crypto";
export default async (req) => {
  try {
    const { students, reflections }=stores();
    if(req.method==="POST"){
      const d=await body(req), name=normalizeName(d.name), id=studentId(name);
      const student=await readJson(students,id);
      if(!student) return json({ok:false,error:"Login siswa belum tercatat."},404);
      const r=d.reflection||{};
      const clean={id:randomUUID(),studentId:id,Nama:student.name,Bab1:String(r.Bab1||"").slice(0,100),Bab2:String(r.Bab2||"").slice(0,100),perasaan:String(r.perasaan||"").slice(0,100),pesan:String(r.pesan||"").slice(0,3000),Timestamp:new Date().toISOString()};
      if(!clean.pesan.trim()) return json({ok:false,error:"Pesan dan kesan refleksi wajib diisi."},400);
      await reflections.setJSON(clean.id,clean,{onlyIfNew:true});
      return json({ok:true,reflection:clean});
    }
    return json({ok:false,error:"Metode tidak didukung."},405);
  } catch(e){return errorResponse(e);}
};
