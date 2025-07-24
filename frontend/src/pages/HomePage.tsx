import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';

interface MyBooking {
  id: string;
  startTime: string;
  endTime: string;
  resource: {
    name: string;
    location: string | null;
  };
}

const HomePage: React.FC = () => {
  const { user, token } = useAuth();
  const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
      })
      .finally(() => {
        setIsLoading(false);
      });
    }
  }, [user, token]);

  return (
    <div>
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h1 className="text-4xl font-bold">Welcome to the Makerspace Scheduler</h1>
        <p className="mt-2 text-lg text-gray-600">Your central hub for booking and managing resources.</p>
      </div>

      {user && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Upcoming Bookings</h2>
          {isLoading ? (
            <p>Loading your bookings...</p>
          ) : myBookings.length > 0 ? (
            <div className="space-y-4">
              {myBookings.map(booking => (
                <div key={booking.id} className="bg-white p-4 rounded-lg shadow">
                  <p className="font-bold text-lg text-blue-600">{booking.resource.name}</p>
                  <p className="text-sm text-gray-500">{booking.resource.location}</p>
                  <p className="mt-2 text-gray-800">
                    {format(new Date(booking.startTime), 'EEE, MMM d, yyyy')}
                  </p>
                  <p className="text-gray-800">
                    {format(new Date(booking.startTime), 'p')} - {format(new Date(booking.endTime), 'p')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>You have no upcoming bookings.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;