// firebase.js — Firebase init + helpers (load this as <script type="module" src="firebase.js"></script>)
// Exposes on window:
//  - window.fetchUsersFromFirebase(limit)
//  - window.saveProfile(profile, userId)

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  limit as qlimit,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// ----- REPLACE with your Firebase config -----
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
// --------------------------------------------

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// expose db for debugging (optional)
window._LU_DB = db;

/**
 * Fetch users from Firestore `users` collection.
 * Expects documents with fields: name, role, experience, skills (array or comma string)
 * Returns array [{id, name, role, experience, skills: []}, ...]
 */
window.fetchUsersFromFirebase = async function(limitCount = 1000){
  try{
    const colRef = collection(db, 'users');
    // optional: order by name and apply limit if provided
    const q = (limitCount && limitCount > 0) ? query(colRef, orderBy('name'), qlimit(limitCount)) : colRef;
    const snap = await getDocs(q);
    const users = [];
    snap.forEach(docSnap => {
      const d = docSnap.data() || {};
      let skills = [];
      if(Array.isArray(d.skills)) skills = d.skills.map(s=>String(s).trim()).filter(Boolean);
      else if(typeof d.skills === 'string') skills = d.skills.split(',').map(s=>s.trim()).filter(Boolean);
      // normalize experience
      const exp = typeof d.experience === 'number' ? d.experience : (parseInt(d.experience,10) || 0);
      users.push({
        id: docSnap.id,
        name: d.name || `User_${docSnap.id}`,
        role: d.role || 'Member',
        experience: exp,
        skills
      });
    });
    return users;
  }catch(err){
    console.error('fetchUsersFromFirebase error:', err);
    throw err;
  }
};

/**
 * Save a profile (upsert) into Firestore `profiles` collection.
 * profile: object, userId: string
 */
window.saveProfile = async function(profile, userId = 'demoUser'){
  try{
    const ref = doc(db, 'profiles', String(userId));
    await setDoc(ref, profile, { merge: true });
    console.log('Profile saved:', profile);
    return true;
  }catch(err){
    console.error('saveProfile error:', err);
    throw err;
  }
};
