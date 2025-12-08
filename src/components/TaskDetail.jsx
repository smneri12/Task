// src/components/TaskDetail.jsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';

export default function TaskDetail({ task, onSave, onDelete, onCancel, isNew }) {
  // Local state to manage form inputs
  const [formState, setFormState] = useState(task);
  // State for the new tag being typed
  const [newTag, setNewTag] = useState('');

  // Update local state when a new task is selected from props
  useEffect(() => {
    setFormState(task);
  }, [task]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // --- Tag Management ---

  const handleAddTag = () => {
    const tag = newTag.trim();
    
    if (tag && !formState.tags.includes(tag)) {
        const updatedTags = [...formState.tags, tag];

        // 1. Update local state
        setFormState(prevState => ({
            ...prevState,
            tags: updatedTags
        }));
        setNewTag(''); // Clear the input field

        // 2. Trigger server save immediately for tags (only for existing tasks)
        // This is necessary because tags are often treated as quick edits.
        if (formState.id !== 'new') {
            onSave(formState.id, { tags: updatedTags }); 
        }
    }
  };
  
  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = formState.tags.filter(tag => tag !== tagToRemove);
    
    // 1. Update local state
    setFormState(prevState => ({
        ...prevState,
        tags: updatedTags
    }));

    // 2. Trigger server save immediately for tags (only for existing tasks)
    if (formState.id !== 'new') {
        onSave(formState.id, { tags: updatedTags }); 
    }
  };

  // --- Save Handler ---
  
  const handleSaveClick = () => {
    // Separate the ID flag from the data fields to be saved
    const { id, ...fieldsToSave } = formState;
    
    // Call parent's handler (TasksPage.jsx) to save all fields (title, description, etc.)
    onSave(id, fieldsToSave);
    
    if (isNew) {
        // Closing the editor signals that creation is complete
        onCancel(); 
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Task Title Input */}
      <input
        type="text"
        name="title"
        value={formState.title}
        onChange={handleChange}
        className="editor-title"
        placeholder="Task Title"
        style={{ width: '100%', marginBottom: '10px' }}
      />

      {/* Description Textarea */}
      <textarea
        name="description"
        value={formState.description}
        onChange={handleChange}
        placeholder="Description"
        className="editor-textarea"
        rows="5"
        style={{ width: '100%', minHeight: '120px' }}
      ></textarea>
      
      {/* Meta Fields */}
      <div className="editor-meta" style={{ flexDirection: 'column', gap: '15px' }}>
          
        {/* Due Date */}
        <label style={{ color: '#6b7280', fontSize: '14px' }}>Due Date
            <input
                type="date"
                name="dueDate"
                // Split('T')[0] handles date strings that include time
                value={formState.dueDate ? formState.dueDate.split('T')[0] : ''} 
                onChange={handleChange}
                className="select"
                style={{ marginTop: '5px', display: 'block' }}
            />
        </label>

        {/* Tags Input and List */}
        <div style={{ color: '#6b7280', fontSize: '14px' }}>Tags
            {/* Display Existing Tags */}
            <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {formState.tags.map(tag => (
                    <span 
                        key={tag} 
                        className="tag" 
                        style={{ background: '#f8d7dc', color: '#c8102e', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => handleRemoveTag(tag)} 
                    >
                        {tag} ✕
                    </span>
                ))}
            </div>

            {/* Input for adding a Tag */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="New Tag Name"
                    className="select"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag() }}
                    style={{ flexGrow: 1, minWidth: '100px' }}
                />
                <button 
                    className="ghost-btn" 
                    onClick={handleAddTag} 
                    style={{ fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                    + Add Tag
                </button>
            </div>
        </div>

        {/* Task Status */}
        <label style={{ color: '#6b7280', fontSize: '14px', marginTop: '10px' }}>
            <input
                type="checkbox"
                name="done"
                checked={formState.done}
                onChange={handleChange}
                style={{ marginRight: '8px' }}
            />
            Task Completed
        </label>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
        
        {/* Delete Button (Only shown for existing tasks) */}
        {!isNew && (
            <button 
                className="icon-btn danger" 
                onClick={() => onDelete(task.id)}
                style={{ background: '#fef2f2', color: '#dc2626', fontWeight: 600 }}
            >
                <FontAwesomeIcon icon={faTrashAlt} style={{ marginRight: '5px' }} /> Delete Task
            </button>
        )}
        
        {/* Save/Create Button */}
        <button 
          className="primary-btn" 
          onClick={handleSaveClick}
          style={{ flexGrow: isNew ? 1 : 0 }}
        >
          {isNew ? 'Create Task' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}