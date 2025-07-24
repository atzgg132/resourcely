import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { type Resource } from '../components/ResourceForm';

const BookingPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/resources', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResources(response.data);
      } catch (err) {
        setError('Failed to fetch resources.');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchResources();
    }
  }, [token]);

  if (isLoading) return <div>Loading available resources...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Book a Resource</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map(resource => (
          <Link to={`/book/${resource.id}`} key={resource.id} className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">{resource.name}</h5>
            <p className="font-normal text-gray-700">{resource.description}</p>
            <p className="mt-4 text-sm text-blue-600 font-semibold">{resource.costPerHour} credits / hour</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BookingPage;