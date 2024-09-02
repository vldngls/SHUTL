import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/Intro.css'; // Ensure this path is correct

const IntroOne = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine the current page based on the URL pathname
  const path = location.pathname;
  const page = parseInt(path.replace('/intro', ''), 10) || 1;

  // Function to handle page navigation
  const goToPage = (page) => {
    navigate(`/intro${page}`);
  };

  return (
    <div className="intro-container">
      <img src="intro1.png" alt="Intro" className="intro-image" />
      <p><b>Shuttle Tracking for Camella Daang Hari</b></p>
      <p><small>Never miss your shuttle.</small></p>

      <div className="intro-footer">
        <div className="pagination-dots">
          <span
            className={`dot ${page === 1 ? 'active' : ''}`}
            onClick={() => goToPage(1)}
          />
          <span
            className={`dot ${page === 2 ? 'active' : ''}`}
            onClick={() => goToPage(2)}
          />
          <span
            className={`dot ${page === 3 ? 'active' : ''}`}
            onClick={() => goToPage(3)}
          />
        </div>
        <button
          onClick={() => {
            const nextPage = page < 3 ? page + 1 : 1; // Loop back to page 1 after page 3
            navigate(`/intro${nextPage}`);
          }}
          className="intro-button"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default IntroOne;
