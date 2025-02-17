import React, { useState, useEffect } from "react";
import { addUser, fetchUsers, updateUser, deleteUser } from "../utils/userService";
import "../css/AccountManagement.css";

const AccountManagement = () => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    userType: "Commuter",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await fetchUsers();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    loadUsers();
  }, []);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Reset the error message before saving

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        userType: formData.userType,
      };

      if (editingUser) {
        await updateUser(editingUser._id, payload);
      } else {
        await addUser(payload);
      }

      setEditingUser(null);
      setFormData({ name: "", email: "", username: "", password: "", userType: "Commuter" });
      const updatedUsers = await fetchUsers();
      setUsers(updatedUsers);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Error saving user");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData(user);
  };

  const handleDelete = (user) => {
    setShowDeleteModal(true);
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    try {
      await deleteUser(userToDelete._id);
      const updatedUsers = users.filter((user) => user._id !== userToDelete._id);
      setUsers(updatedUsers);
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null; // Unsort
      key = null;
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = () => {
    let sorted = [...users];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sorted;
  };

  const filteredUsers = sortedUsers().filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.userType.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="account-management">
      <h1>Account Management</h1>
      <div className="form-container">
        <h2>{editingUser ? "Update User" : "Add User"}</h2>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <form onSubmit={handleSaveUser}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleFormChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleFormChange}
            required
          />
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleFormChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password || ""}
            onChange={handleFormChange}
            required
          />
          <select
            name="userType"
            value={formData.userType}
            onChange={handleFormChange}
            required
          >
            <option value="Commuter">Commuter</option>
            <option value="Admin">Admin</option>
            <option value="Driver">Driver</option>
            <option value="Teller">Teller</option>
          </select>
          <button type="submit">{editingUser ? "Update User" : "Add User"}</button>
        </form>
      </div>

      <div className="list-container">
        <h2>User List</h2>
        <input
          className="search-input"
          type="text"
          placeholder="Search..."
          value={search}
          onChange={handleSearchChange}
        />
        <div className="sort-buttons">
          {["name", "email", "username", "userType"].map((key) => (
            <button
              key={key}
              onClick={() => handleSort(key)}
              className={sortConfig.key === key ? "active-sort" : ""}
            >
              Sort by {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Username</th>
              <th>User Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.username}</td>
                <td>{user.userType}</td>
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(user)}>
                    Edit
                  </button>
                  <button className="delete-button" onClick={() => handleDelete(user)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              className={`pagination-btn ${currentPage === index + 1 ? "active" : ""}`}
              onClick={() => handlePageChange(index + 1)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Confirm Delete</h2>
            <p>
              Are you sure you want to delete <strong>{userToDelete.name}</strong>?
            </p>
            <div className="modal-buttons">
              <button onClick={confirmDelete}>Yes, Delete</button>
              <button onClick={cancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
