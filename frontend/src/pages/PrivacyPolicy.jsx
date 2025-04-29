import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="terms-content">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
      
      <div className="space-y-4 text-gray-600">
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">1. Information We Collect</h2>
          <p>We collect information that you provide directly to us, including:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Name and contact information</li>
            <li>Account credentials</li>
            <li>Payment information</li>
            <li>Location data (for ride services)</li>
            <li>Device information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">2. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Provide and improve our services</li>
            <li>Process your transactions</li>
            <li>Send you updates and notifications</li>
            <li>Ensure platform security</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">3. Information Sharing</h2>
          <p>We may share your information with:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Service providers and partners</li>
            <li>Other users (as needed for ride services)</li>
            <li>Law enforcement (when required)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">4. Data Security</h2>
          <p>We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or destruction.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Access your personal data</li>
            <li>Request corrections</li>
            <li>Delete your account</li>
            <li>Opt-out of marketing communications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">6. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at:</p>
          <p className="mt-2">Email: privacy@shutl.com</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 