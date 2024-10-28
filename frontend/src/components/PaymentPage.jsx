import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

const PaymentPage = () => {
  const { userId } = useParams();
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  const handlePaymentSelection = (method) => {
    setPaymentMethod(method);
  };

  const handleReferenceChange = (e) => {
    setReferenceNumber(e.target.value);
  };

  // Updated handleSubmit function to send data to the backend
  const handleSubmit = async () => {
    const transactionData = {
      userId,
      paymentMethod,
      referenceNumber,
    };

    try {
      const response = await fetch('/api/transactions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (response.ok) {
        alert('Transaction recorded successfully');
      } else {
        const errorData = await response.json();
        alert(`Error recording transaction: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error submitting transaction:', error);
      alert('Network error while recording transaction');
    }
  };

  return (
    <div>
      <h3>User ID: {userId}</h3>
      <h4>Pick a payment method</h4>
      <button onClick={() => handlePaymentSelection('Cash')}>Cash</button>
      <button onClick={() => handlePaymentSelection('GCASH')}>GCASH</button>

      {paymentMethod === 'Cash' && (
        <div>
          <h5>Enter Cash Amount</h5>
          <input type="number" placeholder="Amount" />
        </div>
      )}

      {paymentMethod === 'GCASH' && (
        <div>
          <h5>Enter GCASH Reference Number</h5>
          <input
            type="text"
            placeholder="Reference Number"
            value={referenceNumber}
            onChange={handleReferenceChange}
          />
        </div>
      )}

      <button onClick={handleSubmit}>Confirm Payment</button>
    </div>
  );
};

export default PaymentPage;
