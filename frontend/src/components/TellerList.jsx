import React from "react";

const TellerList = ({ tellers, onEditTeller, onDeleteTeller }) => {
  return (
    <div className="teller-list">
      <h2>Teller List</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Position</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tellers.map((teller) => (
            <tr key={teller._id}>
              <td>{teller.name}</td>
              <td>{teller.position}</td>
              <td>{teller.email}</td>
              <td>
                <button
                  className="edit-button"
                  onClick={() => onEditTeller(teller)}
                >
                  Edit
                </button>
                <button
  className="delete-button"
  onClick={() => {
    console.log(`Deleting teller with ID: ${teller._id}`);
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${teller.name}?`
    );
    if (confirmDelete) {
      onDeleteTeller(teller._id);
    }
  }}
>
  Delete
</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TellerList;
