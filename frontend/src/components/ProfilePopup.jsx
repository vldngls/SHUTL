import React, { useRef, useEffect } from 'react';
import '../css/ProfilePopup.css'; // Ensure this path is correct

const ProfilePopup = ({ onClose }) => {
  const popupRef = useRef(null);

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

  // Placeholder user data
  const placeholderUser = {
    name: "John Doe",
    profilePicture: "https://via.placeholder.com/150",
    birthday: "January 1, 1990",
    address: "123 Main St, Anytown, USA",
    discount: "10%",
    paymentMethod: "Credit Card",
    email: "john.doe@example.com",
    contact: "+1 (555) 123-4567",
    transactions: [
      { details: "Trip from A to B", time: "2023-04-15 14:30" },
      { details: "Trip from C to D", time: "2023-04-14 09:15" },
      { details: "Trip from E to F", time: "2023-04-13 18:45" },
    ]
  };

  return (
    <div className="profile-popup">
      <div ref={popupRef} className="profile-popup-content">
        {/* Profile Header Section */}
        <div className="profile-header">
          <img src={placeholderUser.profilePicture} alt="User Profile" className="profile-picture" />
          <div className="profile-info">
            <h2>{placeholderUser.name}</h2>
            <button className="edit-profile-btn">Edit User Profile</button>
          </div>
        </div>

        {/* User Details Section */}
        <div className="user-details">
          <p><strong>Birthday:</strong> {placeholderUser.birthday}</p>
          <p><strong>Address:</strong> {placeholderUser.address}</p>
          <p><strong>Discount:</strong> {placeholderUser.discount}</p>
          <p><strong>Payment Method:</strong> {placeholderUser.paymentMethod}</p>
          <p><strong>Email:</strong> {placeholderUser.email}</p>
          <p><strong>Contact:</strong> {placeholderUser.contact}</p>
        </div>

        {/* Transaction History Section */}
        <div className="transaction-history">
          <h3>Transaction history</h3>
          {placeholderUser.transactions.map((transaction, index) => (
            <div key={index} className="transaction-item">
              <div className="transaction-icon">🚗</div>
              <div className="transaction-details">
                <p>{transaction.details}</p>
                <span>{transaction.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePopup;
