import React, { useState } from 'react';
import '../css/SchedulePopup.css';
import ManageSchedule from './ManageSchedule';

const SchedulePopup = ({ schedule, onClose, onSave }) => {
  const [editableSchedule, setEditableSchedule] = useState([...schedule]);
  const [newDay, setNewDay] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [isManageScheduleOpen, setIsManageScheduleOpen] = useState(false);

  const handleAddSlot = () => {
    if (newDay && newTime && newLocation) {
      const newSlot = { day: newDay, time: newTime, details: `Pickup loc: ${newLocation}` };
      setEditableSchedule([...editableSchedule, newSlot]);
      setNewDay('');
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

  return (
    <div className="schedule-popup">
      <div className="schedule-popup-content">
        <div className="schedule-popup-header">
          <h3>Driver Schedule - August 2024</h3>
          <button className="schedule-popup-close" onClick={onClose}>✖</button>
        </div>
        <div className="schedule-popup-body">
          <table className="schedule-popup-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Day</th>
                <th>Time</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {editableSchedule.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.day}</td>
                  <td>{entry.time}</td>
                  <td>{entry.details}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="schedule-popup-add-availability">
            <h4>Add Availability</h4>
            <select value={newDay} onChange={(e) => setNewDay(e.target.value)} className="schedule-popup-availability-input">
              <option value="">Select Day</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="schedule-popup-availability-input"
            />
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Enter pickup location"
              className="schedule-popup-availability-input"
            />
            <button className="schedule-popup-add-slot-btn" onClick={handleAddSlot}>Add Slot</button>
          </div>
        </div>
        <div className="schedule-popup-footer">
          <button className="schedule-popup-manage-schedule-btn" onClick={handleOpenManageSchedule}>Manage Full Schedule</button>
          <button className="schedule-popup-save-schedule-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
      {isManageScheduleOpen && (
        <ManageSchedule
          schedule={editableSchedule}
          onClose={handleCloseManageSchedule}
          onSave={(updatedSchedule) => setEditableSchedule(updatedSchedule)}
        />
      )}
    </div>
  );
};

export default SchedulePopup;