
const homeLink = document.getElementById("home");
const notesLink = document.getElementById("notes");
const favLink = document.getElementById("fav");
const homePage = document.querySelector(".welcome-box").parentElement;
const notesPage = document.createElement("div");
const noteEditor = document.querySelector(".note-editor");
const noteTitleInput = document.getElementById("note-title");
const noteContentInput = document.getElementById("note-content");
const saveBtn = document.getElementById("save-btn");
const cancelBtn = document.getElementById("cancel-btn");
const toast = document.getElementById("toast");

let notes = [];
let currentNoteIndex = -1;
function init() {
  notesPage.className = "notes-container";
  notesPage.style.display = "none";
  notesPage.innerHTML = `
          <h1>Your Notes</h1>
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" id="search-input" placeholder="Search notes...">
          </div>
          <div class="notes-list"></div>
        `;
  homePage.insertAdjacentElement("afterend", notesPage);

  loadNotes();
  setupEventListeners();
}
function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function loadNotes() {
  const savedNotes = localStorage.getItem("quick-notes");
  if (savedNotes) {
    notes = JSON.parse(savedNotes);
    renderNotesList();
  }
}
function saveNotes() {
  localStorage.setItem("quick-notes", JSON.stringify(notes));
  renderNotesList();
}

function renderNotesList(filterFn = null, emptyMessage = "No notes yet. Create your first note!") {
  const notesList = document.querySelector(".notes-list");
  notesList.innerHTML = "";

  const notesToDisplay = filterFn ? notes.filter(filterFn) : notes;

  if (notesToDisplay.length === 0) {
    notesList.innerHTML = `<p class="empty-message">${emptyMessage}</p>`;
    return;
  }

  notesToDisplay.forEach((note, index) => {
    const originalIndex = notes.findIndex(n => n.createdAt === note.createdAt);
    const noteElement = document.createElement("div");
    noteElement.className = "note-item";
    noteElement.innerHTML = `
            <h3>${note.title}</h3>
            <p>${note.content.substring(0, 100)}${note.content.length > 100 ? "..." : ""}</p>
            <div class="note-actions">
              <button class="btn-edit" data-index="${originalIndex}">
                <i class="fas fa-edit"></i>Edit
              </button>
              <button class="btn-delete" data-index="${originalIndex}">
                <i class="fas fa-trash"></i>Delete
              </button>
            </div>
            <button class="btn-fav ${note.favorite ? "active" : ""}" data-index="${originalIndex}">
              <i class="fa-solid fa-star"></i>
            </button>
          `;
    notesList.appendChild(noteElement);
  });
}

function setupEventListeners() {
  homeLink.addEventListener("click", (e) => {
    e.preventDefault();
    showHomePage();
  });

  notesLink.addEventListener("click", (e) => {
    e.preventDefault();
    showNotesPage();
  });

  favLink.addEventListener("click", (e) => {
    e.preventDefault();
    showFavoritesPage();
  });

  saveBtn.addEventListener("click", saveNote);
  cancelBtn.addEventListener("click", clearForm);

  document.addEventListener("input", (e) => {
    if (e.target.id === "search-input") {
      const searchTerm = e.target.value.toLowerCase();
      renderNotesList(
        note => note.title.toLowerCase().includes(searchTerm) ||
          note.content.toLowerCase().includes(searchTerm),
        "No notes match your search."
      );
    }
  });

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-edit") || e.target.closest(".btn-edit")) {
      const btn = e.target.classList.contains("btn-edit") ? e.target : e.target.closest(".btn-edit");
      const index = parseInt(btn.dataset.index);
      editNote(index);
    }

    if (e.target.classList.contains("btn-delete") || e.target.closest(".btn-delete")) {
      const btn = e.target.classList.contains("btn-delete") ? e.target : e.target.closest(".btn-delete");
      const index = parseInt(btn.dataset.index);
      deleteNote(index);
    }

    if (e.target.classList.contains("btn-fav") || e.target.closest(".btn-fav")) {
      const btn = e.target.classList.contains("btn-fav") ? e.target : e.target.closest(".btn-fav");
      const index = parseInt(btn.dataset.index);
      toggleFavorite(index);
    }
  });
}

function saveNote() {
  const title = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();

  if (title && content) {
    if (currentNoteIndex === -1) {
      notes.push({
        title,
        content,
        favorite: false,
        createdAt: new Date().toISOString(),
      });
      showToast("Note created successfully!");
    } else {
      notes[currentNoteIndex] = {
        ...notes[currentNoteIndex],
        title,
        content
      };
      showToast("Note updated successfully!");
    }

    saveNotes();
    clearForm();
    showNotesPage();
  } else {
    showToast("Please enter both title and content", "error");
  }
}

function clearForm() {
  noteTitleInput.value = "";
  noteContentInput.value = "";
  currentNoteIndex = -1;
}

function editNote(index) {
  const note = notes[index];
  noteTitleInput.value = note.title;
  noteContentInput.value = note.content;
  currentNoteIndex = index;
  showHomePage();

  noteEditor.scrollIntoView({ behavior: 'smooth' });
}

function deleteNote(index) {
  if (confirm("Are you sure you want to delete this note?")) {
    notes.splice(index, 1);
    saveNotes();
    showToast("Note deleted successfully!");
  }
}

function toggleFavorite(index) {
  notes[index].favorite = !notes[index].favorite;
  saveNotes();

  if (notes[index].favorite) {
    showToast("Note added to favorites!");
  } else {
    showToast("Note removed from favorites!");
  }

  if (document.getElementById("fav").classList.contains("active")) {
    showFavoritesPage();
  }
}

function showHomePage() {
  homePage.style.display = "block";
  notesPage.style.display = "none";
  noteEditor.style.display = "block";
  updateActiveNav("home");
}

function showNotesPage() {
  homePage.style.display = "none";
  notesPage.style.display = "block";
  noteEditor.style.display = "none";
  updateActiveNav("notes");
  renderNotesList();

  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";
}

function showFavoritesPage() {
  homePage.style.display = "none";
  notesPage.style.display = "block";
  noteEditor.style.display = "none";
  updateActiveNav("fav");
  renderNotesList(
    note => note.favorite,
    "No favorites yet. Mark notes as favorite to see them here."
  );

  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";
}

function updateActiveNav(activeId) {
  document.querySelectorAll(".nav_link").forEach((link) => {
    link.classList.remove("active");
  });
  document.getElementById(activeId).classList.add("active");
}

document.addEventListener("DOMContentLoaded", init);
