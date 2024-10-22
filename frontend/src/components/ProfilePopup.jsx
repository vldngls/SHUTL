import React, { useRef, useEffect, useState } from 'react';
import '../css/ProfilePopup.css'; // Ensure this path is correct

const ProfilePopup = ({ onClose }) => {
  const popupRef = useRef(null);
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});

  const fetchUserData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/userdata/me', {
        method: 'GET',
        credentials: 'include',  // Send cookies
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched User Data:', data); // Debugging log
        setUserData(data);
      } else {
        console.error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Fetch user data on component load
  useEffect(() => {
    fetchUserData();
  }, []);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData({ ...editedData, [name]: value });
  };

  // Handle profile update submission
  const handleUpdateProfile = async () => {
    try {
      // Convert and ensure correct data types
      const updatedProfileData = {
        email: userData.email,
        name: editedData.name || userData.name || '',
        birthday: editedData.birthday || userData.birthday || '',
        address: editedData.address || userData.address || '',
        discount: editedData.discount ? parseFloat(editedData.discount) : parseFloat(userData.discount || 0), // Ensure discount is a number
        paymentMethod: editedData.paymentMethod || userData.paymentMethod || '',
        contactNumber: editedData.contactNumber || userData.contactNumber || '',
      };
  
      console.log('Sending updated profile data:', updatedProfileData); // Debugging log
  
      const response = await fetch('http://localhost:5000/api/userdata/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfileData), // Send formatted data
      });
  
      if (response.ok) {
        const updatedData = await response.json();
        setUserData(updatedData); // Update the state with new data
        setIsEditing(false); // Exit edit mode
      } else {
        console.error('Failed to update user data', await response.json());
      }
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };
  

  if (userData === null) return <p>Loading...</p>; // Display a loading message while fetching data

  const renderField = (field, defaultValue = "N/A") => {
    return field ? field : defaultValue;
  };

  return (
    <div className="profile-popup">
      <div ref={popupRef} className="profile-popup-content">
        {/* Profile Header Section */}
        <div className="profile-header">
          <img src={userData.profilePicture || "https://via.placeholder.com/150"} alt="User Profile" className="profile-picture" />
          <div className="profile-info">
            <h2>{renderField(userData.name, "N/A")}</h2>
            <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>Edit User Profile</button>
          </div>
        </div>

        {/* User Details Section */}
        {!isEditing ? (
          <div className="user-details">
            <p><strong>Birthday:</strong> {userData.birthday ? new Date(userData.birthday).toISOString().substring(0, 10) : "N/A"}</p>
            <p><strong>Address:</strong> {renderField(userData.address, "N/A")}</p>
            <p><strong>Discount:</strong> {renderField(userData.discount, "N/A")}</p>
            <p><strong>Payment Method:</strong> {renderField(userData.paymentMethod, "N/A")}</p>
            <p><strong>Email:</strong> {renderField(userData.email, "N/A")}</p>
            <p><strong>Contact:</strong> {renderField(userData.contactNumber, "N/A")}</p>
          </div>
        ) : (
          <div className="user-details">
            {/* Update the input types for proper data entry */}
            <input
              name="name"
              type="text"
              value={editedData.name || userData.name || ''}
              onChange={handleInputChange}
              placeholder="Name"
            />

            <input
              name="birthday"
              type="date"  // Date input for birthday
              value={editedData.birthday || (userData.birthday && new Date(userData.birthday).toISOString().substring(0, 10)) || ''}
              onChange={handleInputChange}
              placeholder="Birthday"
            />

            <input
              name="address"
              type="text"
              value={editedData.address || userData.address || ''}
              onChange={handleInputChange}
              placeholder="Address"
            />

            <input
              name="discount"
              type="number"  // Number input for discount
              value={editedData.discount || userData.discount || ''}
              onChange={handleInputChange}
              placeholder="Discount"
            />

            <input
              name="paymentMethod"
              type="text"
              value={editedData.paymentMethod || userData.paymentMethod || ''}
              onChange={handleInputChange}
              placeholder="Payment Method"
            />

            <input
              name="contactNumber"
              type="tel"  // Telephone input for contact number
              value={editedData.contactNumber || userData.contactNumber || ''}
              onChange={handleInputChange}
              placeholder="Contact Number"
            />

            <button onClick={handleUpdateProfile}>Save Changes</button>
          </div>
        )}

        {/* Transaction History Section with Placeholder */}
        <div className="transaction-history">
          <h3>Transaction history</h3>
          <p>Transaction history feature coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePopup;
