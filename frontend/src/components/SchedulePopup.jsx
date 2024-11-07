import React, { useState, useEffect } from 'react';
import '../css/SchedulePopup.css';
import ManageSchedule from './ManageSchedule';

const SchedulePopup = ({ schedule, onClose, onSave }) => {
  const [editableSchedule, setEditableSchedule] = useState(schedule);
  const [selectedDay, setSelectedDay] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [isManageScheduleOpen, setIsManageScheduleOpen] = useState(false);

  const get7DayRange = () => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date.toISOString().split('T')[0]); // format to "YYYY-MM-DD"
    }
    return days;
  };

  const [dateRange, setDateRange] = useState(get7DayRange());

  useEffect(() => {
    const initialSchedule = dateRange.map(day => 
      editableSchedule.find(entry => entry.day === day) || { day, time: '', details: '' }
    );
    setEditableSchedule(initialSchedule);
    setSelectedDay(dateRange[0]);
  }, [dateRange, schedule]);

  const handleAddSlot = () => {
    if (selectedDay && newTime && newLocation) {
      const newSlot = { day: selectedDay, time: newTime, details: `Pickup loc: ${newLocation}` };
      setEditableSchedule(editableSchedule.map(entry => entry.day === selectedDay ? newSlot : entry));
      setNewTime('');
      setNewLocation('');
    }
  };

  const handleSave = () => {
    onSave(editableSchedule);
    onClose();
  };

  const handleOpenManageSchedule = () => {
    setIsManageScheduleOpen(true);
  };

  const handleCloseManageSchedule = () => {
    setIsManageScheduleOpen(false);
  };

  if (isManageScheduleOpen) {
    return (
      <ManageSchedule
        schedule={editableSchedule}
        onClose={handleCloseManageSchedule}
        onSave={(updatedSchedule) => {
          setEditableSchedule(updatedSchedule);
          setIsManageScheduleOpen(false);
        }}
      />
    );
  }

  const filteredSchedule = editableSchedule.filter(entry => entry.day === selectedDay);

  return (
    <div className="schedule-popup">
      <div className="schedule-popup-content">
        <div className="schedule-popup-header">
          <h3>Driver Schedule - {dateRange[0]} - {dateRange[6]}</h3>
          <button className="schedule-popup-close" onClick={onClose}>✖</button>
        </div>
        <div className="schedule-popup-body">
          <div className="schedule-day-selector">
            <label>Select Day: </label>
            <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
              {dateRange.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          <table className="schedule-popup-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Time</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedule.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.day}</td>
                  <td>{entry.time}</td>
                  <td>{entry.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="schedule-popup-footer">
          <button className="schedule-popup-manage-schedule-btn" onClick={handleOpenManageSchedule}>Manage Full Schedule</button>
          <button className="schedule-popup-save-schedule-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default SchedulePopup;
