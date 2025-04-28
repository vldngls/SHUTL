import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/config';
import { getCookie } from '../utils/cookieUtils';

const ShuttleInfoPopup = ({ shuttleId, onClose }) => {
  const [shuttleData, setShuttleData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShuttleData = async () => {
      try {
        const token = getCookie('token');
        const response = await fetch(`${API_BASE_URL}/shuttle-details/shuttles/${shuttleId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setShuttleData(data);
        } else {
          console.error('Failed to fetch shuttle data');
        }
      } catch (error) {
        console.error('Error fetching shuttle data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShuttleData();
  }, [shuttleId]);

  if (loading) {
    return (
      <div className="shuttle-info-popup">
        <div className="shuttle-info-content">
          <h3>Loading shuttle information...</h3>
        </div>
      </div>
    );
  }

  if (!shuttleData) {
    return (
      <div className="shuttle-info-popup">
        <div className="shuttle-info-content">
          <h3>Failed to load shuttle information</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="shuttle-info-popup">
      <div className="shuttle-info-content">
        <div className="shuttle-info-header">
          <h3>Shuttle {shuttleId}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="shuttle-info-details">
          <p><strong>Status:</strong> {shuttleData.status}</p>
          <p><strong>Speed:</strong> {shuttleData.speed?.toFixed(1) || '0.0'} km/h</p>
          <p><strong>Distance:</strong> {shuttleData.distance?.toFixed(2) || '0.00'} km</p>
          <p><strong>ETA:</strong> {shuttleData.eta || '0'} minutes</p>
          <p><strong>Last Update:</strong> {new Date(shuttleData.lastUpdate).toLocaleTimeString()}</p>
        </div>
        <button 
          className="pick-me-up-btn"
          disabled={shuttleData.status === 'offline'}
          onClick={() => {
            // Handle pickup request
            onClose();
          }}
        >
          Pick Me Up
        </button>
      </div>
    </div>
  );
};

ShuttleInfoPopup.propTypes = {
  shuttleId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ShuttleInfoPopup; 