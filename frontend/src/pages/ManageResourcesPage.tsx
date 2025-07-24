import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import Modal from '../components/Modal';
import ResourceForm, { type Resource } from '../components/ResourceForm';

const ManageResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const { token } = useAuth();

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

  useEffect(() => {
    if (token) {
      fetchResources();
    }
  }, [token]);

  const handleOpenModal = (resource: Resource | null = null) => {
    setEditingResource(resource);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingResource(null);
  };

  const handleSaveResource = async (resourceData: Omit<Resource, 'id'> | Resource) => {
    try {
      if ('id' in resourceData) {
        // Editing existing resource
        await axios.put(`http://localhost:3001/api/resources/${resourceData.id}`, resourceData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Creating new resource
        await axios.post('http://localhost:3001/api/resources', resourceData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchResources(); // Refresh the list
      handleCloseModal();
    } catch (err) {
      setError('Failed to save resource.');
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
        try {
            await axios.delete(`http://localhost:3001/api/resources/${resourceId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchResources(); // Refresh the list
        } catch (err) {
            setError('Failed to delete resource.');
        }
    }
  };

  if (isLoading) return <div>Loading resources...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Resources</h1>
        <button onClick={() => handleOpenModal()} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          + Add Resource
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Cost/Hour</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
            </tr>
          </thead>
          <tbody>
            {resources.map(resource => (
              <tr key={resource.id}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{resource.name}</p>
                    <p className="text-gray-600 whitespace-no-wrap text-xs">{resource.description.substring(0, 50)}...</p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{resource.location}</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{resource.costPerHour} credits</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                  <button onClick={() => handleOpenModal(resource)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                  <button onClick={() => handleDeleteResource(resource.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingResource ? 'Edit Resource' : 'Add New Resource'}>
        <ResourceForm
          resource={editingResource}
          onSave={handleSaveResource}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default ManageResourcesPage;