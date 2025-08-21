import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { format, addMonths, subMonths, startOfDay, endOfDay, eachDayOfInterval, startOfMonth, endOfMonth, getDay, isEqual, addMinutes, startOfWeek, endOfWeek } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { type Resource } from '../components/ResourceForm';
import Modal from '../components/Modal';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ResourceDetailPage: React.FC = () => {
  const { resourceId } = useParams<{ resourceId: string }>();
  const [resource, setResource] = useState<Resource | null>(null);
  const [bookings, setBookings] = useState<{ start: Date; end: Date }[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // New state for success messages
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const { token, user, login } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  useEffect(() => {
    const fetchResourceDetails = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/resources', { headers: { Authorization: `Bearer ${token}` } });
        const foundResource = response.data.find((r: Resource) => r.id === resourceId);
        setResource(foundResource);
      } catch (err) { setError('Failed to fetch resource details.'); }
    };
    if (token) fetchResourceDetails();
  }, [resourceId, token]);

  useEffect(() => {
    const fetchBookingsForDay = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/bookings/resource/${resourceId}`, {
          params: { start: startOfDay(selectedDate).toISOString(), end: endOfDay(selectedDate).toISOString() },
          headers: { Authorization: `Bearer ${token}` },
        });
        setBookings(response.data.map((b: any) => ({ start: new Date(b.startTime), end: new Date(b.endTime) })));
      } catch (err) { setError('Failed to fetch bookings.'); }
    };
    if (token && resourceId) {
        setSelectionStart(null);
        fetchBookingsForDay();
    }
  }, [selectedDate, resourceId, token]);

  const daysInMonth = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const timeSlots = useMemo(() => {
    if (!resource) return [];
    const slots = [];
    const dayStart = new Date(startOfDay(selectedDate));
    dayStart.setMinutes(resource.operatingHoursStart);
    
    const dayEnd = new Date(startOfDay(selectedDate));
    dayEnd.setMinutes(resource.operatingHoursEnd);

    let currentTime = new Date(dayStart);
    while (currentTime < dayEnd) {
      slots.push(new Date(currentTime));
      currentTime = addMinutes(currentTime, resource.minBookingMinutes);
    }
    return slots;
  }, [selectedDate, resource]);
  
  const isRangeValid = (start: Date, end: Date) => {
    return !bookings.some(b => start < b.end && end > b.start);
  };

  const handleSlotClick = (slot: Date) => {
    if (!selectionStart) {
      setSelectionStart(slot);
    } else {
      const start = selectionStart < slot ? selectionStart : slot;
      const end = addMinutes(selectionStart < slot ? slot : selectionStart, resource!.minBookingMinutes);

      if (isRangeValid(start, end)) {
        setSelectedSlot({ start, end });
        setIsModalOpen(true);
      } else {
        setError("Invalid selection: This range overlaps with an existing booking.");
        setSelectionStart(null);
      }
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !resource || !user) return;
    try {
      const response = await axios.post('http://localhost:3001/api/bookings', {
        resourceId,
        startTime: selectedSlot.start.toISOString(),
        endTime: selectedSlot.end.toISOString(),
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (!isAdmin) {
        const updatedUser = { ...user, creditBalance: user.creditBalance - response.data.creditsDeducted };
        login(token!, updatedUser);
      }
      setIsModalOpen(false);
      setSelectedSlot(null);
      setSelectionStart(null);
      const fetchBookingsForDay = async () => {
        const res = await axios.get(`http://localhost:3001/api/bookings/resource/${resourceId}`, {
          params: { start: startOfDay(selectedDate).toISOString(), end: endOfDay(selectedDate).toISOString() },
          headers: { Authorization: `Bearer ${token}` },
        });
        setBookings(res.data.map((b: any) => ({ start: new Date(b.startTime), end: new Date(b.endTime) })));
      };
      fetchBookingsForDay();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking.');
      setIsModalOpen(false);
    }
  };

  // --- NEW FUNCTION for joining the waitlist ---
  const handleJoinWaitlist = async (slot: Date) => {
    setMessage('');
    setError('');
    try {
      const response = await axios.post('http://localhost:3001/api/requests/waitlist', {
        resourceId,
        slotStartTime: slot.toISOString(),
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join waitlist.');
    }
  };


  const bookingCost = resource && selectedSlot ? Math.ceil(((selectedSlot.end.getTime() - selectedSlot.start.getTime()) / (1000 * 60 * 60)) * resource.costPerHour) : 0;
  const isBookingDisabled = !isAdmin && (!user || user.creditBalance < bookingCost);

  if (!resource) return <div>Loading resource details...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold">{resource.name}</h1>
      <p className="text-lg text-gray-600 mb-6">{resource.description}</p>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4" onClick={() => setError('')}>{error}</div>}
      {message && <div className="bg-blue-100 text-blue-700 p-3 rounded mb-4" onClick={() => setMessage('')}>{message}</div>}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Date Picker (No changes here) */}
        <div className="w-full md:w-1/3">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>&lt;</button>
              <h3 className="font-semibold">{format(currentMonth, 'MMMM yyyy')}</h3>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
              {WEEKDAYS.map(day => <div key={day} className="font-bold text-xs text-gray-500">{day}</div>)}
              {daysInMonth.map(day => {
                const isToday = isEqual(startOfDay(day), startOfDay(new Date()));
                const isSelected = isEqual(startOfDay(day), selectedDate);
                const isPast = day < startOfDay(new Date());
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                return (
                  <button
                    key={day.toString()}
                    disabled={isPast}
                    onClick={() => setSelectedDate(startOfDay(day))}
                    className={`p-2 rounded-full text-sm ${isPast ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-blue-100'} ${isSelected ? 'bg-blue-500 text-white' : ''} ${isToday && !isSelected ? 'border border-blue-500' : ''} ${!isCurrentMonth ? 'text-gray-300' : ''}`}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Time Slots (UPDATED LOGIC) */}
        <div className="w-full md:w-2/3">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-xl font-semibold">
                {selectionStart ? 'Select an End Time' : `Available Slots for ${format(selectedDate, 'PPP')}`}
             </h3>
             {selectionStart && <button onClick={() => setSelectionStart(null)} className="text-sm bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600">Cancel Selection</button>}
           </div>
           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {timeSlots.map(slot => {
              const isBooked = bookings.some(b => slot >= b.start && slot < b.end);
              const isPast = slot < new Date();
              const isSelectionStart = !!(selectionStart && isEqual(slot, selectionStart));
              const isInSelectionRange = !!(selectionStart && slot > selectionStart);
              
              // A slot is only truly disabled for selection if it's in the past or part of an invalid range.
              // A booked slot can still be interacted with (to join waitlist).
              const isSelectionDisabled = isPast || (isInSelectionRange && !isRangeValid(selectionStart, addMinutes(slot, resource.minBookingMinutes)));

              if (isBooked) {
                return (
                  <button 
                    key={slot.toString()}
                    onClick={() => handleJoinWaitlist(slot)}
                    className={`p-2 rounded-md text-sm font-semibold transition-colors bg-gray-200 text-gray-500 hover:bg-yellow-200 hover:text-yellow-800`}
                    title="Join Waitlist"
                  >
                    {format(slot, 'p')}
                  </button>
                )
              }

              return (
                <button 
                  key={slot.toString()}
                  disabled={isSelectionDisabled}
                  onClick={() => handleSlotClick(slot)}
                  className={`p-2 rounded-md text-sm font-semibold transition-colors ${isSelectionDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : isSelectionStart ? 'bg-indigo-500 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                >
                  {format(slot, 'p')}
                </button>
              )
            })}
           </div>
        </div>
      </div>

      {/* Modal (No changes here) */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectionStart(null); }} title="Confirm Booking">
        {selectedSlot && (
          <div>
            <p><strong>Resource:</strong> {resource.name}</p>
            <p><strong>From:</strong> {format(selectedSlot.start, 'PPP p')}</p>
            <p><strong>To:</strong> {format(selectedSlot.end, 'PPP p')}</p>
            <hr className="my-4" />
            <p className="text-lg font-semibold">Cost: {isAdmin ? '0 (Admin)' : `${bookingCost} credits`}</p>
            {!isAdmin && <p className="text-sm text-gray-600">Your balance: {user?.creditBalance} credits</p>}
            {isBookingDisabled && <p className="text-red-500 font-bold mt-2">You have insufficient credits for this booking.</p>}
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => { setIsModalOpen(false); setSelectionStart(null); }} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancel</button>
              <button onClick={handleConfirmBooking} disabled={isBookingDisabled} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">Confirm</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ResourceDetailPage;