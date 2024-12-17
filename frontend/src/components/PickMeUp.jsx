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
  },
  select: {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    marginBottom: '0.5rem'
  },
  customInput: {
    marginTop: '0.5rem',
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    display: 'none'
  }
};

const COMMON_LOCATIONS = [
  { id: 'select', label: '-- Select Destination --' },
  { id: 'clubhouse', label: 'Camella Clubhouse' },
  { id: 'gate1', label: 'Main Gate (Gate 1)' },
  { id: 'gate2', label: 'Back Gate (Gate 2)' },
  { id: 'basketball', label: 'Basketball Court' },
  { id: 'playground', label: 'Children\'s Playground' },
  { id: 'chapel', label: 'Community Chapel' },
  { id: 'pool', label: 'Swimming Pool' },
  { id: 'park', label: 'Central Park' },
  { id: 'minimart', label: 'Mini Mart' },
  { id: 'custom', label: 'Other Location (Specify)' }
];

const PickMeUp = ({ onClose, userLocation }) => {
  const [pickupDetails, setPickupDetails] = useState({
    destination: 'select',
    customDestination: '',
    passengers: 1,
    notes: '',
  });
  const [locationAddress, setLocationAddress] = useState('Fetching location...');
  const [showCustomInput, setShowCustomInput] = useState(false);

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

  const handleDestinationChange = (e) => {
    const value = e.target.value;
    setPickupDetails({
      ...pickupDetails,
      destination: value
    });
    setShowCustomInput(value === 'custom');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalDestination = pickupDetails.destination === 'custom' 
      ? pickupDetails.customDestination 
      : COMMON_LOCATIONS.find(loc => loc.id === pickupDetails.destination)?.label;

    console.log('Pickup request:', {
      ...pickupDetails,
      destination: finalDestination,
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
            <select
              style={styles.select}
              value={pickupDetails.destination}
              onChange={handleDestinationChange}
              required
            >
              {COMMON_LOCATIONS.map(location => (
                <option key={location.id} value={location.id}>
                  {location.label}
                </option>
              ))}
            </select>
            
            {showCustomInput && (
              <input
                style={{...styles.input, marginTop: '0.5rem'}}
                type="text"
                value={pickupDetails.customDestination}
                onChange={(e) => setPickupDetails({
                  ...pickupDetails,
                  customDestination: e.target.value
                })}
                placeholder="Enter your destination"
                required={showCustomInput}
              />
            )}
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Number of Passengers:</label>
            <input
              style={styles.input}
              type="number"
              min="1"
              max="4"
              value={pickupDetails.passengers}
              onChange={(e) => setPickupDetails({
                ...pickupDetails,
                passengers: parseInt(e.target.value)
              })}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Additional Notes:</label>
            <textarea
              style={styles.input}
              value={pickupDetails.notes}
              onChange={(e) => setPickupDetails({
                ...pickupDetails,
                notes: e.target.value
              })}
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