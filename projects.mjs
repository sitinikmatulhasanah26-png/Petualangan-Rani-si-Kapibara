import { json, body, normalizeName, studentId, stores, readJson, errorResponse } from "./lib/shared.mjs";
import { randomUUID } from "node:crypto";
export default async (req) => {
  try {
    const { students, projects, images }=stores();
    if(req.method==="GET"){
      const name=new URL(req.url).searchParams.get("name");
      if(!name) return json({ok:false,error:"Nama wajib disertakan."},400);
      const id=studentId(name), existing=await readJson(projects,id);
      return json({ok:true,submitted:!!existing,project:existing?{Nama:existing.Nama,Timestamp:existing.Timestamp}:null});
    }
    if(req.method==="POST"){
      const d=await body(req), name=normalizeName(d.name), id=studentId(name);
      const student=await readJson(students,id);
      if(!student) return json({ok:false,error:"Login siswa belum tercatat."},404);
      const photo=String(d.photoData||"");
      const match=photo.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
      if(!match) return json({ok:false,error:"Foto poster tidak valid. Gunakan JPG, PNG, atau WebP."},400);
      const bytes=Buffer.from(match[2],"base64");
      if(bytes.length>3_500_000) return json({ok:false,error:"Foto masih terlalu besar. Pilih foto yang lebih kecil."},413);
      const projectId=randomUUID(), timestamp=new Date().toISOString();
      const imageKey=`${projectId}.${match[1]==="jpeg"?"jpg":match[1]}`;
      // Simpan metadata proyek secara kondisional. Hanya satu request per ID siswa yang dapat menang.
      const projectRecord={id:projectId,studentId:id,Nama:student.name,jenis:"Poster Peta Indonesia",hasil:String(d.description||"").slice(0,1000),imageKey,contentType:match[1]==="jpeg"?"image/jpeg":`image/${match[1]}`,size:bytes.length,Timestamp:timestamp};
      const claim=await projects.setJSON(id,projectRecord,{onlyIfNew:true});
      if(!claim.modified) return json({ok:false,duplicate:true,error:"Nama ini sudah mengumpulkan Poster Peta Indonesia. Pengumpulan kedua tidak diizinkan."},409);
      try {
        await images.set(imageKey,bytes,{metadata:{contentType:projectRecord.contentType,studentId:id}});
      } catch(e) {
        await projects.delete(id);
        throw new Error("Foto gagal disimpan. Silakan coba kirim kembali.");
      }
      return json({ok:true,project:{...projectRecord,photoUrl:`/.netlify/functions/project-image?id=${encodeURIComponent(projectId)}`}});
    }
    return json({ok:false,error:"Metode tidak didukung."},405);
  }catch(e){return errorResponse(e);}
};
