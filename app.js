// Supabase version of AttendEase.
// Paste your Supabase Project URL and anon/public key below.
// Do not put a service_role key in browser code.

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const DEMO_MODE = false; // Set true for a browser-only preview (not cloud storage).
const SUPABASE_URL = "https://yzikkglftjedoabaowwq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_RgmsdcUq7xzLWXl2sdqg4g_sFADLPkk";

let supabase = null;
if (!DEMO_MODE) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const $ = id => document.getElementById(id);
const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const today = localDate();
let currentUser = null, isRegister = false, students = [], attendance = {};
let demoUsers = JSON.parse(localStorage.getItem("ae_users") || "{}");
let demoData = JSON.parse(localStorage.getItem("ae_data") || "{}");

function userData(){ if(!demoData[currentUser]) demoData[currentUser]={students:[],records:{}}; return demoData[currentUser]; }
function persistDemo(){localStorage.setItem("ae_data",JSON.stringify(demoData));}
function showMessage(id,msg,success=false){const el=$(id);el.textContent=msg;el.classList.toggle("success",success);}
function dateText(d){return new Date(d+"T12:00:00").toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"});}
function safeText(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function friendlyError(err){
  const msg=err?.message||"Something went wrong.";
  if(msg.includes("Invalid login credentials"))return "Email or password is incorrect.";
  if(msg.includes("User already registered"))return "This email is already registered.";
  if(msg.includes("Password should be"))return "Password must be at least 6 characters.";
  if(msg.includes("Failed to fetch"))return "Network/configuration error. Check your Supabase URL and key.";
  return msg;
}
$("attendanceDate").value=today;$("todayLabel").textContent=dateText(today);

$("switchAuth").addEventListener("click",()=>{
  isRegister=!isRegister;
  $("authTitle").textContent=isRegister?"Create your account":"Sign in to your account";
  $("authSubtitle").textContent=isRegister?"Register with your email and a password.":"Use your email and password to continue.";
  $("authSubmit").textContent=isRegister?"Create account":"Sign in";
  $("switchText").textContent=isRegister?"Already have an account?":"New here?";
  $("switchAuth").textContent=isRegister?"Sign in":"Create an account";
  showMessage("authMessage","");
});

$("authForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const email=$("email").value.trim().toLowerCase(),password=$("password").value;
  $("authSubmit").disabled=true;$("authSubmit").textContent="Please wait…";
  try{
    if(DEMO_MODE){
      if(isRegister){if(demoUsers[email])throw Error("An account with this email already exists.");demoUsers[email]=password;localStorage.setItem("ae_users",JSON.stringify(demoUsers));}
      else if(demoUsers[email]!==password)throw Error("Email or password is incorrect. Create an account first.");
      currentUser=email;await enterDashboard();
    }else{
      const {data,error}=isRegister
        ? await supabase.auth.signUp({email,password})
        : await supabase.auth.signInWithPassword({email,password});
      if(error)throw error;
      if(isRegister && !data.session){
        showMessage("authMessage","Account created! Check your email to confirm, then sign in.",true);
      }else if(data.user){currentUser=data.user;await enterDashboard();}
    }
  }catch(err){showMessage("authMessage",friendlyError(err));}
  finally{$("authSubmit").disabled=false;$("authSubmit").textContent=isRegister?"Create account":"Sign in";}
});

if(!DEMO_MODE){
  supabase.auth.onAuthStateChange(async(_event,session)=>{
    if(session?.user){currentUser=session.user;await enterDashboard();}
    else{currentUser=null;$("authView").classList.remove("hidden");$("dashboardView").classList.add("hidden");$("logoutBtn").classList.add("hidden");}
  });
}

$("logoutBtn").addEventListener("click",async()=>{
  if(DEMO_MODE){currentUser=null;$("authView").classList.remove("hidden");$("dashboardView").classList.add("hidden");$("logoutBtn").classList.add("hidden");}
  else{const {error}=await supabase.auth.signOut();if(error)alert(friendlyError(error));}
});

async function enterDashboard(){
  $("authView").classList.add("hidden");$("dashboardView").classList.remove("hidden");$("logoutBtn").classList.remove("hidden");
  await loadStudents();await loadAttendance($("attendanceDate").value||today);renderAll();await loadHistory();
}
async function loadStudents(){
  if(DEMO_MODE){students=userData().students;return;}
  const {data,error}=await supabase.from("students").select("id,name,roll").order("name");
  if(error)throw error;students=data||[];
}
async function addStudent(name,roll){
  if(DEMO_MODE){userData().students.push({id:crypto.randomUUID(),name,roll});persistDemo();}
  else{const {error}=await supabase.from("students").insert({user_id:currentUser.id,name,roll});if(error)throw error;}
  await loadStudents();renderAll();
}
$("addStudentForm").addEventListener("submit",async e=>{
  e.preventDefault();const name=$("studentName").value.trim(),roll=$("studentRoll").value.trim();
  if(!name||!roll)return;
  try{
    if(students.some(s=>s.roll.toLowerCase()===roll.toLowerCase())){alert("This roll number is already in your class list.");return;}
    await addStudent(name,roll);$("addStudentForm").reset();
  }catch(err){alert("Could not add student: "+friendlyError(err));}
});
async function removeStudent(id){
  if(!confirm("Delete this student? Their past attendance records will remain."))return;
  try{
    if(DEMO_MODE){userData().students=userData().students.filter(s=>s.id!==id);persistDemo();}
    else{const {error}=await supabase.from("students").delete().eq("id",id);if(error)throw error;}
    await loadStudents();renderAll();
  }catch(err){alert("Could not delete student: "+friendlyError(err));}
}
async function loadAttendance(date){
  if(DEMO_MODE){attendance=userData().records[date]||{};return;}
  const {data,error}=await supabase.from("attendance").select("statuses").eq("user_id",currentUser.id).eq("date",date).maybeSingle();
  if(error)throw error;attendance=data?.statuses||{};
}
function renderAll(){renderStudents();renderMarkList();renderStats();}
function renderStudents(){
  $("studentRows").innerHTML=students.map(s=>{
    const status=attendance[s.id]||"Not marked",cls=status==="Present"?"active-present":status==="Absent"?"active-absent":"";
    return `<tr><td class="student-name">${safeText(s.name)}</td><td>${safeText(s.roll)}</td><td><span class="${cls}">${status}</span></td><td><button class="delete-btn" data-delete="${s.id}">Delete</button></td></tr>`;
  }).join("");
  $("studentEmpty").classList.toggle("hidden",students.length>0);$("studentPill").textContent=students.length+" students";
  $("studentRows").querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>removeStudent(b.dataset.delete)));
}
function renderMarkList(){
  $("markList").innerHTML=students.map(s=>{
    const value=attendance[s.id]||"";
    return `<div class="mark-item"><div class="mark-person"><strong>${safeText(s.name)}</strong><span>Roll no. ${safeText(s.roll)}</span></div><div class="mark-actions"><button class="mark-choice ${value==="Present"?"active-present":""}" data-id="${s.id}" data-value="Present">Present</button><button class="mark-choice ${value==="Absent"?"active-absent":""}" data-id="${s.id}" data-value="Absent">Absent</button></div></div>`;
  }).join("");
  if(!students.length)$("markList").innerHTML='<p class="empty-state">Add students to start marking attendance.</p>';
  $("markList").querySelectorAll("[data-id]").forEach(b=>b.addEventListener("click",()=>{attendance[b.dataset.id]=b.dataset.value;renderMarkList();renderStudents();renderStats();}));
}
function renderStats(){
  const vals=Object.values(attendance),present=vals.filter(v=>v==="Present").length,absent=vals.filter(v=>v==="Absent").length,marked=present+absent;
  $("totalStudents").textContent=students.length;$("presentCount").textContent=present;$("absentCount").textContent=absent;$("attendanceRate").textContent=marked?Math.round(present/marked*100)+"%":"0%";
}
$("attendanceDate").addEventListener("change",async()=>{
  try{await loadAttendance($("attendanceDate").value);renderAll();showMessage("attendanceMessage","");}
  catch(err){showMessage("attendanceMessage","Could not load this date: "+friendlyError(err));}
});
$("saveAttendance").addEventListener("click",async()=>{
  const date=$("attendanceDate").value;
  if(!date){showMessage("attendanceMessage","Please select a date.");return;}
  if(!students.length){showMessage("attendanceMessage","Add students before saving attendance.");return;}
  const statuses={};students.forEach(s=>{if(attendance[s.id])statuses[s.id]=attendance[s.id];});
  try{
    if(DEMO_MODE){userData().records[date]=statuses;persistDemo();}
    else{const {error}=await supabase.from("attendance").upsert({user_id:currentUser.id,date,statuses,updated_at:new Date().toISOString()},{onConflict:"user_id,date"});if(error)throw error;}
    showMessage("attendanceMessage","Attendance saved successfully.",true);await loadHistory();
  }catch(err){showMessage("attendanceMessage","Could not save: "+friendlyError(err));}
});
async function getRecords(){
  if(DEMO_MODE)return Object.entries(userData().records).map(([date,statuses])=>({date,statuses}));
  const {data,error}=await supabase.from("attendance").select("date,statuses").order("date",{ascending:false});
  if(error)throw error;return data||[];
}
async function loadHistory(){
  try{
    const records=await getRecords();
    $("historyRows").innerHTML=records.map(r=>{
      const vals=Object.values(r.statuses||{}),p=vals.filter(v=>v==="Present").length,a=vals.filter(v=>v==="Absent").length,t=p+a,rate=t?Math.round(p/t*100):0;
      return `<tr><td>${dateText(r.date)}</td><td>${p}</td><td>${a}</td><td>${t}</td><td>${rate}%</td></tr>`;
    }).join("");
    $("historyEmpty").classList.toggle("hidden",records.length>0);
  }catch(err){showMessage("attendanceMessage","History could not load: "+friendlyError(err));}
}
$("refreshHistory").addEventListener("click",loadHistory);
