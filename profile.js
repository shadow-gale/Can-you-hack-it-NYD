// profile.js — simple signup storing to localStorage LU_USERS
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signupForm');

  function loadUsers(){
    try{
      const raw = localStorage.getItem('LU_USERS');
      return raw ? JSON.parse(raw) : [];
    }catch(e){
      console.warn('LU_USERS parse failed', e);
      return [];
    }
  }

  function saveUsers(arr){
    try{
      localStorage.setItem('LU_USERS', JSON.stringify(arr));
    }catch(e){
      console.error('Failed to save LU_USERS', e);
    }
  }

  function makeId(){
    return 'u-'+Date.now()+'-'+Math.floor(Math.random()*9999);
  }

  // prefill if LU_LOGGED_IN_USER exists
  try{
    const raw = localStorage.getItem('LU_LOGGED_IN_USER');
    if(raw){
      const u = JSON.parse(raw);
      if(u){
        document.getElementById('fullname').value = u.name || '';
        document.getElementById('email').value = u.email || '';
        document.getElementById('role').value = u.role || '';
        document.getElementById('experience').value = u.experience || 0;
        document.getElementById('skills').value = (u.skills && Array.isArray(u.skills)) ? u.skills.join(', ') : (u.skills||'');
        document.getElementById('bio').value = u.bio || '';
      }
    }
  }catch(e){ /* ignore */ }

  form.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    const name = (document.getElementById('fullname').value||'').trim();
    const email = (document.getElementById('email').value||'').trim();
    const role = (document.getElementById('role').value||'').trim() || 'Member';
    const experience = parseInt(document.getElementById('experience').value||'0',10) || 0;
    const skillsRaw = (document.getElementById('skills').value||'').trim();
    const skills = skillsRaw ? skillsRaw.split(',').map(s=>s.trim()).filter(Boolean) : [];
    const bio = (document.getElementById('bio').value||'').trim();

    if(!name || !email){
      alert('Please provide name and email');
      return;
    }

    const users = loadUsers();
    const dup = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if(dup){
      if(!confirm('A user with this email already exists. Create another entry?')) return;
    }

    const user = {
      id: makeId(),
      name,
      email,
      role,
      experience,
      skills,
      bio,
      createdAt: new Date().toISOString()
    };

    users.push(user);
    saveUsers(users);

    try{ localStorage.setItem('LU_LOGGED_IN_USER', JSON.stringify(user)); }catch(e){}

    alert('Signup saved locally ✅\nRedirecting to Hackathons page...');
    window.location.href = 'hackathons.html';
  });
});
