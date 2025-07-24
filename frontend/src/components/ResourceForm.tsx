import React, { useState, useEffect } from 'react';

export interface Resource {
  id: string;
  name: string;
  description: string;
  location: string | null;
  costPerHour: number;
  minBookingMinutes: number;
  maxBookingMinutes: number;
  operatingHoursStart: number; // In minutes from midnight
  operatingHoursEnd: number; // In minutes from midnight
}

interface ResourceFormProps {
  resource?: Resource | null;
  onSave: (resource: Omit<Resource, 'id'> | Resource) => void;
  onCancel: () => void;
}

// Helper to generate time options for select dropdowns
const generateTimeOptions = () => {
    const options = [];
    for (let i = 0; i < 24; i++) {
        options.push({ value: i * 60, label: `${i.toString().padStart(2, '0')}:00` });
        options.push({ value: i * 60 + 30, label: `${i.toString().padStart(2, '0')}:30` });
    }
    return options;
};
const timeOptions = generateTimeOptions();


const ResourceForm: React.FC<ResourceFormProps> = ({ resource, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    costPerHour: 0,
    minBookingMinutes: 30,
    maxBookingMinutes: 240,
    operatingHoursStart: 480, // 8 AM
    operatingHoursEnd: 1320, // 10 PM
  });

  useEffect(() => {
    if (resource) {
      setFormData({
        name: resource.name,
        description: resource.description,
        location: resource.location || '',
        costPerHour: resource.costPerHour,
        minBookingMinutes: resource.minBookingMinutes,
        maxBookingMinutes: resource.maxBookingMinutes,
        operatingHoursStart: resource.operatingHoursStart,
        operatingHoursEnd: resource.operatingHoursEnd,
      });
    } else {
       setFormData({
        name: '', description: '', location: '', costPerHour: 0,
        minBookingMinutes: 30, maxBookingMinutes: 240,
        operatingHoursStart: 480, operatingHoursEnd: 1320,
      });
    }
  }, [resource]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(resource ? { ...resource, ...formData } : formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4"><label className="block text-gray-700 text-sm font-bold mb-2">Name</label><input name="name" value={formData.name} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3" required /></div>
      <div className="mb-4"><label className="block text-gray-700 text-sm font-bold mb-2">Description</label><textarea name="description" value={formData.description} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3" required /></div>
      <div className="mb-4"><label className="block text-gray-700 text-sm font-bold mb-2">Location</label><input name="location" value={formData.location} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3" /></div>
      <div className="mb-4"><label className="block text-gray-700 text-sm font-bold mb-2">Cost Per Hour (Credits)</label><input name="costPerHour" type="number" value={formData.costPerHour} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3" required /></div>
      <div className="flex gap-4 mb-4">
        <div className="w-1/2"><label className="block text-gray-700 text-sm font-bold mb-2">Min Booking (mins)</label><input name="minBookingMinutes" type="number" value={formData.minBookingMinutes} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3" required /></div>
        <div className="w-1/2"><label className="block text-gray-700 text-sm font-bold mb-2">Max Booking (mins)</label><input name="maxBookingMinutes" type="number" value={formData.maxBookingMinutes} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3" required /></div>
      </div>
      <div className="flex gap-4 mb-6">
        <div className="w-1/2"><label className="block text-gray-700 text-sm font-bold mb-2">Opens At</label><select name="operatingHoursStart" value={formData.operatingHoursStart} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3">{timeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
        <div className="w-1/2"><label className="block text-gray-700 text-sm font-bold mb-2">Closes At</label><select name="operatingHoursEnd" value={formData.operatingHoursEnd} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3">{timeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
      </div>
      <div className="flex justify-end gap-4">
        <button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancel</button>
        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Save Resource</button>
      </div>
    </form>
  );
};

export default ResourceForm;