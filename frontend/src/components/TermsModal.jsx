import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const TermsModal = ({ content, onClose }) => {
  const modalRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="modal-overlay">
      <div className="modal-content" ref={modalRef}>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        {content}
      </div>
    </div>
  );
};

TermsModal.propTypes = {
  content: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TermsModal; 