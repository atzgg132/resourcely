import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import Modal from '../components/Modal'; // Import the Modal component

interface MyBooking {
  id: string;
  startTime: string;
  endTime: string;
  creditsDeducted: number;
  resource: {
    name: string;
    location: string | null;
  };
}

const HomePage: React.FC = () => {
  const { user, token, login } = useAuth();
  const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // State for the cancellation modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<MyBooking | null>(null);

  const fetchMyBookings = () => {
    if (user && token) {
      setIsLoading(true);
      axios.get('http://localhost:3001/api/bookings/my-bookings', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => {
        setMyBookings(response.data);
      })
      .catch(error => {
        console.error("Failed to fetch user's bookings", error);
        setError("Could not load your bookings.");
      })
      .finally(() => {
        setIsLoading(false);
      });
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, [user, token]);
  
  const openCancelModal = (booking: MyBooking) => {
    setBookingToCancel(booking);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel || !user || !token) return;

    try {
      await axios.delete(`http://localhost:3001/api/bookings/${bookingToCancel.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const updatedUser = { ...user, creditBalance: user.creditBalance + bookingToCancel.creditsDeducted };
      login(token, updatedUser);

      fetchMyBookings();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setIsCancelModalOpen(false);
      setBookingToCancel(null);
    }
  };

  return (
    <div>
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h1 className="text-4xl font-bold">Welcome to the Makerspace Scheduler</h1>
        <p className="mt-2 text-lg text-gray-600">Your central hub for booking and managing resources.</p>
      </div>

      {user && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Upcoming Bookings</h2>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {isLoading ? (
            <p>Loading your bookings...</p>
          ) : myBookings.length > 0 ? (
            <div className="space-y-4">
              {myBookings.map(booking => (
                <div key={booking.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                  <div>
                    <p className="font-bold text-lg text-blue-600">{booking.resource.name}</p>
                    <p className="text-sm text-gray-500">{booking.resource.location}</p>
                    <p className="mt-2 text-gray-800">
                      {format(new Date(booking.startTime), 'EEE, MMM d, yyyy')}
                    </p>
                    <p className="text-gray-800">
                      {format(new Date(booking.startTime), 'p')} - {format(new Date(booking.endTime), 'p')}
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => openCancelModal(booking)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>You have no upcoming bookings.</p>
          )}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="Confirm Cancellation">
        {bookingToCancel && (
          <div>
            <p>Are you sure you want to cancel your booking for the <strong>{bookingToCancel.resource.name}</strong>?</p>
            <p className="text-sm text-gray-600 mt-2">
              This will refund {bookingToCancel.creditsDeducted} credits to your account.
            </p>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setIsCancelModalOpen(false)} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Go Back</button>
              <button onClick={handleConfirmCancel} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Confirm Cancellation</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HomePage;
