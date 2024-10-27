import React, { useState } from 'react';
import '../css/ManageSchedule.css';

const ManageSchedule = ({ schedule, onClose, onSave }) => {
  const [editedSchedule, setEditedSchedule] = useState(schedule);

  const handleInputChange = (index, field, value) => {
    const updatedSchedule = [...editedSchedule];
    updatedSchedule[index][field] = value;
    setEditedSchedule(updatedSchedule);
  };

  const handleSave = () => {
    const hasEmptyFields = editedSchedule.some(entry => !entry.day || !entry.time || !entry.details);
    if (hasEmptyFields) {
      alert("Please fill in all fields for each entry.");
      return;
    }
    onSave(editedSchedule);
    onClose();
  };

  const handleAddEntry = () => {
    setEditedSchedule([...editedSchedule, { day: '', time: '', details: '' }]);
  };

  const handleDeleteEntry = (index) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      const updatedSchedule = editedSchedule.filter((_, i) => i !== index);
      setEditedSchedule(updatedSchedule);
    }
  };

  return (
    <div className="ShutlManageSchedule-popup" onClick={onClose} role="dialog" aria-labelledby="manage-schedule-title">
      <div className="ShutlManageSchedule-content" onClick={(e) => e.stopPropagation()}>
        <h2 id="manage-schedule-title" className="ShutlManageSchedule-title">Manage Schedule</h2>
        <div className="ShutlManageSchedule-list">
          {editedSchedule.map((entry, index) => (
            <div key={index} className="ShutlManageSchedule-entry">
              <input
                type="date"
                value={entry.day}
                onChange={(e) => handleInputChange(index, 'day', e.target.value)}
                placeholder="Day"
                className="ShutlManageSchedule-input"
                aria-label={`Day for entry ${index + 1}`}
              />
              <input
                type="time"
                value={entry.time}
                onChange={(e) => handleInputChange(index, 'time', e.target.value)}
                placeholder="Time"
                className="ShutlManageSchedule-input"
                aria-label={`Time for entry ${index + 1}`}
              />
              <input
                type="text"
                value={entry.details}
                onChange={(e) => handleInputChange(index, 'details', e.target.value)}
                placeholder="Details"
                className="ShutlManageSchedule-input"
                aria-label={`Details for entry ${index + 1}`}
              />
              <button
                className="ShutlManageSchedule-delete-button"
                onClick={() => handleDeleteEntry(index)}
                aria-label={`Delete entry ${index + 1}`}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        <button className="ShutlManageSchedule-add-button" onClick={handleAddEntry} aria-label="Add new entry">Add Entry</button>
        <div className="ShutlManageSchedule-footer">
          <button className="ShutlManageSchedule-save-button" onClick={handleSave} aria-label="Save schedule">Save</button>
          <button className="ShutlManageSchedule-close-button" onClick={onClose} aria-label="Close schedule editor">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ManageSchedule;
