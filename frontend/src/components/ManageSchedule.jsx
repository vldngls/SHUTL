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
    <div className="ShutlManageSchedule-popup" onClick={onClose}>
      <div className="ShutlManageSchedule-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="ShutlManageSchedule-title">Manage Schedule</h2>
        <div className="ShutlManageSchedule-list">
          {editedSchedule.map((entry, index) => (
            <div key={index} className="ShutlManageSchedule-entry">
              <input
                type="text"
                value={entry.day}
                onChange={(e) => handleInputChange(index, 'day', e.target.value)}
                placeholder="Day"
                className="ShutlManageSchedule-input"
              />
              <input
                type="text"
                value={entry.time}
                onChange={(e) => handleInputChange(index, 'time', e.target.value)}
                placeholder="Time"
                className="ShutlManageSchedule-input"
              />
              <input
                type="text"
                value={entry.details}
                onChange={(e) => handleInputChange(index, 'details', e.target.value)}
                placeholder="Details"
                className="ShutlManageSchedule-input"
              />
              <button className="ShutlManageSchedule-delete-button" onClick={() => handleDeleteEntry(index)}>Delete</button>
            </div>
          ))}
        </div>
        <button className="ShutlManageSchedule-add-button" onClick={handleAddEntry}>Add Entry</button>
        <div className="ShutlManageSchedule-footer">
          <button className="ShutlManageSchedule-save-button" onClick={handleSave}>Save</button>
          <button className="ShutlManageSchedule-close-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ManageSchedule;
