import React, { useState, useEffect } from 'react';
import '../css/SchedulePopup.css';
import ManageSchedule from './ManageSchedule';

const SchedulePopup = ({ schedule, onClose }) => {
  const [editableSchedule, setEditableSchedule] = useState(schedule);
  const [selectedDay, setSelectedDay] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [isManageScheduleOpen, setIsManageScheduleOpen] = useState(false);
  const [dateRange, setDateRange] = useState([]);
  const [formattedDateRange, setFormattedDateRange] = useState('');

  const get7DayRange = () => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setUTCHours(16, 0, 0, 0); // Midnight in UTC+8
      date.setDate(today.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  useEffect(() => {
    // Function to refresh date range at midnight in the Philippines
    const updateDateRange = () => {
      const newRange = get7DayRange();
      setDateRange(newRange);
      setFormattedDateRange(formatDateRange(newRange));
      setSelectedDay(newRange[0]); // Set to the first day in the range
      updateEditableSchedule(newRange);
    };

    const updateEditableSchedule = (newRange) => {
      const initialSchedule = newRange.map(day =>
        editableSchedule.find(entry => entry.day === day) || { day, time: '', details: '' }
      );
      setEditableSchedule(initialSchedule);
    };

    // Set initial date range on component mount
    updateDateRange();

    // Set a timeout to refresh at midnight Philippines time
    const now = new Date();
    const midnight = new Date();
    midnight.setUTCHours(16, 0, 0, 0); // Midnight in UTC+8 (Philippines)
    midnight.setDate(now.getUTCDate() + 1); // Set to the next midnight

    const timeUntilMidnight = midnight - now;
    const midnightTimeout = setTimeout(updateDateRange, timeUntilMidnight);

    return () => clearTimeout(midnightTimeout);
  }, [schedule]);

  const handleAddSlot = () => {
    if (selectedDay && newTime && newLocation) {
      const newSlot = { day: selectedDay, time: newTime, details: `Pickup loc: ${newLocation}` };
      setEditableSchedule(prevSchedule =>
        prevSchedule.map(entry => entry.day === selectedDay ? newSlot : entry)
      );
      setNewTime('');
      setNewLocation('');
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editableSchedule),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Schedule saved:', data);
      onClose();
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
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

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila' };
    return new Date(dateString).toLocaleDateString('en-PH', options);
  };

  const formatDateRange = (range) => {
    const startDate = new Date(range[0]);
    const endDate = new Date(range[range.length - 1]);
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  return (
    <div className="schedule-popup">
      <div className="schedule-popup-content">
        <div className="schedule-popup-header">
          <h3>Driver Schedule - {formattedDateRange}</h3>
          <button className="schedule-popup-close" onClick={onClose}>✖</button>
        </div>
        <div className="schedule-popup-body">
          <div className="schedule-day-selector">
            <label>Select Day: </label>
            <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
              {dateRange.map(day => (
                <option key={day} value={day}>{formatDate(day)}</option>
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
