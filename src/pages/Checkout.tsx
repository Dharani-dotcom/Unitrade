import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuthState } from '@/src/components/AuthContext';
import { Listing, OperationType, ListingStatus } from '@/src/types';
import { handleFirestoreError, formatPrice } from '@/src/lib/utils';
import { ShieldCheck, CreditCard, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Checkout() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthState();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    const fetchListing = async () => {
      try {
        const docRef = doc(db, 'listings', listingId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setListing({ id: snap.id, ...snap.data() } as Listing);
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [listingId, navigate]);

  const handlePayment = async () => {
    if (!listing || !user) return;
    setProcessing(true);
    
    // Simulate payment delay
    await new Promise(r => setTimeout(r, 2000));

    try {
      // 1. Create order record
      await addDoc(collection(db, 'orders'), {
        buyerId: user.uid,
        sellerId: listing.sellerId,
        listingId: listing.id,
        amount: listing.price,
        status: 'completed',
        createdAt: serverTimestamp(),
      });

      // 2. Mark listing as sold
      await updateDoc(doc(db, 'listings', listing.id), {
        status: ListingStatus.Sold,
        updatedAt: serverTimestamp(),
      });

      setSuccess(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'orders');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return null;
  if (!listing) return null;

  if (success) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-10 rounded-3xl shadow-2xl border border-green-100"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-100">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-500 mb-8 font-medium">Funds are held in escrow. Contact {listing.sellerName} to arrange delivery.</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Secure Checkout</h1>
      <p className="text-gray-500 mb-8">UniTrade Escrow protects your money until you receive the item.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-500" />
              UPI & Payment Methods
            </h3>
            <div className="space-y-3">
              {['PhonePe', 'Google Pay', 'Paytm', 'Card'].map(method => (
                <div key={method} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-indigo-100 cursor-pointer transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    <span className="font-bold text-gray-700">{method}</span>
                  </div>
                  <Lock className="w-4 h-4 text-gray-300" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 flex items-start gap-4">
            <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">UniTrade Buyer Protection</h4>
              <p className="text-sm text-gray-600 mt-1">
                Your money is held securely. If the seller doesn't deliver or the item is significantly not as described, you're covered.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl sticky top-24">
            <h3 className="font-bold text-gray-900 mb-6 uppercase tracking-widest text-xs">Order Summary</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-900 line-clamp-1">{listing.title}</div>
                <div className="text-xs text-gray-500">Seller: {listing.sellerName}</div>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-gray-100 mb-8">
              <div className="flex justify-between text-gray-500">
                <span>Item Price</span>
                <span className="font-mono">{formatPrice(listing.price)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Buyer Fee (Escrow)</span>
                <span className="font-mono">{formatPrice(0)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-dashed border-gray-100">
                <span>Total Amount</span>
                <span className="text-indigo-600 font-mono">{formatPrice(listing.price)}</span>
              </div>
            </div>

            <button 
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {processing ? 'Processing Securely...' : (
                <>
                  <span>Pay {formatPrice(listing.price)}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <div className="mt-4 text-center flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              <Lock className="w-3 h-3" />
              <span>SSL Secure Payment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
