import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// --- CONSTANTS ---
const GROUP_COLORS = ["#B38BFA", "#FF79F2", "#43E6FC", "#F19576", "#0047FF", "#6691FF"];

// --- HELPER FUNCTIONS ---

const getInitials = (name) => {
  if (!name) return "";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
};

const formatDate = (dateObj) => {
  return dateObj.toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
};

const formatTime = (dateObj) => {
  return dateObj.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
};

function App() {
  // --- 1. STATE WITH LAZY LOADING (Fixes storage issue) ---
  
  // We load the data INSIDE useState. This happens instantly.
  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem("pocketGroups");
    return saved ? JSON.parse(saved) : [];
  });

  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem("pocketNotes");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedGroupId, setSelectedGroupId] = useState(null);
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Form State
  const [groupName, setGroupName] = useState("");
  const [selectedColor, setSelectedColor] = useState(GROUP_COLORS[0]);
  const [noteText, setNoteText] = useState("");

  const modalRef = useRef(null);
  const notesEndRef = useRef(null);

  // --- 2. SAVE TO STORAGE AUTOMATICALLY ---

  // Whenever 'groups' changes, save it to storage
  useEffect(() => {
    localStorage.setItem("pocketGroups", JSON.stringify(groups));
  }, [groups]);

  // Whenever 'notes' changes, save it to storage
  useEffect(() => {
    localStorage.setItem("pocketNotes", JSON.stringify(notes));
  }, [notes]);

  // --- 3. OTHER EFFECTS ---

  // Handle Mobile Resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close Modal on Click Outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsModalOpen(false);
        setGroupName("");
      }
    };
    if (isModalOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isModalOpen]);

  // --- HANDLERS ---

  const handleCreateGroup = () => {
    if (!groupName.trim()) return;
    
    // Check Duplicate
    if (groups.some(g => g.name.toLowerCase() === groupName.trim().toLowerCase())) {
        alert("Group name already exists!");
        return;
    }

    const newGroup = {
      id: Date.now().toString(),
      name: groupName.trim(),
      color: selectedColor,
      initials: getInitials(groupName),
    };
    
    setGroups([...groups, newGroup]);
    setIsModalOpen(false);
    setGroupName("");
    setSelectedColor(GROUP_COLORS[0]);
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;

    const dateObj = new Date();
    const newNote = {
      id: Date.now().toString(),
      groupId: selectedGroupId,
      content: noteText,
      date: formatDate(dateObj),
      time: formatTime(dateObj),
    };

    setNotes([...notes, newNote]);
    setNoteText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  const currentGroup = groups.find((g) => g.id === selectedGroupId);
  const currentNotes = notes.filter((n) => n.groupId === selectedGroupId);

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <div className="sidebar" style={{ display: isMobile && selectedGroupId ? 'none' : 'flex' }}>
        <h1 className="app-title">Pocket Notes</h1>
        <div className="group-list">
          {groups.map((group) => (
            <div
              key={group.id}
              className={`group-item ${selectedGroupId === group.id ? "active" : ""}`}
              onClick={() => setSelectedGroupId(group.id)}
            >
              <div className="group-icon" style={{ backgroundColor: group.color }}>
                {group.initials}
              </div>
              <span className="group-name-text">{group.name}</span>
            </div>
          ))}
        </div>
        <button className="add-btn" onClick={() => setIsModalOpen(true)}>+</button>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content" style={{ display: isMobile && !selectedGroupId ? 'none' : 'flex' }}>
        {selectedGroupId ? (
          // === NOTES VIEW ===
          <div className="notes-view">
            <header className="notes-header">
              {isMobile && <button className="back-btn" onClick={() => setSelectedGroupId(null)}>←</button>}
              <div className="group-icon" style={{ backgroundColor: currentGroup?.color }}>
                {currentGroup?.initials}
              </div>
              <span className="header-title">{currentGroup?.name}</span>
            </header>

            <div className="notes-list">
              {currentNotes.map((note) => (
                <div key={note.id} className="note-card">
                  <p>{note.content}</p>
                  <div className="note-meta">{note.date} • {note.time}</div>
                </div>
              ))}
              <div ref={notesEndRef} />
            </div>

            <div className="input-area">
              <div className="input-wrapper">
                <textarea
                  placeholder="Enter your text here..........."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={handleKeyDown}
                ></textarea>
                <button className="send-btn" disabled={!noteText.trim()} onClick={handleAddNote}>
                  <svg width="25" height="20" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 29V18.125L14.5 14.5L0 10.875V0L29 14.5L0 29Z" fill={noteText.trim() ? "#001F8B" : "#ABABAB"}/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          // === EMPTY STATE (Image Updated Here) ===
          <div className="empty-state">
            <img 
              src="https://pocket-notes-deploy-vercel.vercel.app/static/media/img1.d8c7b9bc0a963cbce718.png" 
              alt="Pocket Notes" 
              className="empty-image"
            />
            <h1>Pocket Notes</h1>
            <p>Send and receive messages without keeping your phone online.<br />Use Pocket Notes on up to 4 linked devices and 1 mobile phone.</p>
            <div className="encrypted-msg"><span>🔒</span> end-to-end encrypted</div>
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" ref={modalRef}>
            <h3>Create New group</h3>
            <div className="form-row">
              <label>Group Name</label>
              <input type="text" placeholder="Enter group name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            </div>
            <div className="form-row">
              <label>Choose colour</label>
              <div className="color-picker">
                {GROUP_COLORS.map((color) => (
                  <div key={color} className={`color-circle ${selectedColor === color ? "selected" : ""}`} style={{ backgroundColor: color }} onClick={() => setSelectedColor(color)} />
                ))}
              </div>
            </div>
            <button className="create-submit-btn" onClick={handleCreateGroup}>Create</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;