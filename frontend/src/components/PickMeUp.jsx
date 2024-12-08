import React, { useState, useEffect } from 'react';

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  container: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '10px',
    width: '90%',
    maxWidth: '500px',
    position: 'relative'
  },
  closeButton: {
    position: 'absolute',
    right: '1rem',
    top: '1rem',
    border: 'none',
    background: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer'
  },
  formGroup: {
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem'
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: '4px'
  },
  submitButton: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  location: {
    padding: '10px',
    marginBottom: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    fontSize: '14px'
  }
};

const PickMeUp = ({ onClose, userLocation }) => {
  const [pickupDetails, setPickupDetails] = useState({
    destination: '',
    passengers: 1,
    notes: ''
  });
  const [locationAddress, setLocationAddress] = useState('Fetching location...');

  useEffect(() => {
    const fetchAddress = async () => {
      if (!userLocation) {
        setLocationAddress('Location not available');
        return;
      }

      try {
        const [lat, lon] = userLocation;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        
        if (data.display_name) {
          setLocationAddress(data.display_name);
        } else {
          setLocationAddress(`Coordinates: ${lat}, ${lon}`);
        }
      } catch (error) {
        console.error('Error fetching address:', error);
        setLocationAddress('Error fetching address');
      }
    };

    fetchAddress();
  }, [userLocation]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Pickup request:', {
      ...pickupDetails,
      pickupLocation: userLocation,
      pickupAddress: locationAddress
    });
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <button style={styles.closeButton} onClick={onClose}>×</button>
        <h2>Request a Pick Up</h2>
        
        <div style={styles.location}>
          <strong>Pickup Location:</strong><br />
          {locationAddress}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Destination:</label>
            <input
              style={styles.input}
              type="text"
              value={pickupDetails.destination}
              onChange={(e) => setPickupDetails({...pickupDetails, destination: e.target.value})}
              required
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Number of Passengers:</label>
            <input
              style={styles.input}
              type="number"
              min="1"
              max="4"
              value={pickupDetails.passengers}
              onChange={(e) => setPickupDetails({...pickupDetails, passengers: e.target.value})}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Additional Notes:</label>
            <textarea
              style={styles.input}
              value={pickupDetails.notes}
              onChange={(e) => setPickupDetails({...pickupDetails, notes: e.target.value})}
              placeholder="Any special instructions..."
            />
          </div>

          <button type="submit" style={styles.submitButton}>Request Pickup</button>
        </form>
      </div>
    </div>
  );
};

export default PickMeUp; 