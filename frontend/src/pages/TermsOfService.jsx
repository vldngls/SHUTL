import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="space-y-6 text-gray-600">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Shutl's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Service Description</h2>
            <p>Shutl provides a platform connecting riders with drivers for transportation services. We do not provide transportation services directly but facilitate connections between users.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. User Responsibilities</h2>
            <p>As a user, you agree to:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Provide accurate information</li>
              <li>Maintain account security</li>
              <li>Follow platform guidelines</li>
              <li>Respect other users</li>
              <li>Pay for services promptly</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Payment Terms</h2>
            <p>Users agree to:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Pay for all services used</li>
              <li>Maintain valid payment methods</li>
              <li>Accept our pricing and fee structure</li>
              <li>Pay any applicable cancellation fees</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Safety and Security</h2>
            <p>All users must:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Follow safety guidelines</li>
              <li>Report incidents promptly</li>
              <li>Maintain appropriate insurance (for drivers)</li>
              <li>Comply with local regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Liability Limitations</h2>
            <p>Shutl is not liable for:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Actions of users</li>
              <li>Quality of third-party services</li>
              <li>Indirect or consequential damages</li>
              <li>Service interruptions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Modifications to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of our services after changes constitutes acceptance of new terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Contact Information</h2>
            <p>For questions about these Terms of Service, please contact us at:</p>
            <p className="mt-2">Email: legal@shutl.com</p>
          </section>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService; 