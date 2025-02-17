import React from "react";

const UserList = ({ users, onEditUser, onDeleteUser }) => {
  return (
    <div className="user-list">
      <h2>User List</h2>
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
          {users.map((user) => (
            <tr key={user._id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.username}</td>
              <td>{user.userType}</td>
              <td>
                <button onClick={() => onEditUser(user)}>Edit</button>
                <button onClick={() => onDeleteUser(user._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;
