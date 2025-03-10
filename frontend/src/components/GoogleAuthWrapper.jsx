import React from 'react';
import PropTypes from 'prop-types';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GoogleAuthWrapper = ({ children }) => {
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const currentOrigin = window.location.origin;

  if (!GOOGLE_CLIENT_ID) {
    console.error('Google Client ID is not configured in environment variables');
    return null;
  }

  return (
    <GoogleOAuthProvider 
      clientId={GOOGLE_CLIENT_ID}
      onScriptLoadError={(err) => {
        console.error('Google Sign In script failed to load:', err);
        console.log('Current URL:', window.location.href);
        console.log('Current Origin:', currentOrigin);
        console.log('Client ID:', GOOGLE_CLIENT_ID);
        console.log('Browser:', navigator.userAgent);
        console.log('Cookies Enabled:', navigator.cookieEnabled);
        console.log('Third-Party Cookies:', document.cookie.includes('_ga') ? 'Enabled' : 'Disabled/Unknown');
      }}
      onScriptLoadSuccess={() => {
        console.log('Google Sign In script loaded successfully');
        console.log('Current URL:', window.location.href);
        console.log('Current Origin:', currentOrigin);
      }}
    >
      {children}
    </GoogleOAuthProvider>
  );
};

GoogleAuthWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

export default GoogleAuthWrapper; 