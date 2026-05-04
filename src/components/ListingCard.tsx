import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Heart, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Listing } from '@/src/types';
import { formatPrice } from '@/src/lib/utils';
import { motion } from 'motion/react';

interface ListingCardProps {
  listing: Listing;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, isFavorite, onToggleFavorite }) => {
  const timeAgo = formatDistanceToNow(listing.createdAt?.toDate?.() || new Date(), { addSuffix: true });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group cursor-pointer"
    >
      <Link to={`/listing/${listing.id}`} className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={listing.images[0] || `https://picsum.photos/seed/${listing.id}/400/300`} 
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-indigo-600">
          {listing.category}
        </div>
        {onToggleFavorite && (
          <button 
            onClick={onToggleFavorite}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
              isFavorite ? 'bg-red-500 text-white' : 'bg-white/70 text-gray-700 hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
      </Link>
      
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2 mb-2">
          <Link to={`/listing/${listing.id}`} className="font-sans font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {listing.title}
          </Link>
          <span className="font-mono text-indigo-600 font-bold whitespace-nowrap">
            {formatPrice(listing.price)}
          </span>
        </div>
        
        <div className="mt-auto space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="w-3 h-3" />
            <span className="line-clamp-1">{listing.collegeName}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium uppercase tracking-wider">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{timeAgo}</span>
            </div>
            <span>{listing.sellerName}</span>
          </div>
          <div className="pt-3 border-t border-gray-50 flex gap-2">
            <Link 
              to={`/listing/${listing.id}`}
              className="flex-1 bg-gray-50 text-gray-700 text-xs font-bold py-2 rounded-xl text-center hover:bg-gray-100 transition-all"
            >
              View Details
            </Link>
            <Link 
              to={`/listing/${listing.id}`}
              className="px-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all flex items-center justify-center"
              title="Chat with Seller"
            >
              <MessageSquare className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ListingCard;
