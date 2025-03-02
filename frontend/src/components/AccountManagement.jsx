import React, { useState, useEffect } from "react";
import {
  addUser,
  fetchUsers,
  updateUser,
  deleteUser,
} from "../utils/userService";
import "../css/AccountManagement.css";

const AccountManagement = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    userType: "Commuter",
  });
  const [editingUser, setEditingUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingUser, setViewingUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) =>
      Object.values(user).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/all`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setErrorMessage("Failed to fetch users");
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const url = editingUser
        ? `${API_BASE_URL}/users/update/${editingUser._id}`
        : `${API_BASE_URL}/users/register`;

      const response = await fetch(url, {
        method: editingUser ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchUsers();
        setFormData({
          name: "",
          email: "",
          username: "",
          password: "",
          userType: "Commuter",
        });
        setEditingUser(null);
        setErrorMessage("");
      } else {
        const error = await response.json();
        setErrorMessage(error.message);
      }
    } catch (error) {
      console.error("Error saving user:", error);
      setErrorMessage("Failed to save user");
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      username: user.username,
      userType: user.userType,
    });
  };

  const handleViewUser = async (user) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/userData/find?email=${user.email}`
      );
      if (response.ok) {
        const userData = await response.json();
        setViewingUser({ ...user, ...userData });
        setShowUserModal(true);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleApproveDiscount = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/userData/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          discountStatus: "APPROVED",
        }),
      });

      if (response.ok) {
        fetchUsers();
        setShowUserModal(false);
      }
    } catch (error) {
      console.error("Error approving discount:", error);
    }
  };

  const handleRejectDiscount = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/userData/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          discountStatus: "REJECTED",
          discountType: "REGULAR",
          discount: 0,
        }),
      });

      if (response.ok) {
        fetchUsers();
        setShowUserModal(false);
      }
    } catch (error) {
      console.error("Error rejecting discount:", error);
    }
  };

  const handleDelete = (user) => {
    setShowDeleteModal(true);
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    try {
      await deleteUser(userToDelete._id);
      const updatedUsers = users.filter(
        (user) => user._id !== userToDelete._id
      );
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
    let sorted = [...filteredUsers];
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

  const paginatedUsers = sortedUsers().slice(
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

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* User Form */}
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
          {!editingUser && (
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleFormChange}
              required
            />
          )}
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
          <button type="submit">
            {editingUser ? "Update User" : "Add User"}
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="users-table">
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
                  <button onClick={() => handleViewUser(user)}>View</button>
                  <button onClick={() => handleEditUser(user)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={currentPage === page ? "active" : ""}
          >
            {page}
          </button>
        ))}
      </div>

      {/* User Details Modal */}
      {showUserModal && viewingUser && (
        <div className="modal">
          <div className="modal-content">
            <h2>User Details</h2>
            <div className="user-details">
              <p>
                <strong>Name:</strong> {viewingUser.name}
              </p>
              <p>
                <strong>Email:</strong> {viewingUser.email}
              </p>
              <p>
                <strong>Username:</strong> {viewingUser.username}
              </p>
              <p>
                <strong>User Type:</strong> {viewingUser.userType}
              </p>
              <p>
                <strong>Discount Type:</strong> {viewingUser.discountType}
              </p>
              <p>
                <strong>Discount Status:</strong> {viewingUser.discountStatus}
              </p>
              {viewingUser.discountType !== "REGULAR" &&
                viewingUser.idPicture && (
                  <div>
                    <p>
                      <strong>ID Picture:</strong>
                    </p>
                    <img
                      src={viewingUser.idPicture}
                      alt="ID"
                      style={{ maxWidth: "300px" }}
                    />
                  </div>
                )}
              {viewingUser.discountType !== "REGULAR" &&
                viewingUser.discountStatus === "PENDING" && (
                  <div className="discount-actions">
                    <button
                      onClick={() => handleApproveDiscount(viewingUser.email)}
                    >
                      Approve Discount
                    </button>
                    <button
                      onClick={() => handleRejectDiscount(viewingUser.email)}
                    >
                      Reject Discount
                    </button>
                  </div>
                )}
            </div>
            <button onClick={() => setShowUserModal(false)}>Close</button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Confirm Delete</h2>
            <p>
              Are you sure you want to delete{" "}
              <strong>{userToDelete.name}</strong>?
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
