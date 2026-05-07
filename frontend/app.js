const API = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://test-app-boiw.onrender.com';

let token = localStorage.getItem('token');

async function login(event) {
  if (event) event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Login failed');
      return;
    }

    token = data.token;
    localStorage.setItem('token', token);
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('appSection').style.display = 'block';
    loadNotes();
  } catch (err) {
    alert('Network error during login');
  }
}

async function register(event) {
  if (event) event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Registration failed');
      return;
    }

    // auto-login after register
    const loginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const loginData = await loginRes.json();

    if (!loginRes.ok) {
      alert(loginData.error || 'Auto-login failed');
      return;
    }

    token = loginData.token;
    localStorage.setItem('token', token);
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('appSection').style.display = 'block';
    loadNotes();
  } catch (err) {
    alert('Network error during registration');
  }
}

function logout() {
  localStorage.removeItem('token');
  token = null;

  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('appSection').style.display = 'none';
}

async function loadNotes() {
  try {
    const res = await fetch(`${API}/notes`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) {
      logout();
      alert('Session expired. Please log in again.');
      return;
    }

    const notes = await res.json();

    const list = document.getElementById('notesList');
    list.innerHTML = '';

    notes.forEach(n => {
      const li = document.createElement('li');

      const span = document.createElement('span');
      span.textContent = n.text;

      const button = document.createElement('button');
      button.textContent = 'Delete';
      button.onclick = async () => {
        await fetch(`${API}/notes/${n.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        loadNotes();
      };

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.onclick = async () => {
        const newText = prompt('Edit note:', n.text);
        if (newText == null) return;

        await fetch(`${API}/notes/${n.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ text: newText })
        });

        loadNotes();
      };

      li.appendChild(span);
      li.appendChild(editBtn);
      li.appendChild(button);
      list.appendChild(li);
    });
  } catch (err) {
    alert('Failed to load notes');
  }
}

async function addNote() {
  const input = document.getElementById('noteInput');

  await fetch(`${API}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ text: input.value })
  });

  input.value = '';
  loadNotes();
}

window.onload = () => {
  const loginSection = document.getElementById('loginSection');
  const appSection = document.getElementById('appSection');

  if (!token) {
    loginSection.style.display = 'block';
    appSection.style.display = 'none';
  } else {
    loginSection.style.display = 'none';
    appSection.style.display = 'block';
    loadNotes();
  }
};