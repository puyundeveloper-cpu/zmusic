const admin = require('firebase-admin');

function initAdmin() {
  if (admin.apps.length) return admin;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured in Vercel.');
  let credential;
  try { credential = JSON.parse(raw); } catch { throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON.'); }
  admin.initializeApp({ credential: admin.credential.cert(credential), projectId: 'zmusic-98543' });
  return admin;
}
const clean = v => typeof v === 'string' ? v.slice(0,180) : '';
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'POST') return res.status(405).json({error:'Use POST.'});
  let fb;
  try { fb=initAdmin(); } catch(e) { return res.status(503).json({error:e.message,code:'firebase_admin_not_configured'}); }
  try {
    const authHeader=req.headers.authorization||'';
    if(!authHeader.startsWith('Bearer ')) return res.status(401).json({error:'Missing Firebase ID token.'});
    const decoded=await fb.auth().verifyIdToken(authHeader.slice(7));
    const uid=decoded.uid;
    const body=typeof req.body==='object'&&req.body?req.body:{};
    const action=clean(body.action); const deviceId=clean(body.deviceId); const deviceName=clean(body.deviceName)||'Web device';
    if(!deviceId||deviceId.length>180) return res.status(400).json({error:'Invalid device ID.'});
    const db=fb.firestore(); const col=db.collection('users').doc(uid).collection('devices'); const own=col.doc(deviceId);
    const snapshot=await col.get(); const docs=snapshot.docs; const ownSnap=await own.get();
    const approved=docs.filter(d=>d.data().status==='approved');
    const canApprove=ownSnap.exists&&ownSnap.data().status==='approved';
    if(action==='register') {
      if(ownSnap.exists){await own.set({deviceName,lastSeen:fb.firestore.FieldValue.serverTimestamp(),userAgent:clean(req.headers['user-agent'])},{merge:true});return res.json({status:ownSnap.data().status,devices:(await col.get()).docs.map(d=>({deviceId:d.id,...d.data(),lastSeen:d.data().lastSeen?.toDate?.()?.toISOString()||null})),canApprove});}
      if(approved.length===0){await own.set({deviceName,status:'approved',createdAt:fb.firestore.FieldValue.serverTimestamp(),lastSeen:fb.firestore.FieldValue.serverTimestamp(),userAgent:clean(req.headers['user-agent'])});return res.json({status:'approved',devices:(await col.get()).docs.map(d=>({deviceId:d.id,...d.data(),lastSeen:d.data().lastSeen?.toDate?.()?.toISOString()||null})),canApprove:true});}
      if(docs.length>=5)return res.status(409).json({status:'limit',error:'Had maksimum 5 rekod peranti telah dicapai. Buang peranti yang tidak digunakan dahulu.'});
      await own.set({deviceName,status:'pending',createdAt:fb.firestore.FieldValue.serverTimestamp(),lastSeen:fb.firestore.FieldValue.serverTimestamp(),userAgent:clean(req.headers['user-agent'])});
      return res.json({status:'pending',devices:(await col.get()).docs.map(d=>({deviceId:d.id,...d.data(),lastSeen:d.data().lastSeen?.toDate?.()?.toISOString()||null})),canApprove:false});
    }
    if(action==='list')return res.json({status:ownSnap.exists?ownSnap.data().status:'not-registered',canApprove,devices:docs.map(d=>({deviceId:d.id,...d.data(),lastSeen:d.data().lastSeen?.toDate?.()?.toISOString()||null}))});
    if(action==='approve') {
      if(!canApprove)return res.status(403).json({error:'Hanya peranti yang telah diluluskan boleh meluluskan peranti baharu.'});
      const target=clean(body.targetDeviceId);const targetRef=col.doc(target);const targetSnap=await targetRef.get();if(!targetSnap.exists)return res.status(404).json({error:'Peranti tidak dijumpai.'});
      if(targetSnap.data().status!=='approved'&&approved.length>=5)return res.status(409).json({error:'Had maksimum 5 peranti aktif telah dicapai. Buang satu dahulu.'});
      await targetRef.set({status:'approved',approvedAt:fb.firestore.FieldValue.serverTimestamp(),approvedBy:deviceId},{merge:true});
      return res.json({ok:true,devices:(await col.get()).docs.map(d=>({deviceId:d.id,...d.data(),lastSeen:d.data().lastSeen?.toDate?.()?.toISOString()||null})),canApprove:true});
    }
    if(action==='revoke') {
      if(!canApprove)return res.status(403).json({error:'Hanya peranti yang diluluskan boleh mengurus peranti.'});
      const target=clean(body.targetDeviceId);if(!target||target===deviceId)return res.status(400).json({error:'Tidak boleh membuang peranti yang sedang digunakan.'});
      await col.doc(target).delete();return res.json({ok:true,devices:(await col.get()).docs.map(d=>({deviceId:d.id,...d.data(),lastSeen:d.data().lastSeen?.toDate?.()?.toISOString()||null})),canApprove:true});
    }
    return res.status(400).json({error:'Unknown action.'});
  } catch(e) { console.error('[devices API]',e);return res.status(500).json({error:'Device request failed.'}); }
};
