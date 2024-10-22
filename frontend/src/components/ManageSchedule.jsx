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
    onSave(editedSchedule);
    onClose();
  };

  const handleAddEntry = () => {
    setEditedSchedule([...editedSchedule, { day: '', time: '', details: '' }]);
  };

  const handleDeleteEntry = (index) => {
    const updatedSchedule = editedSchedule.filter((_, i) => i !== index);
    setEditedSchedule(updatedSchedule);
  };

  return (
    <div className="manage-schedule-popup" onClick={onClose}>
      <div className="manage-schedule-content" onClick={(e) => e.stopPropagation()}>
        <h2>Manage Schedule</h2>
        <div className="schedule-list">
          {editedSchedule.map((entry, index) => (
            <div key={index} className="schedule-entry">
              <input
                type="text"
                value={entry.day}
                onChange={(e) => handleInputChange(index, 'day', e.target.value)}
                placeholder="Day"
                className="schedule-input"
              />
              <input
                type="text"
                value={entry.time}
                onChange={(e) => handleInputChange(index, 'time', e.target.value)}
                placeholder="Time"
                className="schedule-input"
              />
              <input
                type="text"
                value={entry.details}
                onChange={(e) => handleInputChange(index, 'details', e.target.value)}
                placeholder="Details"
                className="schedule-input"
              />
              <button className="delete-button" onClick={() => handleDeleteEntry(index)}>Delete</button>
            </div>
          ))}
        </div>
        <button className="add-button" onClick={handleAddEntry}>Add Entry</button>
        <div className="manage-schedule-footer">
          <button className="save-button" onClick={handleSave}>Save</button>
          <button className="close-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ManageSchedule;
