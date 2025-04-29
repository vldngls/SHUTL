import React, { useState } from 'react';
import '../css/HelpButton.css';

const HelpButton = () => {
  const [isManualOpen, setIsManualOpen] = useState(false);

  const toggleManual = () => {
    setIsManualOpen(!isManualOpen);
  };

  return (
    <>
      <button className="help-button" onClick={toggleManual}>
        <span className="help-icon">?</span>
      </button>

      {isManualOpen && (
        <div className="manual-overlay" onClick={toggleManual}>
          <div className="manual-content" onClick={(e) => e.stopPropagation()}>
            <div className="manual-header">
              <h2>SHUTL User Manual</h2>
              <button className="close-button" onClick={toggleManual}>×</button>
            </div>
            
            <div className="manual-body">
              <section>
                <h3>Welcome to SHUTL</h3>
                <p>SHUTL is a comprehensive shuttle tracking and management system designed to make your commute easier and more efficient. This manual will guide you through all the features and functionality of the system.</p>
              </section>

              <section>
                <h3>Website Information</h3>
                <p>Website: <a href="https://shutl.justbecause.ph" target="_blank" rel="noopener noreferrer">shutl.justbecause.ph</a></p>
                <p>Contact Person: Vlyde Angeles</p>
                <p>Email: <a href="mailto:avp1102@dlsud.edu.ph">avp1102@dlsud.edu.ph</a></p>
              </section>

              <section>
                <h3>System Overview</h3>
                <p>SHUTL consists of several key components:</p>
                <ul>
                  <li><strong>Real-time Shuttle Tracking:</strong> View the current location of all active shuttles on the map with live updates.</li>
                  <li><strong>User Management:</strong> Different user roles including Commuters, Drivers, Tellers, and Administrators.</li>
                  <li><strong>Location Services:</strong> Share your location and track shuttle movements in real-time.</li>
                  <li><strong>Notification System:</strong> Receive updates about shuttle arrivals, departures, and important announcements.</li>
                  <li><strong>Payment Integration:</strong> QR code-based payment system for shuttle fares.</li>
                </ul>
              </section>

              <section>
                <h3>Features for All Users</h3>
                <ul>
                  <li><strong>Map View:</strong>
                    <ul>
                      <li>View all active shuttles on the map</li>
                      <li>Click on shuttle markers to see detailed information</li>
                      <li>View shuttle status (Moving, At Terminal, Offline)</li>
                      <li>See shuttle speed and last update time</li>
                    </ul>
                  </li>
                  <li><strong>Location Sharing:</strong>
                    <ul>
                      <li>Share your current location with the system</li>
                      <li>Help coordinate pickups and drop-offs</li>
                      <li>Enable/disable location sharing as needed</li>
                    </ul>
                  </li>
                  <li><strong>Notifications:</strong>
                    <ul>
                      <li>Receive real-time updates about shuttle movements</li>
                      <li>Get alerts about delays or schedule changes</li>
                      <li>Customize notification preferences</li>
                    </ul>
                  </li>
                </ul>
              </section>

              <section>
                <h3>Commuters Guide</h3>
                <ol>
                  <li><strong>Viewing Shuttles:</strong>
                    <ul>
                      <li>Open the map to see all active shuttles</li>
                      <li>Click on a shuttle marker to see its details</li>
                      <li>Check shuttle status and estimated arrival time</li>
                    </ul>
                  </li>
                  <li><strong>Requesting Pickup:</strong>
                    <ul>
                      <li>Select your desired shuttle</li>
                      <li>Share your location for pickup coordination</li>
                      <li>Wait for driver confirmation</li>
                    </ul>
                  </li>
                  <li><strong>Making Payments:</strong>
                    <ul>
                      <li>Access the payment QR code</li>
                      <li>Scan the code with your preferred payment app</li>
                      <li>Complete the transaction</li>
                    </ul>
                  </li>
                </ol>
              </section>

              <section>
                <h3>Drivers Guide</h3>
                <ol>
                  <li><strong>Location Updates:</strong>
                    <ul>
                      <li>Keep location sharing enabled while on duty</li>
                      <li>System automatically updates your position</li>
                      <li>Update shuttle status as needed</li>
                    </ul>
                  </li>
                  <li><strong>Pickup Management:</strong>
                    <ul>
                      <li>Receive pickup requests from commuters</li>
                      <li>View commuter locations on the map</li>
                      <li>Confirm or decline pickup requests</li>
                    </ul>
                  </li>
                </ol>
              </section>

              <section>
                <h3>Tellers Guide</h3>
                <ol>
                  <li><strong>Payment Processing:</strong>
                    <ul>
                      <li>Verify commuter payments</li>
                      <li>Process cash transactions</li>
                      <li>Generate payment receipts</li>
                    </ul>
                  </li>
                  <li><strong>Passenger Management:</strong>
                    <ul>
                      <li>Track passenger counts</li>
                      <li>Manage boarding and alighting</li>
                      <li>Update shuttle occupancy</li>
                    </ul>
                  </li>
                </ol>
              </section>

              <section>
                <h3>Administrators Guide</h3>
                <ol>
                  <li><strong>System Management:</strong>
                    <ul>
                      <li>Monitor all active shuttles</li>
                      <li>Track user activity and statistics</li>
                      <li>Manage user accounts and permissions</li>
                    </ul>
                  </li>
                  <li><strong>Reports and Analytics:</strong>
                    <ul>
                      <li>Generate usage reports</li>
                      <li>View system performance metrics</li>
                      <li>Analyze shuttle routes and efficiency</li>
                    </ul>
                  </li>
                </ol>
              </section>

              <section>
                <h3>Troubleshooting</h3>
                <ul>
                  <li><strong>Location Issues:</strong>
                    <ul>
                      <li>Ensure location services are enabled on your device</li>
                      <li>Check internet connection</li>
                      <li>Refresh the page if location is not updating</li>
                    </ul>
                  </li>
                  <li><strong>Connection Problems:</strong>
                    <ul>
                      <li>Check your internet connection</li>
                      <li>Refresh the page</li>
                      <li>Clear browser cache if issues persist</li>
                    </ul>
                  </li>
                  <li><strong>Payment Issues:</strong>
                    <ul>
                      <li>Ensure you have sufficient balance</li>
                      <li>Check your internet connection</li>
                      <li>Try scanning the QR code again</li>
                    </ul>
                  </li>
                </ul>
              </section>

              <section>
                <h3>Need Help?</h3>
                <p>If you encounter any issues or have questions, please contact our support team at the email provided above. Our team is available to assist you with any concerns regarding the SHUTL system.</p>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpButton; 