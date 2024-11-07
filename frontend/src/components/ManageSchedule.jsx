import React, { useState, useEffect } from 'react';
import '../css/ManageSchedule.css';

const ManageSchedule = ({ schedule, onClose, onSave }) => {
  const [editedSchedule, setEditedSchedule] = useState(schedule);
  const [dateRange, setDateRange] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');

  // Generate 7-day date range starting from today in "Month Day, Year" format
  const generate7DayRange = () => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
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
    setSelectedDay(range[0].iso); // Set initial selected day to today
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
    console.log("Input changed: ", updatedSchedule);
  };

  const handleSave = () => {
    const hasEmptyFields = editedSchedule
      .filter(entry => entry.day === selectedDay)
      .some(entry => !entry.time || !entry.details);

    if (hasEmptyFields) {
      alert("Please fill in all fields for each entry.");
      return;
    }

    // Merge the edited schedule with the existing schedule
    const updatedSchedule = editedSchedule.map(entry => {
      const existingEntry = schedule.find(e => e.day === entry.day && e.time === entry.time);
      return existingEntry ? { ...existingEntry, ...entry } : entry;
    });

    console.log("Saving Edited Schedule: ", updatedSchedule);
    onSave(updatedSchedule);
    onClose();
  };

  const handleAddEntry = () => {
    const newEntry = { day: selectedDay, time: '', details: '' };
    setEditedSchedule([...editedSchedule, newEntry]);
    console.log("New Entry Added: ", newEntry);
  };

  const handleDeleteEntry = (index) => {
    const entryToDelete = filteredSchedule[index];
    const actualIndex = editedSchedule.findIndex(
      (entry) => entry.day === entryToDelete.day && entry.time === entryToDelete.time && entry.details === entryToDelete.details
    );

    if (actualIndex !== -1 && window.confirm("Are you sure you want to delete this entry?")) {
      const updatedSchedule = editedSchedule.filter((_, i) => i !== actualIndex);
      setEditedSchedule(updatedSchedule);
      console.log("Entry Deleted: ", entryToDelete);
    }
  };

  const filteredSchedule = editedSchedule.filter(entry => entry.day === selectedDay);

  return (
    <div className="ShutlManageSchedule-popup" onClick={onClose} role="dialog" aria-labelledby="manage-schedule-title">
      <div className="ShutlManageSchedule-content" onClick={(e) => e.stopPropagation()}>
        <h2 id="manage-schedule-title" className="ShutlManageSchedule-title">
          Manage Schedule for {new Date(selectedDay).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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
                min="06:00"  
                max="22:00"  
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
