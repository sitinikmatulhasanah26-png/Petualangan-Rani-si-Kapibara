import { json, body, stores, listAll, readJson, requireTeacher, teacherToken, errorResponse, deletePrefix } from "./lib/shared.mjs";
export default async (req) => {
  try {
    const { students, scores, reflections, projects }=stores();
    if(req.method==="POST"){
      const d=await body(req);
      if(d.action==="login"){
        if(!process.env.TEACHER_PIN) throw new Error("TEACHER_PIN belum diatur di Netlify.");
        if(String(d.pin||"")!==process.env.TEACHER_PIN) return json({ok:false,error:"PIN guru tidak sesuai."},401);
        return json({ok:true,token:teacherToken(),expiresIn:28800});
      }
      requireTeacher(req);
      if(d.action==="data"){
        const [studentKeys,scoreKeys,reflectionKeys,projectKeys]=await Promise.all([
          listAll(students,""),listAll(scores,""),listAll(reflections,""),listAll(projects,"")
        ]);
        const [roster,scoreRows,reflectionRows,projectRows]=await Promise.all([
          Promise.all(studentKeys.map(x=>readJson(students,x.key))),
          Promise.all(scoreKeys.map(x=>readJson(scores,x.key))),
          Promise.all(reflectionKeys.map(x=>readJson(reflections,x.key))),
          Promise.all(projectKeys.map(x=>readJson(projects,x.key)))
        ]);
        const cleanScores=scoreRows.filter(Boolean), cleanProjects=projectRows.filter(Boolean);
        return json({ok:true,data:{
          students:roster.filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name,"id")),
          scores:cleanScores,
          reflections:reflectionRows.filter(Boolean).sort((a,b)=>b.Timestamp.localeCompare(a.Timestamp)),
          projects:cleanProjects.sort((a,b)=>b.Timestamp.localeCompare(a.Timestamp))
        }});
      }
      if(d.action==="reset"){
        const targets={Nilai:scores,Refleksi:reflections,Proyek:projects};
        const store=targets[d.section];
        if(!store) return json({ok:false,error:"Bagian reset tidak dikenal."},400);
        const deleted=await deletePrefix(store,"");
        if(d.section==="Proyek"){
          await deletePrefix(stores().images,"");
        }
        return json({ok:true,deleted});
      }
      return json({ok:false,error:"Aksi guru tidak dikenal."},400);
    }
    return json({ok:false,error:"Metode tidak didukung."},405);
  }catch(e){return errorResponse(e, e.message?.includes("Sesi guru")?401:400);}
};
