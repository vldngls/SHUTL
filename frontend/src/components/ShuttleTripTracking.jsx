// ShuttleTripTracking.jsx

import React, { useState } from 'react';

const ShuttleTripTracking = () => {
    const [tripData, setTripData] = useState({
        date: '',
        time: '',
        shuttleNumber: '',
        driver: '',
        status: 'In',
        passengerCount: 0,
    });

    const handleChange = (e) => {
        setTripData({ ...tripData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/shuttle/trips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tripData),
            });

            if (response.ok) {
                alert('Shuttle trip added successfully');
                setTripData({
                    date: '',
                    time: '',
                    shuttleNumber: '',
                    driver: '',
                    status: 'In',
                    passengerCount: 0,
                });
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to add shuttle trip');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while adding the shuttle trip');
        }
    };

    return (
        <div>
            <h2>Shuttle Trip Tracking</h2>
            <form onSubmit={handleSubmit}>
                <label>
                    Date:
                    <input type="date" name="date" value={tripData.date} onChange={handleChange} required />
                </label>
                <label>
                    Time:
                    <input type="time" name="time" value={tripData.time} onChange={handleChange} required />
                </label>
                <label>
                    Shuttle Number:
                    <input type="text" name="shuttleNumber" value={tripData.shuttleNumber} onChange={handleChange} required />
                </label>
                <label>
                    Driver:
                    <input type="text" name="driver" value={tripData.driver} onChange={handleChange} required />
                </label>
                <label>
                    Status:
                    <select name="status" value={tripData.status} onChange={handleChange}>
                        <option value="In">In</option>
                        <option value="Out">Out</option>
                    </select>
                </label>
                <label>
                    Passenger Count:
                    <input type="number" name="passengerCount" value={tripData.passengerCount} onChange={handleChange} required />
                </label>
                <button type="submit">Add Shuttle Trip</button>
            </form>
        </div>
    );
};

export default ShuttleTripTracking;
