// src/components/TaskList.jsx
import React from 'react';

// Utility function to format date from YYYY-MM-DD to MM-DD-YYYY
const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${month}-${day}-${year}`;
};

export default function TaskList({ tasks, onTaskSelect, selectedTaskId }) {
  return (
    <div className="task-list">
      {tasks.map(task => (
        <div
          key={task.id}
          className={`task ${task.done ? 'done' : ''} ${task.id === selectedTaskId ? 'active' : ''}`}
          onClick={() => onTaskSelect(task)}
          style={{ marginBottom: '10px', transition: 'all 0.2s ease', borderLeft: task.id === selectedTaskId ? '4px solid #f99a50' : '1px solid #e5e7eb' }}
        >
          {/* Checkbox (You'd use a real input here) */}
          <span style={{ fontSize: '18px' }}>{task.done ? '✅' : '⬜'}</span> 
          
          <div style={{ flexGrow: 1 }}>
              <div style={{ fontWeight: 600 }}>{task.title}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', gap: '10px', marginTop: '4px' }}>
                {task.dueDate && (
                  <span style={{ color: '#4b5563', fontWeight: 500 }}>
                    📅 {formatDate(task.dueDate)}
                  </span>
                )}
                {task.tags.map(tag => (
                  <span key={tag} className="tag" style={{ background: '#f8d7dc', color: '#c8102e', padding: '2px 8px', borderRadius: '6px', fontSize: '10px' }}>
                    {tag}
                  </span>
                ))}
              </div>
          </div>
          
          {/* Arrow icon for details */}
          <span style={{ color: '#9ca3af' }}>&gt;</span>
        </div>
      ))}
    </div>
  );
}