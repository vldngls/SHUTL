import React, { useState } from 'react';
import '../css/TellerProfile.css';

const TellerProfile = ({ onClose, onImageChange }) => {
  const initialProfileData = {
    name: 'John Doe',
    age: 30,
    address: '123 Main St',
    email: 'johndoe@example.com',
    birthday: '1992-01-01',
    position: 'Teller 1',
    profileImage: '/teller-profile.png' // Default profile image
  };

  const [profileData, setProfileData] = useState(initialProfileData);
  const [isEditMode, setIsEditMode] = useState(false); // Edit mode toggle

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleImageChange = (e) => {
    if (isEditMode) { // Allow image change only in edit mode
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileData({ ...profileData, profileImage: reader.result });
          onImageChange(reader.result); // Update image in parent component
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSave = () => {
    console.log("Profile saved:", profileData);
    setIsEditMode(false); // Exit edit mode after saving
    onClose();
  };

  const handleCancel = () => {
    setProfileData(initialProfileData); // Revert changes
    setIsEditMode(false); // Exit edit mode without saving
    onClose();
  };

  return (
    <div className="TellerProfile-modal">
      <div className="TellerProfile-container">
        <button onClick={onClose} className="TellerProfile-close-btn">Close</button>
        
        <div className="TellerProfile-icon">
          <img src={profileData.profileImage} alt="Profile Icon" className="TellerProfile-icon-image" />
          {isEditMode && <input type="file" onChange={handleImageChange} className="TellerProfile-upload" />}
        </div>

        <div className="TellerProfile-details">
          <label>
            Name:
            <input
              type="text"
              name="name"
              value={profileData.name}
              onChange={handleInputChange}
              readOnly={!isEditMode} // Editable only in edit mode
            />
          </label>
          <label>
            Age:
            <input
              type="number"
              name="age"
              value={profileData.age}
              onChange={handleInputChange}
              readOnly={!isEditMode}
            />
          </label>
          <label>
            Address:
            <input
              type="text"
              name="address"
              value={profileData.address}
              onChange={handleInputChange}
              readOnly={!isEditMode}
            />
          </label>
          <label>
            Email:
            <input
              type="email"
              name="email"
              value={profileData.email}
              onChange={handleInputChange}
              readOnly={!isEditMode}
            />
          </label>
          <label>
            Birthday:
            <input
              type="date"
              name="birthday"
              value={profileData.birthday}
              onChange={handleInputChange}
              readOnly={!isEditMode}
            />
          </label>
          <label>
            Position:
            <input
              type="text"
              name="position"
              value={profileData.position}
              onChange={handleInputChange}
              readOnly={!isEditMode}
            />
          </label>
        </div>

        <div className="TellerProfile-actions">
          {isEditMode ? (
            <>
              <button onClick={handleSave} className="TellerProfile-save-btn">Save</button>
              <button onClick={handleCancel} className="TellerProfile-cancel-btn">Cancel</button>
            </>
          ) : (
            <button onClick={() => setIsEditMode(true)} className="TellerProfile-edit-btn">Edit</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TellerProfile;
