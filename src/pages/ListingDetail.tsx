import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, setDoc, deleteDoc, serverTimestamp, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuthState } from '@/src/components/AuthContext';
import { Listing, OperationType } from '@/src/types';
import { handleFirestoreError, formatPrice } from '@/src/lib/utils';
import { MapPin, Clock, MessageCircle, Heart, Share2, AlertTriangle, ChevronLeft, User, MessageSquare, LayoutDashboard } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'motion/react';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuthState();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchListing = async () => {
      try {
        const docRef = doc(db, 'listings', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setListing({ id: docSnap.id, ...docSnap.data() } as Listing);
          
          if (user) {
            const favRef = doc(db, 'users', user.uid, 'favorites', id);
            const favSnap = await getDoc(favRef);
            setIsFavorite(favSnap.exists());
          }
        } else {
          navigate('/');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `listings/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id, user, navigate]);

  const handleStartChat = async () => {
    if (!user) return navigate('/auth');
    if (!listing || !id) return;
    if (user.uid === listing.sellerId) return alert("You can't message yourself!");

    setStartingChat(true);
    try {
      const chatId = [user.uid, listing.sellerId].sort().join('_');
      const chatDocRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatDocRef);

      if (!chatSnap.exists()) {
        const batch = writeBatch(db);
        
        batch.set(chatDocRef, {
          participants: [user.uid, listing.sellerId],
          lastMessage: `Interested in ${listing.title}`,
          lastMessageTime: serverTimestamp(),
          listingId: id,
          listingTitle: listing.title
        });

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const newMessageRef = doc(messagesRef);
        batch.set(newMessageRef, {
          senderId: user.uid,
          text: `Hi! I'm interested in "${listing.title}". Is it still available?`,
          createdAt: serverTimestamp(),
        });

        await batch.commit();
      }

      navigate(`/chat/${chatId}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'chats');
    } finally {
      setStartingChat(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !id) return;
    const favRef = doc(db, 'users', user.uid, 'favorites', id);
    if (isFavorite) {
      await deleteDoc(favRef);
      setIsFavorite(false);
    } else {
      await setDoc(favRef, {
        userId: user.uid,
        listingId: id,
        createdAt: serverTimestamp()
      });
      setIsFavorite(true);
    }
  };

  const handleReport = async () => {
    if (!user || !id) return;
    try {
      const reportRef = doc(collection(db, 'listings', id, 'reports'));
      await setDoc(reportRef, {
        listingId: id,
        reporterId: user.uid,
        reason: 'Flagged as inappropriate',
        createdAt: serverTimestamp()
      });
      alert('Item reported successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `listings/${id}/reports`);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!listing) return null;

  const timeAgo = formatDistanceToNow(listing.createdAt?.toDate?.() || new Date(), { addSuffix: true });

  const whatsappUrl = listing.whatsappNumber 
    ? `https://wa.me/${listing.whatsappNumber}?text=Hi, I'm interested in your item: ${listing.title} on UniTrade.`
    : null;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6 transition-colors font-semibold"
      >
        <ChevronLeft className="w-5 h-5" />
        <span>Back to campus</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Images */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="rounded-3xl overflow-hidden shadow-2xl bg-gray-100 aspect-[4/3]">
            <img 
              src={listing.images[0]} 
              alt={listing.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {listing.images.map((img, i) => (
              <div key={i} className="rounded-xl overflow-hidden border-2 border-gray-100 aspect-square">
                <img src={img} alt={`${listing.title} ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col h-full"
        >
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {listing.category}
              </span>
              <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                <Clock className="w-3 h-3" />
                <span>Posted {timeAgo}</span>
              </div>
            </div>

            <div className="flex justify-between items-start gap-4">
              <h1 className="text-3xl md:text-4xl font-sans font-extrabold text-gray-900 tracking-tight">
                {listing.title}
              </h1>
              <div className="text-3xl font-mono font-bold text-indigo-600">
                {formatPrice(listing.price)}
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-500 font-medium">
              <MapPin className="w-4 h-4 text-indigo-500" />
              <span>{listing.collegeName}</span>
              {listing.location && <span className="text-gray-300">•</span>}
              {listing.location && <span>{listing.location}</span>}
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-3xl space-y-4 shadow-sm">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                Seller Information
              </h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-lg text-gray-900">{listing.sellerName}</div>
                  <div className="text-sm text-gray-500">Student at {listing.collegeName}</div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {user?.uid === listing.sellerId ? (
                    <button 
                      onClick={() => navigate(`/profile?activeTab=listings`)}
                      className="flex-1 sm:flex-none justify-center bg-gray-900 text-white p-3 rounded-2xl hover:bg-black transition-all flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      <span className="font-bold">Manage Listing</span>
                    </button>
                  ) : (
                    <>
                      {whatsappUrl && (
                        <a 
                          href={whatsappUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none justify-center bg-green-500 text-white p-3 rounded-2xl hover:bg-green-600 transition-all flex items-center gap-2"
                        >
                          <MessageCircle className="w-5 h-5 fill-current" />
                          <span className="font-bold">WhatsApp</span>
                        </a>
                      )}
                      <button 
                        onClick={handleStartChat}
                        disabled={startingChat}
                        className="flex-1 sm:flex-none justify-center bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span className="font-bold">{startingChat ? 'Connecting...' : 'DM Seller'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">Description</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 flex items-center gap-4">
            <button 
              onClick={toggleFavorite}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all border ${
                isFavorite 
                ? 'bg-red-50 border-red-200 text-red-600' 
                : 'bg-white border-gray-200 text-gray-700 hover:border-red-200 hover:text-red-600'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              <span>{isFavorite ? 'Saved to Favorites' : 'Save for Later'}</span>
            </button>
            <button className="p-4 rounded-2xl border border-gray-200 text-gray-700 hover:bg-gray-50">
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              onClick={handleReport}
              className="p-4 rounded-2xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200"
              title="Report item"
            >
              <AlertTriangle className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
