import React, { useMemo } from "react";
import { FixedSizeList as List } from "react-window";

const TellerList = ({ tellers, onEditTeller, onDeleteTeller }) => {
  // Memoize the row renderer to prevent unnecessary re-renders
  const Row = useMemo(() => {
    return ({ index, style }) => {
      const teller = tellers[index];
      return (
        <div
          style={{ ...style, display: "flex", borderBottom: "1px solid #eee" }}
        >
          <div style={{ flex: 1, padding: "8px" }}>{teller.name}</div>
          <div style={{ flex: 1, padding: "8px" }}>{teller.position}</div>
          <div style={{ flex: 1, padding: "8px" }}>{teller.email}</div>
          <div style={{ flex: 1, padding: "8px", display: "flex", gap: "8px" }}>
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
          </div>
        </div>
      );
    };
  }, [tellers, onEditTeller, onDeleteTeller]);

  // Calculate list height based on number of items (with a maximum)
  const listHeight = useMemo(() => {
    const rowHeight = 50;
    const maxVisibleRows = 10;
    return Math.min(tellers.length * rowHeight, maxVisibleRows * rowHeight);
  }, [tellers.length]);

  return (
    <div className="teller-list">
      <h2>Teller List</h2>

      <div
        className="teller-list-header"
        style={{
          display: "flex",
          fontWeight: "bold",
          borderBottom: "2px solid #ddd",
          padding: "8px 0",
        }}
      >
        <div style={{ flex: 1, padding: "8px" }}>Name</div>
        <div style={{ flex: 1, padding: "8px" }}>Position</div>
        <div style={{ flex: 1, padding: "8px" }}>Email</div>
        <div style={{ flex: 1, padding: "8px" }}>Actions</div>
      </div>

      {tellers.length > 0 ? (
        <List
          height={listHeight}
          itemCount={tellers.length}
          itemSize={50}
          width="100%"
          overscanCount={5} // Render extra items for smoother scrolling
        >
          {Row}
        </List>
      ) : (
        <div style={{ padding: "16px", textAlign: "center" }}>
          No tellers found
        </div>
      )}
    </div>
  );
};

export default TellerList;
