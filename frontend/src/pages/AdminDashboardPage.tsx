import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

// Interface for pending admin account requests
interface PendingAdmin {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
}

// Interface for pending credit requests
interface PendingCreditRequest {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

const AdminDashboardPage: React.FC = () => {
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([]);
  const [pendingCredits, setPendingCredits] = useState<PendingCreditRequest[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { token } = useAuth();

  const fetchPendingRequests = async () => {
    if (!token) return;
    try {
      const [adminRes, creditRes] = await Promise.all([
        axios.get('http://localhost:3001/api/admin/pending-approvals', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:3001/api/admin/credit-requests', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setPendingAdmins(adminRes.data);
      setPendingCredits(creditRes.data);
    } catch (err) {
      setError('Failed to fetch pending requests.');
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, [token]);

  const handleAdminApprove = async (userId: string) => {
    try {
      const res = await axios.post(`http://localhost:3001/api/admin/approve-request/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(res.data.message);
      setPendingAdmins(pendingAdmins.filter(admin => admin.id !== userId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve admin request.');
    }
  };

  const handleCreditRequest = async (requestId: string, action: 'approve' | 'deny') => {
    try {
      const res = await axios.post(`http://localhost:3001/api/admin/credit-requests/${requestId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(`Request has been ${action}d.`);
      setPendingCredits(pendingCredits.filter(req => req.id !== requestId));
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} request.`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">{message}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">{error}</div>}

      {/* Pending Admin Approvals Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Pending Admin Approvals</h2>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Requested On</th>
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
                      <button onClick={() => handleAdminApprove(admin.id)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs">Approve</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="text-center py-10 text-gray-500">No pending admin requests.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Pending Credit Requests Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Pending Credit Requests</h2>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Reason</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
              </tr>
            </thead>
            <tbody>
              {pendingCredits.length > 0 ? (
                pendingCredits.map(req => (
                  <tr key={req.id}>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{req.user.name || req.user.email}</td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{req.amount}</td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{req.reason}</td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right space-x-2">
                      <button onClick={() => handleCreditRequest(req.id, 'approve')} className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs">Approve</button>
                      <button onClick={() => handleCreditRequest(req.id, 'deny')} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs">Deny</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="text-center py-10 text-gray-500">No pending credit requests.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;