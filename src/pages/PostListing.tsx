import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuthState } from '@/src/components/AuthContext';
import { ListingCategory, ListingStatus, OperationType } from '@/src/types';
import { handleFirestoreError } from '@/src/lib/utils';
import { Camera, IndianRupee, Tag, Info, AlertCircle, Grid } from 'lucide-react';

export default function PostListing() {
  const { user, profile } = useAuthState();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: ListingCategory.Others,
    location: '',
    whatsappNumber: '',
    imageUrl: '',
  });

  if (!user || (profile && !profile.collegeName)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="w-12 h-12 text-indigo-600 mb-4" />
        <h2 className="text-xl font-bold">Incomplete Profile</h2>
        <p className="text-gray-500 mt-2 max-w-xs">You need to set your college name in your profile before posting a listing.</p>
        <button 
          onClick={() => navigate('/profile')}
          className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-full font-bold"
        >
          Go to Profile
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const listingData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        images: [formData.imageUrl || `https://picsum.photos/seed/${Date.now()}/800/600`],
        sellerId: user.uid,
        sellerName: profile?.displayName || 'Anonymous',
        collegeName: profile?.collegeName || 'Unknown',
        location: formData.location || profile?.location || '',
        whatsappNumber: formData.whatsappNumber || profile?.phone || '',
        status: ListingStatus.Active,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        favoritesCount: 0,
      };

      await addDoc(collection(db, 'listings'), listingData);
      navigate('/');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'listings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Post an Item</h1>
        <p className="text-gray-500 mt-2">Share what you're selling with your campus community.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-500" />
            Item Title
          </label>
          <input 
            required
            type="text" 
            placeholder="e.g., HC Verma Physics Vol 1"
            className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-indigo-500" />
              Price (₹)
            </label>
            <input 
              required
              type="number" 
              placeholder="0"
              className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.price}
              onChange={e => setFormData({...formData, price: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Grid className="w-4 h-4 text-indigo-500" />
              Category
            </label>
            <select 
              className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value as ListingCategory})}
            >
              {Object.values(ListingCategory).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" />
            Description
          </label>
          <textarea 
            required
            rows={4}
            placeholder="Describe the condition, age, and details of the item..."
            className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Camera className="w-4 h-4 text-indigo-500" />
            Image URL
          </label>
          <input 
            type="url" 
            placeholder="Paste an image URL (optional, defaults to random campus pic)"
            className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={formData.imageUrl}
            onChange={e => setFormData({...formData, imageUrl: e.target.value})}
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'List Item Now'}
          </button>
        </div>
      </form>
    </div>
  );
}
