import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuthState } from '@/src/components/AuthContext';
import { Listing, OperationType } from '@/src/types';
import ListingCard from '@/src/components/ListingCard';
import { handleFirestoreError, formatPrice } from '@/src/lib/utils';
import { User, MapPin, School, Phone, Save, Package, Heart, LayoutDashboard, CreditCard, MessageSquare, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Profile() {
  const { user, profile, loading: authLoading } = useAuthState();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNewUser = searchParams.get('new') === 'true';

  const [activeTab, setActiveTab] = useState<'listings' | 'favorites' | 'orders' | 'messages'>('listings');
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [favoriteListings, setFavoriteListings] = useState<Listing[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [myChats, setMyChats] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  
  const [editMode, setEditMode] = useState(isNewUser);
  const [formData, setFormData] = useState({
    displayName: '',
    collegeName: '',
    location: '',
    phone: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        collegeName: profile.collegeName || '',
        location: profile.location || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;

    const fetchMyItems = async () => {
      setLoadingItems(true);
      try {
        // Fetch My Listings
        const listingsQ = query(
          collection(db, 'listings'),
          where('sellerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const listingSnap = await getDocs(listingsQ);
        setMyListings(listingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing)));

        // Fetch Favorites
        const favsQ = query(collection(db, 'users', user.uid, 'favorites'));
        const favSnap = await getDocs(favsQ);
        const favIds = favSnap.docs.map(doc => doc.data().listingId);
        
        if (favIds.length > 0) {
          const itemsQ = query(collection(db, 'listings'), where('__name__', 'in', favIds.slice(0, 10)));
          const itemsSnap = await getDocs(itemsQ);
          setFavoriteListings(itemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing)));
        } else {
          setFavoriteListings([]);
        }

        // Fetch Orders
        const ordersQ = query(
          collection(db, 'orders'),
          where('buyerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const orderSnap = await getDocs(ordersQ);
        setMyOrders(orderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Chats
        const chatsQ = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', user.uid)
        );
        const chatSnap = await getDocs(chatsQ);
        setMyChats(chatSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (err) {
        console.error(err);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchMyItems();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        updatedAt: new Date(),
      });
      setEditMode(false);
      if (isNewUser) navigate('/profile');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  if (authLoading) return null;
  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
            
            <div className="flex flex-col items-center text-center mb-8">
              <div className="relative mb-4">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-white shadow-lg" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border-4 border-white shadow-lg">
                    <User className="w-12 h-12" />
                  </div>
                )}
                {!editMode && (
                  <button 
                    onClick={() => setEditMode(true)}
                    className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md hover:bg-gray-50 text-indigo-600 transition-all border border-gray-100"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {!editMode ? (
                <>
                  <h2 className="text-2xl font-sans font-extrabold text-gray-900">{profile?.displayName}</h2>
                  <p className="text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full mt-2">
                    {profile?.collegeName || 'College info missing'}
                  </p>
                </>
              ) : (
                <div className="w-full mt-2">
                  <h2 className="text-xl font-bold mb-4">{isNewUser ? 'Complete Your Profile' : 'Edit Profile'}</h2>
                </div>
              )}
            </div>

            {editMode ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Display Name</label>
                  <input 
                    type="text" 
                    value={formData.displayName}
                    onChange={e => setFormData({...formData, displayName: e.target.value})}
                    className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">College Name</label>
                  <input 
                    required
                    type="text" 
                    value={formData.collegeName}
                    onChange={e => setFormData({...formData, collegeName: e.target.value})}
                    className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                    placeholder="Which college are you from?"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Location</label>
                  <input 
                    type="text" 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                    placeholder="Current location/Hostel"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">WhatsApp Number</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                    placeholder="e.g., 919876543210"
                  />
                </div>
                <div className="pt-4 flex gap-2">
                  {!isNewUser && (
                    <button 
                      type="button" 
                      onClick={() => setEditMode(false)}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-500 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    type="submit" 
                    className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-2xl border border-gray-50 hover:border-indigo-100 transition-colors">
                  <School className="w-5 h-5 text-indigo-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">College</span>
                    <span className="font-semibold text-gray-700">{profile?.collegeName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-2xl border border-gray-50 hover:border-indigo-100 transition-colors">
                  <MapPin className="w-5 h-5 text-indigo-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</span>
                    <span className="font-semibold text-gray-700">{profile?.location || 'Not set'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-2xl border border-gray-50 hover:border-indigo-100 transition-colors">
                  <Phone className="w-5 h-5 text-indigo-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WhatsApp</span>
                    <span className="font-semibold text-gray-700">{profile?.phone || 'Not set'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Listings/Favorites Tabs */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-wrap p-1.5 bg-gray-100 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('listings')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'listings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>My Listings</span>
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'favorites' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Watchlist</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'orders' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Purchases</span>
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'messages' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
            </button>
          </div>

          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === 'listings' ? (
                <motion.div 
                  key="listings"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {myListings.length > 0 ? (
                    myListings.map(listing => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                      <p className="text-gray-400 font-medium">You haven't listed anything yet.</p>
                      <button 
                        onClick={() => navigate('/post')}
                        className="mt-4 text-indigo-600 font-bold hover:underline"
                      >
                        Create your first listing
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : activeTab === 'favorites' ? (
                <motion.div 
                  key="favorites"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {favoriteListings.length > 0 ? (
                    favoriteListings.map(listing => (
                      <ListingCard key={listing.id} listing={listing} isFavorite={true} />
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                      <p className="text-gray-400 font-medium">Your watchlist is empty.</p>
                      <button 
                        onClick={() => navigate('/')}
                        className="mt-4 text-indigo-600 font-bold hover:underline"
                      >
                        Explore items
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : activeTab === 'orders' ? (
                <motion.div 
                  key="orders"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-4"
                >
                  {myOrders.length > 0 ? (
                    myOrders.map(order => (
                      <div key={order.id} className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                            <CreditCard className="w-7 h-7" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">Purchase #{order.id.slice(0, 8).toUpperCase()}</h4>
                            <p className="text-sm text-gray-500">Secured via UniTrade Escrow</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-indigo-600">{formatPrice(order.amount)}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                            {order.createdAt?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                      <p className="text-gray-400 font-medium">You haven't bought anything yet.</p>
                      <button 
                        onClick={() => navigate('/')}
                        className="mt-4 text-indigo-600 font-bold hover:underline"
                      >
                        Browse items
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="messages"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-3"
                >
                  {myChats.length > 0 ? (
                    myChats.map(chat => (
                      <Link
                        key={chat.id}
                        to={`/chat/${chat.id}`}
                        className="flex items-center gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 group-hover:bg-indigo-100 transition-colors">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 line-clamp-1">{chat.listingTitle || 'Direct Conversation'}</h4>
                          <p className="text-sm text-gray-500 line-clamp-1 italic">{chat.lastMessage}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                      <p className="text-gray-400 font-medium">No messages yet.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
