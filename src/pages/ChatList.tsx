import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuthState } from '@/src/components/AuthContext';
import { Chat, OperationType } from '@/src/types';
import { handleFirestoreError } from '@/src/lib/utils';
import { Link } from 'react-router-dom';
import { MessageSquare, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'motion/react';

export default function ChatList() {
  const { user } = useAuthState();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
      // Sort locally to avoid needing a composite index in Firestore
      const sortedChats = chatData.sort((a, b) => {
        const timeA = a.lastMessageTime?.toMillis?.() || 0;
        const timeB = b.lastMessageTime?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setChats(sortedChats);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
          <MessageSquare className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-gray-500">Connect with buyers and sellers on campus.</p>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-gray-400">Loading chats...</div>
        ) : chats.length > 0 ? (
          chats.map((chat) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Link
                to={`/chat/${chat.id}`}
                className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-100 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 group-hover:bg-indigo-100 transition-colors">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-gray-900 line-clamp-1">
                      {chat.listingTitle ? `Re: ${chat.listingTitle}` : 'Direct Message'}
                    </span>
                    {chat.lastMessageTime && (
                      <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2 uppercase tracking-wider">
                        {formatDistanceToNow(chat.lastMessageTime.toDate(), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1 italic">
                    {chat.lastMessage || 'No messages yet'}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))
        ) : (
          <div className="py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No conversations yet</h3>
            <p className="text-gray-500 mt-2">Start a chat from any product page.</p>
          </div>
        )}
      </div>
    </div>
  );
}
