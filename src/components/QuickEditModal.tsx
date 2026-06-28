import { useState } from "react";
import { Modal } from "./ui/Modal";
import { appStore } from "../store/appStore";

interface QuickEditModalProps {
  bookId: string;
  nodeId: string;
  onClose: () => void;
}

export function QuickEditModal({ bookId, nodeId, onClose }: QuickEditModalProps) {
  const books = appStore.books.get() || [];
  const bookIndex = books.findIndex(b => b.id === bookId);
  const book = books[bookIndex];

  const getInitial = () => {
    if (!book) return { name: "", desc: "", time: 0, color: "" };
    if (nodeId.startsWith("char_")) {
      const entity = book.characters?.find(c => c.id === nodeId.replace("char_", ""));
      if (entity) return { name: entity.name || "", desc: entity.role || "", time: 0, color: entity.color || "" };
    } else if (nodeId.startsWith("event_")) {
      const entity = book.events?.find(e => e.id === nodeId.replace("event_", ""));
      if (entity) return { name: entity.title || "", desc: entity.description || "", time: entity.time || 0, color: "" };
    } else if (nodeId.startsWith("nation_")) {
      const entity = book.nations?.find(n => n.id === nodeId.replace("nation_", ""));
      if (entity) return { name: entity.name || "", desc: entity.periodActive || "", time: 0, color: "" };
    }
    return { name: "", desc: "", time: 0, color: "" };
  };

  const [initialData] = useState(getInitial);
  const [name, setName] = useState(initialData.name);
  const [description, setDescription] = useState(initialData.desc);
  const [time, setTime] = useState(initialData.time);
  const [color, setColor] = useState(initialData.color);

  const handleSave = () => {
    if (!book || bookIndex < 0) return;
    
    const newBooks = [...books];
    const newBook = { ...book };
    
    if (nodeId.startsWith("char_")) {
      const id = nodeId.replace("char_", "");
      const idx = newBook.characters?.findIndex(c => c.id === id) ?? -1;
      if (idx >= 0 && newBook.characters) {
        newBook.characters[idx] = { ...newBook.characters[idx], name, color, role: description };
      }
    } else if (nodeId.startsWith("event_")) {
      const id = nodeId.replace("event_", "");
      const idx = newBook.events?.findIndex(e => e.id === id) ?? -1;
      if (idx >= 0 && newBook.events) {
        newBook.events[idx] = { ...newBook.events[idx], title: name, description, time: Number(time) };
      }
    } else if (nodeId.startsWith("nation_")) {
      const id = nodeId.replace("nation_", "");
      const idx = newBook.nations?.findIndex(n => n.id === id) ?? -1;
      if (idx >= 0 && newBook.nations) {
        newBook.nations[idx] = { ...newBook.nations[idx], name, periodActive: description };
      }
    }
    
    newBooks[bookIndex] = newBook;
    appStore.books.set(newBooks);
    appStore.lastModifiedLocal.set(Date.now());
    onClose();
  };

  if (!book) return null;
  
  const isChar = nodeId.startsWith("char_");
  const isEvent = nodeId.startsWith("event_");
  const isNation = nodeId.startsWith("nation_");
  
  if (!isChar && !isEvent && !isNation) {
    return (
      <Modal title="Unsupported Entity" onClose={onClose}>
        <div style={{ padding: 24, textAlign: "center" }}>
          <p>Quick edit is currently only supported for Characters, Events, and Nations.</p>
        </div>
      </Modal>
    );
  }

  const titleStr = isChar ? "Edit Character" : isEvent ? "Edit Event" : "Edit Nation";

  return (
    <Modal 
      title={titleStr} 
      onClose={onClose}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, width: "100%" }}>
          <button 
            onClick={onClose} 
            style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "8px 16px" }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            style={{ background: "var(--color-primary)", color: "var(--bg-app)", border: "none", borderRadius: 6, padding: "8px 24px", cursor: "pointer", fontWeight: "bold" }}
          >
            Save Changes
          </button>
        </div>
      }
    >
      <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: "bold", textTransform: "uppercase" }}>
            {isEvent ? "Title" : "Name"}
          </label>
          <input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            style={{ padding: 12, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-main)", color: "var(--text-primary)" }}
          />
        </div>
        
        {isChar && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: "bold", textTransform: "uppercase" }}>
              Theme Color
            </label>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input 
                type="color" 
                value={color || "#ffffff"} 
                onChange={e => setColor(e.target.value)} 
                style={{ width: 40, height: 40, padding: 0, border: "none", background: "none", cursor: "pointer" }}
              />
              <input 
                value={color} 
                onChange={e => setColor(e.target.value)} 
                placeholder="#hexcode"
                style={{ flex: 1, padding: 12, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-main)", color: "var(--text-primary)" }}
              />
            </div>
          </div>
        )}
        
        {isEvent && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: "bold", textTransform: "uppercase" }}>
              Timeline Position (T)
            </label>
            <input 
              type="number"
              value={time} 
              onChange={e => setTime(Number(e.target.value))} 
              style={{ padding: 12, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-main)", color: "var(--text-primary)" }}
            />
          </div>
        )}
        
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: "bold", textTransform: "uppercase" }}>
            {isChar ? "Role" : isNation ? "Period Active" : "Description"}
          </label>
          <textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            rows={3}
            style={{ padding: 12, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-main)", color: "var(--text-primary)", resize: "vertical" }}
          />
        </div>
      </div>
    </Modal>
  );
}
