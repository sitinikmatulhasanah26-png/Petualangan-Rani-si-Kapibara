import { getStore } from "@netlify/blobs";
import { validTeacherToken, json } from "./lib/shared.mjs";
export default async (req) => {
  const u=new URL(req.url), id=u.searchParams.get("id"), token=u.searchParams.get("token");
  if(!id || !validTeacherToken(token)) return json({ok:false,error:"Akses foto hanya tersedia untuk guru."},401);
  const projects=getStore("rani-projects-v1"), images=getStore("rani-project-images-v1");
  const {blobs=[]}=await projects.list();
  let project=null;
  for(const b of blobs){const p=await projects.get(b.key,{type:"json",consistency:"strong"});if(p?.id===id){project=p;break;}}
  if(!project) return json({ok:false,error:"Foto proyek tidak ditemukan."},404);
  const data=await images.get(project.imageKey,{type:"arrayBuffer",consistency:"strong"});
  if(!data) return json({ok:false,error:"Berkas foto tidak ditemukan."},404);
  return new Response(data,{headers:{"content-type":project.contentType||"image/jpeg","cache-control":"private, max-age=300","x-content-type-options":"nosniff"}});
};
