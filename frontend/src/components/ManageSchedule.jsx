import React, { useState, useEffect } from 'react';
import '../css/ManageSchedule.css';

const ManageSchedule = ({ schedule, onClose, onSave }) => {
  const [editedSchedule, setEditedSchedule] = useState(schedule);
  const [dateRange, setDateRange] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const generate7DayRange = () => {
    const today = new Date();
    const days = [];
    
    // Set today to local midnight to avoid any carry-over from the current time
    today.setHours(0, 0, 0, 0);
  
    for (let i = 0; i < 7; i++) {
      // Create a new date for each day based on `today`, avoiding direct modification of `today`
      const date = new Date(today);
      date.setDate(today.getDate() + i); // Increment day while respecting local time
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      days.push({ iso: date.toISOString().split('T')[0], formatted: formattedDate });
    }
  
    return days;
  };
  

  useEffect(() => {
    const range = generate7DayRange();
    setDateRange(range);
    setSelectedDay(range[0].iso);
  }, []);

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
    const newEntry = { day: selectedDay, time: '', details: '' };
    setEditedSchedule([...editedSchedule, newEntry]);
  };

  const handleDeleteEntry = (index) => {
    const updatedSchedule = editedSchedule.filter((_, i) => i !== index);
    setEditedSchedule(updatedSchedule);
  };

  const filteredSchedule = editedSchedule.filter(entry => entry.day === selectedDay);

  return (
    <div className="ShutlManageSchedule-popup" onClick={onClose} role="dialog">
      <div className="ShutlManageSchedule-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="ShutlManageSchedule-title">
          Manage Schedule for {new Date(selectedDay).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
        </h2>
        
        <div className="ShutlManageSchedule-day-selector">
          <label>Select Day: </label>
          <select 
            value={selectedDay} 
            onChange={(e) => setSelectedDay(e.target.value)}
            className="styled-dropdown"
          >
            {dateRange.map(day => (
              <option key={day.iso} value={day.iso}>{day.formatted}</option>
            ))}
          </select>
        </div>

        <div className="ShutlManageSchedule-list">
          {filteredSchedule.map((entry, index) => (
            <div key={index} className="ShutlManageSchedule-entry">
              <input
                type="time"
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
              <button
                className="ShutlManageSchedule-delete-button"
                onClick={() => handleDeleteEntry(index)}
              >
                Delete
              </button>
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
