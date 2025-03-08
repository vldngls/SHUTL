import React, { useEffect, useState } from "react";
import "../css/Taskbar.css";
import { operationsService } from "../services/api/operations";

const Taskbar = ({ date, time }) => {
  const [operationalHours, setOperationalHours] = useState({
    startTime: "",
    endTime: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOperationalHours = async () => {
      try {
        const response = await operationsService.getOperationalHours();
        setOperationalHours(response);
      } catch (error) {
        console.error("Error fetching operational hours:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOperationalHours();
  }, []);

  return (
    <div className="Taskbar">
      <div className="Taskbar-content">
        <div className="Taskbar-datetime">
          <span className="Taskbar-date">{date}</span>
          <span className="Taskbar-separator">•</span>
          <span className="Taskbar-time">{time}</span>
          {!loading && (
            <>
              <span className="Taskbar-separator">•</span>
              <span className="Taskbar-operational-hours">
                Operational Hours: {operationalHours.startTime} -{" "}
                {operationalHours.endTime}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Taskbar;
