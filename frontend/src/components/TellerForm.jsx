import React, { useState, useEffect, useCallback, useMemo } from "react";

// Simple debounce function to prevent excessive state updates
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

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

  // Track input changes separately for debouncing
  const [inputValues, setInputValues] = useState({
    name: "",
    age: "",
    address: "",
    email: "",
    birthday: "",
    position: "",
    profileImage: "",
  });

  // Debounce the input values to reduce state updates
  const debouncedInputs = useDebounce(inputValues, 300);

  // Update form data when debounced inputs change
  useEffect(() => {
    setFormData(debouncedInputs);
  }, [debouncedInputs]);

  // Reset form when editing teller changes
  useEffect(() => {
    if (editingTeller) {
      const newValues = { ...editingTeller };
      setFormData(newValues);
      setInputValues(newValues);
    } else {
      const emptyForm = {
        name: "",
        age: "",
        address: "",
        email: "",
        birthday: "",
        position: "",
        profileImage: "",
      };
      setFormData(emptyForm);
      setInputValues(emptyForm);
    }
  }, [editingTeller]);

  // Memoize the empty form object to prevent recreating it
  const emptyForm = useMemo(
    () => ({
      name: "",
      age: "",
      address: "",
      email: "",
      birthday: "",
      position: "",
      profileImage: "",
    }),
    []
  );

  // Optimize event handlers with useCallback
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setInputValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      // Performance logging
      const startTime = performance.now();

      onTellerSaved(formData);

      const endTime = performance.now();
      console.log(`Form submission took ${endTime - startTime}ms`);
    },
    [formData, onTellerSaved]
  );

  const handleCancel = useCallback(() => {
    setFormData(emptyForm);
    setInputValues(emptyForm);
    if (onCancelEdit) {
      onCancelEdit();
    }
  }, [emptyForm, onCancelEdit]);

  // Memoize the form title to prevent unnecessary re-renders
  const formTitle = useMemo(
    () => (editingTeller ? "Update Teller" : "Add Teller"),
    [editingTeller]
  );

  return (
    <form onSubmit={handleSubmit} className="teller-form">
      <h2>{formTitle}</h2>
      <input
        type="text"
        name="name"
        placeholder="Name"
        value={inputValues.name}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        name="age"
        placeholder="Age"
        value={inputValues.age}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="address"
        placeholder="Address"
        value={inputValues.address}
        onChange={handleChange}
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={inputValues.email}
        onChange={handleChange}
        required
        disabled={!!editingTeller} // Prevent email changes for editing
      />
      <input
        type="date"
        name="birthday"
        value={inputValues.birthday}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="position"
        placeholder="Position"
        value={inputValues.position}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="profileImage"
        placeholder="Profile Image"
        value={inputValues.profileImage}
        onChange={handleChange}
      />
      <div className="form-buttons">
        <button type="submit" className="save-button">
          {formTitle}
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

export default React.memo(TellerForm);
