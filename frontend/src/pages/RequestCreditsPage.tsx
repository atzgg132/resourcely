import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const RequestCreditsPage: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await axios.post('http://localhost:3001/api/requests/credit', 
        { amount: parseInt(amount), reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Your request has been submitted successfully!');
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit request.');
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Request More Credits</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
        {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{message}</div>}
        <div className="mb-4">
          <label htmlFor="amount" className="block text-gray-700 font-bold mb-2">Amount</label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3"
            placeholder="e.g., 500"
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="reason" className="block text-gray-700 font-bold mb-2">Reason</label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 h-32"
            placeholder="e.g., For final year project materials"
            required
          />
        </div>
        {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Submit Request
        </button>
      </form>
    </div>
  );
};

export default RequestCreditsPage;
