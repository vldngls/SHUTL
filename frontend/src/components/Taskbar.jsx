import React from "react";
import "../css/Taskbar.css";

const Taskbar = ({ date, time }) => {
  return (
    <div className="Taskbar">
      <div className="Taskbar-content">
        <div className="Taskbar-datetime">
          <span className="Taskbar-date">{date}</span>
          <span className="Taskbar-separator">•</span>
          <span className="Taskbar-time">{time}</span>
        </div>
      </div>
    </div>
  );
};

export default Taskbar;
