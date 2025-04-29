import React from 'react';
import PropTypes from 'prop-types';

const TermsModal = ({ content, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
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