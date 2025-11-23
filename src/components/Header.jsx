import React from "react";

export default function Header({ onAddNote, search, setSearch }) {
  return (
    <div className="header">
      <div>
        <h1>NoteIS</h1>
        <div style={{fontSize:12, color:'#666'}}>Personal workspace · Red theme</div>
      </div>
      <div className="controls">
        <div className="search">
          <input
            className="input"
            placeholder="Search notes or tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{border:'none', padding:0}}
          />
        </div>
        <button className="btn primary" onClick={onAddNote}>+ New</button>
      </div>
    </div>
  );
}
