import React, { useState, useEffect } from "react";

const TellerForm = ({ onTellerSaved, editingTeller, onCancelEdit }) => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    address: "",
    email: "",
    birthday: "",
    position: "",
    profileImage: "",
  });

  useEffect(() => {
    if (editingTeller) {
      setFormData(editingTeller);
    } else {
      setFormData({
        name: "",
        age: "",
        address: "",
        email: "",
        birthday: "",
        position: "",
        profileImage: "",
      });
    }
  }, [editingTeller]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onTellerSaved(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      age: "",
      address: "",
      email: "",
      birthday: "",
      position: "",
      profileImage: "",
    });
    if (onCancelEdit) {
      onCancelEdit(); // Notify parent component to stop editing
    }
  };

  return (
    <form onSubmit={handleSubmit} className="teller-form">
      <h2>{editingTeller ? "Update Teller" : "Add Teller"}</h2>
      <input
        type="text"
        name="name"
        placeholder="Name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        name="age"
        placeholder="Age"
        value={formData.age}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="address"
        placeholder="Address"
        value={formData.address}
        onChange={handleChange}
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
        disabled={!!editingTeller} // Prevent email changes for editing
      />
      <input
        type="date"
        name="birthday"
        value={formData.birthday}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="position"
        placeholder="Position"
        value={formData.position}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="profileImage"
        placeholder="Profile Image"
        value={formData.profileImage}
        onChange={handleChange}
      />
      <div className="form-buttons">
        <button type="submit" className="save-button">
          {editingTeller ? "Update Teller" : "Add Teller"}
        </button>
        {editingTeller && (
          <button type="button" className="reset-button" onClick={handleCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default TellerForm;
