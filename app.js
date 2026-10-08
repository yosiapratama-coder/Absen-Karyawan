/* SISTEM ABSENSI KARYAWAN - MODE DEMO
   Tidak membutuhkan Firebase.
   Data tersimpan otomatis di localStorage browser.
*/
const $ = id => document.getElementById(id);
const today = () => new Date().toISOString().slice(0,10);
const timeNow = () => new Intl.DateTimeFormat("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(new Date());
const dateTimeNow = () => new Date().toISOString();
const esc = v => String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));

const defaultData = {
  users:[
    {uid:"hrd-demo",name:"Admin HRD",email:"hrd@demo.com",password:"hrd12345",position:"HRD",role:"hrd"},
    {uid:"emp-demo",name:"Budi Santoso",email:"karyawan@demo.com",password:"karyawan123",position:"Staff",role:"employee"},
    {uid:"emp-demo-2",name:"Siti Aulia",email:"sitiaulia@demo.com",password:"karyawan123",position:"Staff",role:"employee"}
  ],
  attendance:[],
  leaves:[]
};
let data=JSON.parse(localStorage.getItem("absensi_demo_data")||"null")||defaultData;
let currentProfile=null;

function save(){localStorage.setItem("absensi_demo_data",JSON.stringify(data))}
function show(id){$(id).classList.remove("hidden")}
function hide(id){$(id).classList.add("hidden")}

$("loginForm").addEventListener("submit",e=>{
  e.preventDefault();
  const email=$("loginEmail").value.trim().toLowerCase();
  const password=$("loginPassword").value;
  const user=data.users.find(u=>u.email.toLowerCase()===email&&u.password===password);
  if(!user){$("loginError").textContent="Email atau password salah.";return}
  currentProfile={...user};
  $("loginError").textContent="";
  hide("loginPage");show("dashboardPage");
  $("currentUser").textContent=user.name;
  $("userRoleBadge").textContent=user.role==="hrd"?"HRD":"Karyawan";
  if(user.role==="hrd"){hide("employeeView");show("hrView");loadHRD()}
  else{hide("hrView");show("employeeView");loadEmployee()}
});
$("logoutBtn").addEventListener("click",()=>{
  currentProfile=null;hide("dashboardPage");show("loginPage");$("loginForm").reset()
});
$("printBtn").addEventListener("click",()=>window.print());
$("addEmployeeBtn").addEventListener("click",()=>show("employeeModal"));
$("closeModal").addEventListener("click",()=>hide("employeeModal"));
$("reportDate").value=today();
$("leaveDate").value=today();

setInterval(()=>{
  const clock=new Date().toLocaleString("id-ID",{dateStyle:"full",timeStyle:"medium"});
  if($("liveClock"))$("liveClock").textContent=clock;
  if($("hrClock"))$("hrClock").textContent=clock;
},1000);

function loadEmployee(){
  $("employeeName").textContent=currentProfile.name;
  const rows=data.attendance.filter(x=>x.uid===currentProfile.uid).sort((a,b)=>b.date.localeCompare(a.date));
  const rec=rows.find(x=>x.date===today());
  $("todayIn").textContent=rec?.checkIn||"-";
  $("todayOut").textContent=rec?.checkOut||"-";
  $("todayStatus").textContent=rec?.checkOut?"Selesai bekerja":rec?.checkIn?"Sedang bekerja":"Belum absen";
  $("checkInBtn").disabled=!!rec?.checkIn;
  $("checkOutBtn").disabled=!rec?.checkIn||!!rec?.checkOut;
  $("myAttendanceBody").innerHTML=rows.map(r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.checkIn||"-")}</td><td>${esc(r.checkOut||"-")}</td><td>${esc(r.status||"Hadir")}</td></tr>`).join("")||`<tr><td colspan="4">Belum ada data.</td></tr>`;
  const leaves=data.leaves.filter(x=>x.uid===currentProfile.uid).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  $("myLeaveBody").innerHTML=leaves.map(r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.type)}</td><td>${esc(r.reason)}</td><td>${esc(r.status)}</td></tr>`).join("")||`<tr><td colspan="4">Belum ada pengajuan.</td></tr>`;
}
$("checkInBtn").addEventListener("click",()=>{
  const id=`${currentProfile.uid}_${today()}`;
  if(data.attendance.some(x=>x.id===id))return;
  data.attendance.push({id,uid:currentProfile.uid,name:currentProfile.name,email:currentProfile.email,date:today(),checkIn:timeNow(),checkOut:"",status:"Hadir",updatedAt:dateTimeNow()});
  save();$("attendanceMessage").textContent="✓ Absensi masuk berhasil disimpan otomatis.";loadEmployee();
});
$("checkOutBtn").addEventListener("click",()=>{
  const r=data.attendance.find(x=>x.id===`${currentProfile.uid}_${today()}`);
  if(!r)return;
  r.checkOut=timeNow();r.updatedAt=dateTimeNow();save();
  $("attendanceMessage").textContent="✓ Absensi pulang berhasil disimpan otomatis.";loadEmployee();
});
$("leaveForm").addEventListener("submit",e=>{
  e.preventDefault();
  data.leaves.push({id:"leave-"+Date.now(),uid:currentProfile.uid,name:currentProfile.name,email:currentProfile.email,type:$("leaveType").value,date:$("leaveDate").value,reason:$("leaveReason").value,status:"Menunggu",createdAt:dateTimeNow()});
  save();e.target.reset();$("leaveDate").value=today();alert("Pengajuan berhasil disimpan.");loadEmployee();
});
$("exportMyBtn").addEventListener("click",()=>downloadCSV("riwayat-absensi.csv",data.attendance.filter(x=>x.uid===currentProfile.uid)));

function loadHRD(){
  renderEmployees();renderAllAttendance();renderAllLeaves();updateStats();
}
function renderEmployees(){
  $("employeeBody").innerHTML=data.users.map(e=>`<tr><td>${esc(e.name)}</td><td>${esc(e.email)}</td><td>${esc(e.position)}</td><td>${esc(e.role)}</td></tr>`).join("");
}
function renderAllAttendance(){
  const date=$("reportDate").value,term=$("searchEmployee").value.toLowerCase();
  const rows=data.attendance.filter(r=>(!date||r.date===date)&&(`${r.name} ${r.email}`.toLowerCase().includes(term)));
  $("allAttendanceBody").innerHTML=rows.map(r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.name)}</td><td>${esc(r.email)}</td><td>${esc(r.checkIn||"-")}</td><td>${esc(r.checkOut||"-")}</td><td>${esc(r.status)}</td></tr>`).join("")||`<tr><td colspan="6">Tidak ada data.</td></tr>`;
}
function renderAllLeaves(){
  $("allLeaveBody").innerHTML=data.leaves.map(r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.name)}</td><td>${esc(r.type)}</td><td>${esc(r.reason)}</td><td>${esc(r.status)}</td><td>${r.status==="Menunggu"?`<button class="btn success" onclick="approveLeave('${r.id}')">Setujui</button> <button class="btn danger" onclick="rejectLeave('${r.id}')">Tolak</button>`:"-"}</td></tr>`).join("")||`<tr><td colspan="6">Belum ada pengajuan.</td></tr>`;
}
function updateStats(){
  const t=today(),emps=data.users.filter(e=>e.role==="employee");
  const present=new Set(data.attendance.filter(a=>a.date===t&&a.checkIn).map(a=>a.uid)).size;
  const leave=new Set(data.leaves.filter(a=>a.date===t&&a.status==="Disetujui").map(a=>a.uid)).size;
  $("statEmployees").textContent=emps.length;
  $("statPresent").textContent=present;
  $("statAbsent").textContent=Math.max(0,emps.length-present-leave);
  $("statLeave").textContent=leave;
}
$("reportDate").addEventListener("change",renderAllAttendance);
$("searchEmployee").addEventListener("input",renderAllAttendance);
$("exportAllBtn").addEventListener("click",()=>downloadCSV("laporan-absensi.csv",data.attendance));

window.approveLeave=id=>{
  const r=data.leaves.find(x=>x.id===id);if(!r)return;
  r.status="Disetujui";r.reviewedAt=dateTimeNow();save();loadHRD();
};
window.rejectLeave=id=>{
  const r=data.leaves.find(x=>x.id===id);if(!r)return;
  r.status="Ditolak";r.reviewedAt=dateTimeNow();save();loadHRD();
};

$("employeeForm").addEventListener("submit",e=>{
  e.preventDefault();
  const uid=$("newUid").value.trim()||"emp-"+Date.now();
  if(data.users.some(u=>u.uid===uid)){alert("UID sudah digunakan.");return}
  data.users.push({uid,name:$("newName").value.trim(),email:$("newEmail").value.trim(),password:"karyawan123",position:$("newPosition").value.trim(),role:$("newRole").value});
  save();hide("employeeModal");e.target.reset();loadHRD();
  alert("Karyawan ditambahkan. Password demo: karyawan123");
});

function downloadCSV(filename,rows){
  const cols=["date","name","email","checkIn","checkOut","status"];
  const body=rows.map(r=>cols.map(c=>`"${String(r[c]??"").replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob(["\ufeff"+cols.join(",")+"\n"+body],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();
}

/* Reset demo jika ingin kembali ke data awal:
   localStorage.removeItem("absensi_demo_data"); lalu refresh.
*/
