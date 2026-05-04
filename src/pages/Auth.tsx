import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/src/lib/firebase';
import { ShoppingBag, Chrome } from 'lucide-react';
import { motion } from 'motion/react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if profile exists
      const profileRef = doc(db, 'users', user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (!profileSnap.exists()) {
        // Redirect to complete profile if it's a new user
        // But first create a minimal doc
        await setDoc(profileRef, {
          uid: user.uid,
          displayName: user.displayName || 'Anonymous User',
          email: user.email,
          avatarUrl: user.photoURL,
          collegeName: '', // Will require update
          createdAt: serverTimestamp(),
        });
        navigate('/profile?new=true');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <ShoppingBag className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to UniTrade</h1>
          <p className="text-gray-500 mt-2">The exclusive student marketplace for your campus.</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 py-3.5 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-indigo-100 transition-all disabled:opacity-50"
          >
            <Chrome className="w-5 h-5 text-indigo-600" />
            <span>{loading ? 'Authenticating...' : 'Sign in with Google'}</span>
          </button>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs text-center font-medium">
              {error}
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-10 uppercase tracking-widest font-bold">
          Only @edu or student emails recommended
        </p>
      </motion.div>
    </div>
  );
}
