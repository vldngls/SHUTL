import React, { useState, useEffect } from "react";

const UserForm = ({ onSaveUser, editingUser }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    userType: "Commuter", // Default user type
  });

  useEffect(() => {
    if (editingUser) {
      setFormData(editingUser);
    } else {
      setFormData({
        name: "",
        email: "",
        username: "",
        password: "",
        userType: "Commuter",
      });
    }
  }, [editingUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveUser(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="user-form">
      <h2>{editingUser ? "Update User" : "Add User"}</h2>
      <input
        type="text"
        name="name"
        placeholder="Name"
        value={formData.name}
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
      />
      <input
        type="text"
        name="username"
        placeholder="Username"
        value={formData.username}
        onChange={handleChange}
        required
      />
      {!editingUser && (
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
      )}
      <select
        name="userType"
        value={formData.userType}
        onChange={handleChange}
        required
      >
        <option value="Commuter">Commuter</option>
        <option value="Admin">Admin</option>
        <option value="Driver">Driver</option>
        <option value="Teller">Teller</option>
      </select>
      <button type="submit">{editingUser ? "Update User" : "Add User"}</button>
    </form>
  );
};

export default UserForm;
