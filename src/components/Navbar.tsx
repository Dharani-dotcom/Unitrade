import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, PlusCircle, LogOut, Search, Shield, MessageSquare } from 'lucide-react';
import { auth } from '@/src/lib/firebase';
import { useAuthState } from './AuthContext';

export default function Navbar() {
  const { user, profile, isAdmin } = useAuthState();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-indigo-600" />
            <span className="font-sans font-bold text-xl tracking-tight text-gray-900">UniTrade</span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search campus essentials..." 
                className="w-full bg-gray-50 border-0 rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors" title="Admin Panels">
                    <Shield className="w-5 h-5" />
                  </Link>
                )}
                <Link 
                  to="/post" 
                  className="hidden sm:flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Sell Item</span>
                </Link>
                <Link to="/post" className="sm:hidden text-indigo-600">
                  <PlusCircle className="w-6 h-6" />
                </Link>
                <Link 
                  to="/messages" 
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                  title="Messages"
                >
                  <MessageSquare className="w-6 h-6" />
                </Link>
                <Link to="/profile" className="flex items-center gap-2 hover:opacity-80">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </Link>
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <Link 
                to="/auth" 
                className="bg-indigo-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
