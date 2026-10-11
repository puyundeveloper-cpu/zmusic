import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import { getMessaging, getToken, isSupported } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging.js';

const firebaseConfig = {
  apiKey: 'AIzaSyChd_BpNhfED79IML4B5dIksGpGlN_8N3o',
  authDomain: 'zmusic-98543.firebaseapp.com',
  projectId: 'zmusic-98543',
  storageBucket: 'zmusic-98543.firebasestorage.app',
  messagingSenderId: '330393149383',
  appId: '1:330393149383:web:fcf6a80e6c0a5b883943e2',
  measurementId: 'G-71W9VFS34P'
};
const VAPID_KEY = 'BEYE9oZW3gjO7HWgceEX29ts8vakBF07I1F4oR4Ufoz4T5djO-ju3VFQsKtDWSu0OcXvWQuI23DYEFFZht36xFw';
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

const $ = (s) => document.querySelector(s);
let currentUser = null;
let deviceStatus = 'signed-out';
let deviceData = [];
const deviceId = (() => {
  let id = localStorage.getItem('zmusic_device_id');
  if (!id) { id = crypto.randomUUID ? crypto.randomUUID() : 'd-' + Date.now() + '-' + Math.random().toString(36).slice(2); localStorage.setItem('zmusic_device_id', id); }
  return id;
})();

function addStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #zm-auth-trigger{position:fixed;z-index:80;right:14px;top:calc(env(safe-area-inset-top,0px) + 12px);height:42px;max-width:48vw;display:flex;align-items:center;gap:8px;padding:5px 12px 5px 6px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(24,25,32,.94);color:#f7f7f8;font:600 12px system-ui;box-shadow:0 6px 22px #0005;backdrop-filter:blur(14px);cursor:pointer}
    #zm-auth-trigger img{width:29px;height:29px;border-radius:50%;object-fit:cover;background:#363842}#zm-auth-trigger span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #zm-auth-overlay{position:fixed;inset:0;z-index:120;display:none;align-items:center;justify-content:center;padding:18px;background:#050507b8;backdrop-filter:blur(10px)}#zm-auth-overlay.open{display:flex}
    .zm-auth-panel{width:min(100%,420px);max-height:86dvh;overflow:auto;background:#1c1e25;border:1px solid #ffffff1c;border-radius:22px;padding:22px;color:#f7f7f8;box-shadow:0 24px 80px #0009;font:14px system-ui}
    .zm-auth-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}.zm-auth-head h2{font-size:20px;font-weight:800;margin:0}.zm-auth-sub{color:#a5a7b0;font-size:12px;line-height:1.55;margin:5px 0 18px}.zm-auth-btn{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:12px 14px;border:1px solid #ffffff20;border-radius:12px;background:#f3f3f3;color:#151515;font-weight:750;cursor:pointer}.zm-auth-btn.secondary{background:#292b34;color:#f7f7f8}.zm-auth-btn:disabled{opacity:.5;cursor:wait}.zm-auth-close{border:0;background:#ffffff10;color:#fff;border-radius:10px;width:34px;height:34px;font-size:20px;cursor:pointer}.zm-auth-profile{display:flex;gap:12px;align-items:center;margin-bottom:18px}.zm-auth-profile img{width:48px;height:48px;border-radius:50%;object-fit:cover;background:#333}.zm-auth-profile strong{display:block;overflow-wrap:anywhere}.zm-auth-profile small{display:block;color:#a5a7b0;margin-top:3px;overflow-wrap:anywhere}.zm-auth-status{border-radius:12px;padding:11px 12px;margin:12px 0;background:#ffffff0b;color:#c7c8cf;line-height:1.5;font-size:12px}.zm-auth-status.good{background:#173729;color:#b8f4d1}.zm-auth-status.wait{background:#3a3018;color:#f5df9e}.zm-device{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid #ffffff12}.zm-device:last-child{border-bottom:0}.zm-device small{display:block;color:#a5a7b0;margin-top:3px}.zm-device button{border:1px solid #ffffff20;border-radius:9px;background:#2b2d36;color:#fff;padding:7px 9px;font-size:11px;white-space:nowrap}.zm-auth-note{font-size:11px;color:#999da7;line-height:1.5;margin-top:14px}
  `;
  document.head.appendChild(style);
}
function ensureUI() {
  if ($('#zm-auth-trigger')) return;
  addStyles();
  const trigger = document.createElement('button'); trigger.id = 'zm-auth-trigger'; trigger.type = 'button'; trigger.innerHTML = '<img alt="" src="/logo.png"><span>Sign in</span>'; trigger.addEventListener('click', openModal); document.body.appendChild(trigger);
  const overlay = document.createElement('div'); overlay.id = 'zm-auth-overlay'; overlay.innerHTML = `<section class="zm-auth-panel" role="dialog" aria-modal="true" aria-labelledby="zm-auth-title"><div class="zm-auth-head"><h2 id="zm-auth-title">ZMusic account</h2><button class="zm-auth-close" id="zm-auth-close" aria-label="Close">×</button></div><div id="zm-auth-content"><p class="zm-auth-sub">Sign in untuk menyimpan profil dan mengurus peranti ZMusic.</p><button class="zm-auth-btn" id="zm-google-login"><span style="font-size:18px;font-weight:900">G</span> Continue with Google</button><p class="zm-auth-note">Sesi login akan kekal pada peranti ini sehingga kau sign out.</p></div></section>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); }); document.body.appendChild(overlay); $('#zm-auth-close').addEventListener('click', closeModal); $('#zm-google-login').addEventListener('click', login);
}
function openModal(){ $('#zm-auth-overlay')?.classList.add('open'); renderAccount(); }
function closeModal(){ $('#zm-auth-overlay')?.classList.remove('open'); }
function setTrigger(user){const b=$('#zm-auth-trigger');if(!b)return;if(user){const photo=user.photoURL||'/logo.png';b.innerHTML=`<img alt="" src="${escapeAttr(photo)}"><span>${escapeHtml(user.displayName||user.email||'Account')}</span>`;}else b.innerHTML='<img alt="" src="/logo.png"><span>Sign in</span>';}
function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function escapeAttr(s=''){return escapeHtml(s);}
function statusMarkup(){if(deviceStatus==='approved')return '<div class="zm-auth-status good">Peranti ini diluluskan dan boleh menggunakan akaun.</div>';if(deviceStatus==='pending')return '<div class="zm-auth-status wait">Peranti ini menunggu kelulusan daripada peranti ZMusic yang telah diluluskan.</div>';if(deviceStatus==='limit')return '<div class="zm-auth-status wait">Had maksimum 5 peranti telah dicapai. Buang satu peranti dahulu.</div>';if(deviceStatus==='setup')return '<div class="zm-auth-status wait">Login berjaya, tetapi pengurusan peranti memerlukan konfigurasi server Firebase Admin di Vercel. Rujuk README.</div>';return '';}
async function renderAccount(){
 const c=$('#zm-auth-content');if(!c)return;
 if(!currentUser){c.innerHTML=`<p class="zm-auth-sub">Sign in untuk menyimpan profil dan mengurus peranti ZMusic.</p><button class="zm-auth-btn" id="zm-google-login"><span style="font-size:18px;font-weight:900">G</span> Continue with Google</button><p class="zm-auth-note">Login Google menggunakan Firebase Authentication. Tiada kata laluan disimpan oleh ZMusic.</p>`;$('#zm-google-login').onclick=login;return;}
 c.innerHTML=`<div class="zm-auth-profile"><img src="${escapeAttr(currentUser.photoURL||'/logo.png')}" alt=""><div><strong>${escapeHtml(currentUser.displayName||'ZMusic user')}</strong><small>${escapeHtml(currentUser.email||'')}</small></div></div>${statusMarkup()}<div style="display:flex;align-items:center;justify-content:space-between;margin:18px 0 8px"><strong>Peranti akaun</strong><button class="zm-auth-btn secondary" id="zm-refresh-devices" style="width:auto;padding:7px 10px;font-size:11px">Refresh</button></div><div id="zm-device-list"><div class="zm-auth-status">Memuatkan peranti…</div></div><button class="zm-auth-btn secondary" id="zm-enable-push" style="margin-top:14px">Aktifkan push notification</button><button class="zm-auth-btn secondary" id="zm-signout" style="margin-top:8px">Sign out</button><p class="zm-auth-note">Had 5 peranti dikuatkuasakan oleh Vercel API apabila FIREBASE_SERVICE_ACCOUNT_JSON telah dikonfigurasi.</p>`;
 $('#zm-refresh-devices').onclick=registerDevice;$('#zm-enable-push').onclick=enablePush;$('#zm-signout').onclick=async()=>{await signOut(auth);closeModal();};await renderDevices();
}
async function login(){const b=$('#zm-google-login');if(b){b.disabled=true;b.textContent='Connecting…';}try{await signInWithPopup(auth,provider);}catch(e){if(['auth/popup-blocked','auth/cancelled-popup-request','auth/popup-closed-by-user'].includes(e.code)){try{await signInWithRedirect(auth,provider);}catch(err){alert(authMessage(err));}}else alert(authMessage(e));}finally{if(b){b.disabled=false;b.innerHTML='<span style="font-size:18px;font-weight:900">G</span> Continue with Google';}}}
function authMessage(e){if(e?.code==='auth/unauthorized-domain')return 'Domain belum dibenarkan. Tambah domain deploy Vercel dalam Firebase Authentication → Settings → Authorized domains.';return e?.message||'Login gagal. Cuba lagi.';}
async function apiDevice(action,extra={}){if(!currentUser)throw new Error('Sila login dahulu.');const token=await currentUser.getIdToken();const r=await fetch('/api/devices',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({action,deviceId,...extra,deviceName:deviceLabel()})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'Device API belum dikonfigurasi.');return data;}
function deviceLabel(){const ua=navigator.userAgent||'';if(/Android/i.test(ua))return 'Android device';if(/iPhone|iPad/i.test(ua))return 'Apple device';if(/Windows/i.test(ua))return 'Windows browser';if(/Mac/i.test(ua))return 'Mac browser';return 'Web browser';}
async function registerDevice(){if(!currentUser)return;try{const d=await apiDevice('register');deviceStatus=d.status||'pending';deviceData=d.devices||[];await renderAccount();}catch(e){deviceStatus='setup';const list=$('#zm-device-list');if(list)list.innerHTML=`<div class="zm-auth-status wait">${escapeHtml(e.message)}</div>`;}}
async function renderDevices(){const list=$('#zm-device-list');if(!list)return;try{const d=await apiDevice('list');deviceStatus=d.status||deviceStatus;deviceData=d.devices||[];list.innerHTML=deviceData.length?deviceData.map(x=>`<div class="zm-device"><div><strong>${escapeHtml(x.deviceName||'Web device')}${x.deviceId===deviceId?' · This device':''}</strong><small>${escapeHtml(x.status||'unknown')} · ${x.lastSeen?new Date(x.lastSeen).toLocaleDateString():''}</small></div>${x.status==='pending'&&d.canApprove?`<button data-approve="${escapeAttr(x.deviceId)}">Approve</button>`:''}${x.deviceId!==deviceId&&d.canApprove?`<button data-revoke="${escapeAttr(x.deviceId)}">Remove</button>`:''}</div>`).join(''):'<div class="zm-auth-status">Belum ada rekod peranti.</div>';list.querySelectorAll('[data-approve]').forEach(b=>b.onclick=async()=>{try{await apiDevice('approve',{targetDeviceId:b.dataset.approve});await renderAccount();}catch(e){alert(e.message);}});list.querySelectorAll('[data-revoke]').forEach(b=>b.onclick=async()=>{if(!confirm('Buang akses peranti ini?'))return;try{await apiDevice('revoke',{targetDeviceId:b.dataset.revoke});await renderAccount();}catch(e){alert(e.message);}});if(deviceStatus==='pending'||deviceStatus==='limit'){$('#zm-enable-push')?.setAttribute('disabled','disabled');}}catch(e){list.innerHTML=`<div class="zm-auth-status wait">${escapeHtml(e.message)}<br>Pastikan FIREBASE_SERVICE_ACCOUNT_JSON sudah ditambah di Vercel.</div>`;}}
async function enablePush(){if(!currentUser)return;if(!('Notification'in window)||!('serviceWorker'in navigator)){alert('Browser ini tidak menyokong web push.');return;}try{const permission=await Notification.requestPermission();if(permission!=='granted'){alert('Kebenaran notifikasi tidak diberikan.');return;}const supported=await isSupported();if(!supported)throw new Error('Firebase Messaging tidak disokong oleh browser ini.');const reg=await navigator.serviceWorker.register('/sw.js');const messaging=getMessaging(app);const token=await getToken(messaging,{vapidKey:VAPID_KEY,serviceWorkerRegistration:reg});if(!token)throw new Error('FCM token tidak berjaya dijana.');const ref=doc(db,'users',currentUser.uid);await setDoc(ref,{pushToken:token,pushUpdatedAt:serverTimestamp(),email:currentUser.email||null,displayName:currentUser.displayName||null,photoURL:currentUser.photoURL||null},{merge:true});alert('Push notification berjaya diaktifkan pada peranti ini. Untuk menghantar notifikasi, backend perlu menggunakan Firebase Admin SDK.');}catch(e){alert('Push notification belum berjaya: '+(e.message||e));}}
const libraryKeys = { likedSongs: 'nanzz_liked_songs', likedArtists: 'nanzz_liked_artists', playlists: 'nanzz_playlists' };
function localLibrary(){const out={};for(const [field,key] of Object.entries(libraryKeys)){try{out[field]=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(out[field]))out[field]=[];}catch{out[field]=[];}}return out;}
function mergeById(local,cloud,field){const idOf=x=>x?.videoId||x?.id||x?.artistId||x?.playlistId||'';const map=new Map();for(const x of [...(Array.isArray(cloud)?cloud:[]),...(Array.isArray(local)?local:[])]){const id=idOf(x);if(id)map.set(id,{...(map.get(id)||{}),...x});}return [...map.values()];}
let librarySyncTimer;
async function syncLibrary(user,preferCloud=false){if(!user)return;const ref=doc(db,'users',user.uid,'private','library');const snap=await getDoc(ref);const local=localLibrary();let merged=local;if(snap.exists()){const cloud=snap.data();merged={};for(const field of Object.keys(libraryKeys)){merged[field]=preferCloud&&Array.isArray(cloud[field])?cloud[field]:mergeById(local[field],cloud[field],field);localStorage.setItem(libraryKeys[field],JSON.stringify(merged[field]));}}await setDoc(ref,{...merged,updatedAt:serverTimestamp()},{merge:true});}
function scheduleLibrarySync(){if(!currentUser)return;clearTimeout(librarySyncTimer);librarySyncTimer=setTimeout(()=>syncLibrary(currentUser).catch(e=>console.warn('[ZMusic] Library cloud sync:',e.message)),900);}
window.addEventListener('zmusic:library-changed',scheduleLibrarySync);
window.addEventListener('storage',e=>{if(Object.values(libraryKeys).includes(e.key))scheduleLibrarySync();});
async function syncUser(user){const ref=doc(db,'users',user.uid);const snap=await getDoc(ref);const payload={uid:user.uid,email:user.email||null,displayName:user.displayName||null,photoURL:user.photoURL||null,lastLoginAt:serverTimestamp(),provider:'google.com'};if(!snap.exists())payload.createdAt=serverTimestamp();await setDoc(ref,payload,{merge:true});await syncLibrary(user,true);}
onAuthStateChanged(auth,async user=>{currentUser=user;setTrigger(user);if(user){try{await syncUser(user);}catch(e){console.warn('[ZMusic Firebase] Firestore profile sync failed:',e.message);}registerDevice();}else{deviceStatus='signed-out';deviceData=[];}if($('#zm-auth-overlay')?.classList.contains('open'))renderAccount();});
getRedirectResult(auth).catch(e=>console.warn('[ZMusic Firebase] Redirect sign-in:',e.message));
ensureUI();
window.ZMusicFirebase={get user(){return currentUser;},openAccount:openModal,signOut:()=>signOut(auth),enablePush,deviceId};
