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
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        console.error("No authentication token found");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/userData/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          discountStatus: "APPROVED",
        }),
      });

      if (response.ok) {
        fetchUsers();
        setShowUserModal(false);
      } else {
        console.error("Failed to approve discount:", await response.text());
      }
    } catch (error) {
      console.error("Error approving discount:", error);
    }
  };

  const handleRejectDiscount = async (email) => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        console.error("No authentication token found");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/userData/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
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
      } else {
        console.error("Failed to reject discount:", await response.text());
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
    <div className="adm-account-management">
      <div className="adm-account-header">
        <h1 className="adm-account-title">Account Management</h1>
        <p className="adm-account-description">Manage user accounts, approve discount requests, and update user information.</p>
      </div>

      <div className="adm-search-bar">
        <input
          type="text"
          className="adm-search-input"
          placeholder="Search users by name, email, username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="adm-sort-buttons">
          <button
            className={`adm-sort-btn ${sortConfig.key === 'name' ? 'active' : ''}`}
            onClick={() => handleSort('name')}
          >
            Sort by Name
          </button>
          <button
            className={`adm-sort-btn ${sortConfig.key === 'userType' ? 'active' : ''}`}
            onClick={() => handleSort('userType')}
          >
            Sort by Type
          </button>
        </div>
      </div>

      <div className="adm-account-layout">
        {/* User Form */}
        <div className="adm-user-form-container">
          <h2 className="adm-form-title">{editingUser ? "Update User" : "Add New User"}</h2>
          {errorMessage && <p className="adm-form-error">{errorMessage}</p>}
          <form onSubmit={handleSaveUser}>
            <div className="adm-form-group">
              <label className="adm-form-label">Full Name</label>
              <input
                type="text"
                name="name"
                className="adm-form-input"
                placeholder="Enter full name"
                value={formData.name}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="adm-form-group">
              <label className="adm-form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="adm-form-input"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="adm-form-group">
              <label className="adm-form-label">Username</label>
              <input
                type="text"
                name="username"
                className="adm-form-input"
                placeholder="Enter username"
                value={formData.username}
                onChange={handleFormChange}
                required
              />
            </div>
            {!editingUser && (
              <div className="adm-form-group">
                <label className="adm-form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="adm-form-input"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleFormChange}
                  required
                />
              </div>
            )}
            <div className="adm-form-group">
              <label className="adm-form-label">User Type</label>
              <select
                name="userType"
                className="adm-form-select"
                value={formData.userType}
                onChange={handleFormChange}
                required
              >
                <option value="Commuter">Commuter</option>
                <option value="Admin">Admin</option>
                <option value="Driver">Driver</option>
                <option value="Teller">Teller</option>
              </select>
            </div>
            <div className="adm-form-actions">
              {editingUser && (
                <button type="button" className="adm-btn adm-btn-secondary" onClick={handleCancelEdit}>
                  Cancel
                </button>
              )}
              <button type="submit" className="adm-btn adm-btn-primary">
                {editingUser ? "Update User" : "Add User"}
              </button>
            </div>
          </form>
        </div>

        {/* Users Table */}
        <div className="adm-users-table-container">
          <h2 className="adm-table-title">User Accounts</h2>
          <div className="adm-table-container">
            <table className="adm-table">
              <thead>
                <tr>
                  <th className={sortConfig.key === 'name' ? `sort-${sortConfig.direction}` : ''} onClick={() => handleSort('name')}>Name</th>
                  <th className={sortConfig.key === 'email' ? `sort-${sortConfig.direction}` : ''} onClick={() => handleSort('email')}>Email</th>
                  <th className={sortConfig.key === 'username' ? `sort-${sortConfig.direction}` : ''} onClick={() => handleSort('username')}>Username</th>
                  <th className={sortConfig.key === 'userType' ? `sort-${sortConfig.direction}` : ''} onClick={() => handleSort('userType')}>User Type</th>
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
                      <div className="adm-table-actions">
                        <button className="adm-action-btn adm-btn-view" onClick={() => handleViewUser(user)}>View</button>
                        <button className="adm-action-btn adm-btn-edit" onClick={() => handleEditUser(user)}>Edit</button>
                        <button className="adm-action-btn adm-btn-delete" onClick={() => handleDelete(user)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="adm-pagination">
            {totalPages > 1 && (
              <>
                <button 
                  className="adm-pagination-btn" 
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  &laquo;
                </button>
                <button 
                  className="adm-pagination-btn" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  &lsaquo;
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (totalPages <= 5) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, index, array) => {
                    if (index > 0 && array[index - 1] + 1 !== page) {
                      return (
                        <React.Fragment key={`ellipsis-${page}`}>
                          <span className="adm-pagination-ellipsis">...</span>
                          <button
                            className={`adm-pagination-btn ${currentPage === page ? "active" : ""}`}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    }
                    return (
                      <button
                        key={page}
                        className={`adm-pagination-btn ${currentPage === page ? "active" : ""}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    );
                  })}

                <button 
                  className="adm-pagination-btn" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  &rsaquo;
                </button>
                <button 
                  className="adm-pagination-btn" 
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  &raquo;
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && viewingUser && (
        <div className="adm-modal-overlay">
          <div className="adm-modal">
            <div className="adm-modal-header">
              <h2 className="adm-modal-title">User Details</h2>
              <button className="adm-modal-close" onClick={() => setShowUserModal(false)}>&times;</button>
            </div>
            <div className="adm-modal-content">
              <div className="adm-user-details">
                <div className="adm-user-detail">
                  <div className="adm-detail-label">Full Name</div>
                  <div className="adm-detail-value">{viewingUser.name}</div>
                </div>
                <div className="adm-user-detail">
                  <div className="adm-detail-label">Email Address</div>
                  <div className="adm-detail-value">{viewingUser.email}</div>
                </div>
                <div className="adm-user-detail">
                  <div className="adm-detail-label">Username</div>
                  <div className="adm-detail-value">{viewingUser.username}</div>
                </div>
                <div className="adm-user-detail">
                  <div className="adm-detail-label">User Type</div>
                  <div className="adm-detail-value">{viewingUser.userType}</div>
                </div>
                <div className="adm-user-detail">
                  <div className="adm-detail-label">Discount Type</div>
                  <div className="adm-detail-value">{viewingUser.discountType || "None"}</div>
                </div>
                <div className="adm-user-detail">
                  <div className="adm-detail-label">Discount Status</div>
                  <div className="adm-detail-value">{viewingUser.discountStatus || "None"}</div>
                </div>

                {viewingUser.idImage && (
                  <div className="adm-user-detail">
                    <div className="adm-detail-label">ID Image</div>
                    <img className="adm-user-image" src={viewingUser.idImage} alt="User ID" />
                  </div>
                )}
              </div>
              
              {viewingUser.discountStatus === "PENDING" && (
                <div className="adm-discount-actions">
                  <button 
                    className="adm-btn adm-btn-primary"
                    onClick={() => handleApproveDiscount(viewingUser.email)}
                  >
                    Approve Discount
                  </button>
                  <button 
                    className="adm-btn adm-btn-danger"
                    onClick={() => handleRejectDiscount(viewingUser.email)}
                  >
                    Reject Discount
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="adm-modal-overlay">
          <div className="adm-modal">
            <div className="adm-modal-header">
              <h2 className="adm-modal-title">Confirm Delete</h2>
              <button className="adm-modal-close" onClick={cancelDelete}>&times;</button>
            </div>
            <div className="adm-modal-content">
              <p>Are you sure you want to delete user <strong>{userToDelete?.name}</strong>?</p>
              <p>This action cannot be undone.</p>
              
              <div className="adm-modal-actions">
                <button className="adm-btn adm-btn-secondary" onClick={cancelDelete}>
                  Cancel
                </button>
                <button className="adm-btn adm-btn-danger" onClick={confirmDelete}>
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
