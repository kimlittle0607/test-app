async function loadNotes() {
  const res = await fetch('/notes');
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
      await fetch(`/notes/${n.id}`, { method: 'DELETE' });
      loadNotes();
    };

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.onclick = async () => {
      const newText = prompt('Edit note:', n.text);
      if (newText == null) return; // cancelled

      await fetch(`/notes/${n.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText })
      });

      loadNotes();
    };

    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(button);
    list.appendChild(li);
  });
}

async function addNote() {
  const input = document.getElementById('noteInput');

  await fetch('/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: input.value })
  });

  input.value = '';
  loadNotes();
}

loadNotes();