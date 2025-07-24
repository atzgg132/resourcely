import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

interface PendingAdmin {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
}

const AdminDashboardPage: React.FC = () => {
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    const fetchPendingAdmins = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/admin/pending-approvals', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPendingAdmins(response.data);
      } catch (err) {
        setError('Failed to fetch pending requests.');
      }
    };

    if (token) {
      fetchPendingAdmins();
    }
  }, [token]);

  const handleApprove = async (userId: string) => {
    setMessage('');
    setError('');
    try {
      const response = await axios.post(`http://localhost:3001/api/admin/approve-request/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(response.data.message);
      // Refetch the list by removing the approved user
      setPendingAdmins(pendingAdmins.filter(admin => admin.id !== userId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve request.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <h2 className="text-2xl font-semibold mb-4">Pending Admin Approvals</h2>
      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{message}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Requested On</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
            </tr>
          </thead>
          <tbody>
            {pendingAdmins.length > 0 ? (
              pendingAdmins.map(admin => (
                <tr key={admin.id}>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{admin.name}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{admin.email}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{new Date(admin.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                    <button
                      onClick={() => handleApprove(admin.id)}
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-500">No pending requests.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboardPage;