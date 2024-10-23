import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import '../css/DriverMain.css';
import SuggestionForm from '../components/SuggestionForm';
import DriverMessage from '../components/DriverMessage';
import ProfileIDCard from '../components/ProfileIDCard';
import SettingsDropdown from '../components/SettingsDropdown';
import SchedulePopup from '../components/SchedulePopup';
import NotificationPop from '../components/NotificationPop'; // Import NotificationPop
import L from 'leaflet';

const carIcon = new L.Icon({
  iconUrl: '/car.png', 
  iconRetinaUrl: '/car.png',
  iconAnchor: [12, 41], 
  popupAnchor: [1, -34], 
  iconSize: [29, 59], 
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

const DriverMain = () => {
  const navigate = useNavigate();
  const [dateTime, setDateTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState(null);
  const [isProfileIDOpen, setIsProfileIDOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [messages, setMessages] = useState([
    { driver: 'Driver. 001', text: '2 Passengers currently waiting.' },
    { driver: 'Driver. 002', text: 'Thank you. Proceed with your current task.' },
    { driver: 'Driver. 003', text: 'Okay, I’ll take note and inform others.' }
  ]);
  const [schedule, setSchedule] = useState([
    { day: 'Sunday', time: '8:00 am', details: 'Person waiting: 5, Pickup loc: Ruby St.' },
    { day: 'Monday', time: '11:00 am', details: 'Person waiting: 10, Pickup loc: Diamond St.' },
    { day: 'Tuesday', time: '9:00 am', details: 'Person waiting: 2, Pickup loc: Cordoba St.' },
    { day: 'Wednesday', time: '10:00 am', details: 'Person waiting: 2, Pickup loc: Bilbao St.' },
    { day: 'Thursday', time: '9:00 am', details: 'Person waiting: 2, Pickup loc: Mallorca St.' },
    { day: 'Friday', time: '10:00 am', details: 'Person waiting: 2, Pickup loc: Garnet St.' },
    { day: 'Saturday', time: '2:00 pm', details: 'Person waiting: 2, Pickup loc: Coral St.' }
  ]);
  const mapRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user')) || {
    identifier: 'SHUTL001-1A',
    name: 'John Doe',
    address: '412 Sta Fe Tomas Morato',
    sex: 'M',
    email: 'jam.teller@gmail.com',
    eyeColor: 'Brown',
    dob: '07/15/1983',
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      const handleResize = () => {
        mapRef.current.invalidateSize();
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const updateUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userCoords = [latitude, longitude];
          setUserLocation(userCoords);
        },
        (error) => {
          alert("Unable to retrieve your location. Please try again.");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };
  const toggleSuggestionForm = () => {
    console.log('Is suggestion form open?', isSuggestionOpen);
    setIsSuggestionOpen(!isSuggestionOpen);
  };
  
  const toggleProfileID = () => setIsProfileIDOpen(!isProfileIDOpen);
  const toggleSettings = () => setIsSettingsOpen(!isSettingsOpen);
  const toggleMessageBox = () => setIsMessageOpen(!isMessageOpen);
  const toggleSchedule = () => setIsScheduleOpen(!isScheduleOpen);
  const toggleNotification = () => setIsNotificationOpen(!isNotificationOpen);

  const handleSendMessage = (messageText) => {
    const newMessage = {
      driver: 'You',
      text: messageText
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <>
      <div className="map-container">
        <MapContainer
          style={{ height: '100%', width: '100%' }}
          center={[14.377, 120.983]}
          zoom={15.5}
          zoomControl={false}
          whenCreated={mapInstance => { mapRef.current = mapInstance }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {userLocation && (
            <Marker position={userLocation} icon={carIcon}>
              <Popup>You are here.</Popup>
              <Tooltip direction="right" offset={[12, 0]} permanent>
                Shuttle 001
              </Tooltip>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="navbar">
        <div className="logo">SHU TL.</div>

        <div className="navbar-buttons">
          <button className="icon-btn" onClick={toggleMessageBox}>
            <img src="/message.png" alt="Message Icon" className="icon-image" />
          </button>

          <button className="icon-btn" onClick={toggleSchedule}>
            <img src="/calendar.png" alt="Schedule Icon" className="icon-image" />
          </button>

          <button className="icon-btn" onClick={toggleNotification}>
            <img src="/notif.png" alt="Notification Icon" className="icon-image" />
          </button>

          <div className="settings-container">
            <button className="icon-btn settings-btn" onClick={toggleSettings}>
              <img src="/settings.png" alt="Settings Icon" className="icon-image" />
            </button>
            {isSettingsOpen && (
              <div className="settings-dropdown" style={{ top: '50%', left: '110%', transform: 'translateY(-50%)' }}>
                <SettingsDropdown onClose={toggleSettings} />
              </div>
            )}
          </div>
        </div>

        <div className="icon-container" onClick={toggleProfileID}>
          <div className="line"></div>
          <img src="/profile.png" alt="Navigation Icon" className="nav-icon" />
        </div>
      </div>

      <div className="taskbar">
        {dateTime.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - {dateTime.toLocaleTimeString('en-PH')}
      </div>

      <button className="update-location-btn" onClick={updateUserLocation}>
        <img src="/locup.png" alt="Update Location" className="update-location-icon" />
      </button>

      <button className="request-assistance-btn" onClick={toggleSuggestionForm}>
  ?
</button>

{isSuggestionOpen && (
  <SuggestionForm onClose={toggleSuggestionForm} />
)}

      {isProfileIDOpen && <ProfileIDCard user={user} onClose={toggleProfileID} />}

      {isScheduleOpen && (
        <SchedulePopup
          schedule={schedule}
          onClose={() => setIsScheduleOpen(false)}
          onSave={(updatedSchedule) => setSchedule(updatedSchedule)}
        />
      )}
      {isNotificationOpen && (
        <NotificationPop onClose={toggleNotification} />
      )}

      {isMessageOpen && (
        <DriverMessage messages={messages} onSendMessage={handleSendMessage} />
      )}

      <div className="operational-hours">
        Operational hours: 8:00 AM to 10:00 PM
      </div>
    </>
  );
};

export default DriverMain;
