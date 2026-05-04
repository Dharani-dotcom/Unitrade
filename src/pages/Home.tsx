import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Listing, ListingCategory, ListingCondition, OperationType } from '@/src/types';
import ListingCard from '@/src/components/ListingCard';
import { handleFirestoreError } from '@/src/lib/utils';
import { Search, Filter, Book, Laptop, Bike, Home as HomeIcon, Shirt, Grid, ShoppingBag, Store, Recycle } from 'lucide-react';

const CATEGORIES = [
  { name: ListingCategory.Books, icon: Book },
  { name: ListingCategory.Electronics, icon: Laptop },
  { name: ListingCategory.Bikes, icon: Bike },
  { name: ListingCategory.HostelItems, icon: HomeIcon },
  { name: ListingCategory.Fashion, icon: Shirt },
  { name: ListingCategory.Others, icon: Grid },
];

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<ListingCondition | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const listingsRef = collection(db, 'listings');
    let q = query(
      listingsRef, 
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
    );

    if (selectedCategory) {
      q = query(q, where('category', '==', selectedCategory));
    }

    if (selectedCondition) {
      q = query(q, where('condition', '==', selectedCondition));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
      setListings(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'listings');
    });

    return () => unsubscribe();
  }, [selectedCategory, selectedCondition]);

  const filteredListings = listings.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.collegeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <section className="relative h-[250px] md:h-[300px] rounded-3xl overflow-hidden bg-indigo-900 shadow-2xl">
        <img 
          src="https://picsum.photos/seed/uni/1200/600" 
          alt="Campus Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <h1 className="text-3xl md:text-5xl font-sans font-extrabold text-white tracking-tight leading-tight">
            Campus Marketplace
          </h1>
          
          <div className="w-full max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="What are you looking for today?" 
              className="w-full bg-white rounded-2xl py-3.5 pl-12 pr-6 text-gray-900 shadow-xl focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Secondary Navbar / Type Toggle */}
      <div className="sticky top-20 z-10 py-4 -mt-4 bg-gray-50/80 backdrop-blur-md rounded-b-3xl">
        <div className="flex justify-center gap-2 max-w-md mx-auto p-1 bg-white rounded-2xl shadow-sm border border-gray-100">
          <button
            onClick={() => setSelectedCondition(null)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
              selectedCondition === null 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Grid className="w-4 h-4" />
            All Items
          </button>
          <button
            onClick={() => setSelectedCondition(ListingCondition.New)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
              selectedCondition === ListingCondition.New 
              ? 'bg-green-600 text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Store className="w-4 h-4" />
            Campus Store
          </button>
          <button
            onClick={() => setSelectedCondition(ListingCondition.Used)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
              selectedCondition === ListingCondition.Used 
              ? 'bg-orange-500 text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Recycle className="w-4 h-4" />
            Used Market
          </button>
        </div>
      </div>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Browse Categories</h2>
          <button 
            onClick={() => setSelectedCategory(null)}
            className={`text-sm font-semibold transition-colors ${!selectedCategory ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Show All
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(isSelected ? null : cat.name)}
                className={`flex flex-col items-center gap-3 min-w-[100px] p-4 rounded-2xl border transition-all ${
                  isSelected 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' 
                  : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/30'
                }`}
              >
                <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/20' : 'bg-gray-50'}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold whitespace-nowrap">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Listings Grid */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedCategory ? `${selectedCategory} near you` : 'Latest Listings'}
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter className="w-4 h-4" />
            <span>{filteredListings.length} items found</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No items found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">
              Try adjusting your search or category filters to find what you're looking for.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
