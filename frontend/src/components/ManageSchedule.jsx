import React, { useState, useEffect } from 'react';
import '../css/ManageSchedule.css';

const ManageSchedule = ({ schedule, onClose, onSave }) => {
  const [editedSchedule, setEditedSchedule] = useState(schedule);
  const [dateRange, setDateRange] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');

  // Generate 7-day date range starting from today
  const generate7DayRange = () => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date.toISOString().split('T')[0]); // format to YYYY-MM-DD
    }
    return days;
  };

  useEffect(() => {
    const range = generate7DayRange();
    setDateRange(range);
    setSelectedDay(range[0]); // Set initial selected day to today
  }, []);

  const handleInputChange = (index, field, value) => {
    const entryToEdit = filteredSchedule[index];
    const actualIndex = editedSchedule.findIndex(
      (entry) => entry.day === entryToEdit.day && entry.time === entryToEdit.time && entry.details === entryToEdit.details
    );

    if (actualIndex === -1) return;

    const updatedSchedule = [...editedSchedule];
    updatedSchedule[actualIndex][field] = value;
    setEditedSchedule(updatedSchedule);
  };

  const handleSave = () => {
    // Validate all fields (ensure that each entry for the selected day has time and details)
    const hasEmptyFields = editedSchedule
      .filter(entry => entry.day === selectedDay)
      .some(entry => !entry.time || !entry.details);

    if (hasEmptyFields) {
      alert("Please fill in all fields for each entry.");
      return;
    }
    
    onSave(editedSchedule);
    onClose();
  };

  const handleAddEntry = () => {
    // Automatically use selectedDay as the day for new entries
    setEditedSchedule([...editedSchedule, { day: selectedDay, time: '', details: '' }]);
  };

  const handleDeleteEntry = (index) => {
    const entryToDelete = filteredSchedule[index];
    const actualIndex = editedSchedule.findIndex(
      (entry) => entry.day === entryToDelete.day && entry.time === entryToDelete.time && entry.details === entryToDelete.details
    );

    if (actualIndex !== -1 && window.confirm("Are you sure you want to delete this entry?")) {
      const updatedSchedule = editedSchedule.filter((_, i) => i !== actualIndex);
      setEditedSchedule(updatedSchedule);
    }
  };

  // Filter the schedule by selected day
  const filteredSchedule = editedSchedule.filter(entry => entry.day === selectedDay);

  return (
    <div className="ShutlManageSchedule-popup" onClick={onClose} role="dialog" aria-labelledby="manage-schedule-title">
      <div className="ShutlManageSchedule-content" onClick={(e) => e.stopPropagation()}>
        <h2 id="manage-schedule-title" className="ShutlManageSchedule-title">
          Manage Schedule for {selectedDay}
        </h2>
        
        <div className="ShutlManageSchedule-day-selector">
          <label>Select Day: </label>
          <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
            {dateRange.map(day => (
              <option key={day} value={day}>{day}</option>
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
                min="06:00"  // Set the minimum time to 6:00 AM
                max="22:00"  // Set the maximum time to 10:00 PM
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

        <button className="ShutlManageSchedule-add-button" onClick={handleAddEntry} aria-label="Add new entry">
          Add Entry
        </button>
        
        <div className="ShutlManageSchedule-footer">
          <button className="ShutlManageSchedule-save-button" onClick={handleSave} aria-label="Save schedule">Save</button>
          <button className="ShutlManageSchedule-close-button" onClick={onClose} aria-label="Close schedule editor">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ManageSchedule;
