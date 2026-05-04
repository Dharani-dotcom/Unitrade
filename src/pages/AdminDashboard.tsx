import { useState, useEffect } from 'react';
import { collectionGroup, query, getDocs, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Listing, OperationType, ListingStatus } from '@/src/types';
import { formatDistanceToNow } from 'date-fns';
import { Shield, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuthState } from '../components/AuthContext';
import { Navigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { isAdmin, loading: authLoading } = useAuthState();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchReports = async () => {
      try {
        const q = query(collectionGroup(db, 'reports'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setReports(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [isAdmin]);

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await deleteDoc(doc(db, 'listings', listingId));
      setReports(reports.filter(r => r.listingId !== listingId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismissReport = async (report: any) => {
    try {
      await deleteDoc(doc(db, 'listings', report.listingId, 'reports', report.id));
      setReports(reports.filter(r => r.id !== report.id));
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/" />;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-red-100 rounded-2xl text-red-600">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Admin Moderation</h1>
          <p className="text-gray-500">Manage flags and reports from campus students.</p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-gray-400">Scanning reports...</div>
        ) : reports.length > 0 ? (
          reports.map((report) => (
            <div key={report.id} className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-red-500 uppercase tracking-widest">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Reported Item</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Listing ID: {report.listingId}</h3>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-xl mb-4 italic">
                  "{report.reason}"
                </p>
                <div className="text-xs text-gray-400 font-medium">
                  Reported {formatDistanceToNow(report.createdAt?.toDate?.() || new Date())} ago
                </div>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => handleDismissReport(report)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Dismiss</span>
                </button>
                <button 
                  onClick={() => handleDeleteListing(report.listingId)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove Listing</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Clean Campus!</h3>
            <p className="text-gray-500">There are no pending reports at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
