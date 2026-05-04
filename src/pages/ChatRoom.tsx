import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, writeBatch, updateDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuthState } from '@/src/components/AuthContext';
import { Chat, Message, OperationType } from '@/src/types';
import { handleFirestoreError } from '@/src/lib/utils';
import { Send, ChevronLeft, User, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

export default function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthState();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipientProfile, setRecipientProfile] = useState<any>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;

    const chatRef = doc(db, 'chats', id);
    const messagesRef = collection(db, 'chats', id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribeChat = onSnapshot(chatRef, (snap) => {
      if (snap.exists()) {
        setChat({ id: snap.id, ...snap.data() } as Chat);
      } else {
        navigate('/messages');
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `chats/${id}`));

    const unsubscribeMessages = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
      setLoading(false);
    }, (err) => {
      console.error("Messages list error:", err);
      handleFirestoreError(err, OperationType.LIST, `chats/${id}/messages`);
    });

    return () => {
      unsubscribeChat();
      unsubscribeMessages();
    };
  }, [id, user, navigate]);

  useEffect(() => {
    if (!chat || !user) return;
    const recipientId = chat.participants.find(p => p !== user.uid);
    if (!recipientId) return;

    getDoc(doc(db, 'users', recipientId)).then(snap => {
      if (snap.exists()) setRecipientProfile(snap.data());
    });
  }, [chat, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !id) return;

    const text = inputText.trim();
    setInputText('');

    try {
      const messagesRef = collection(db, 'chats', id, 'messages');
      const chatRef = doc(db, 'chats', id);

      const batch = writeBatch(db);
      const newMessageRef = doc(messagesRef);
      
      batch.set(newMessageRef, {
        senderId: user.uid,
        text,
        createdAt: serverTimestamp(),
      });

      batch.update(chatRef, {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
      });

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `chats/${id}/messages`);
    }
  };

  if (loading) return null;
  if (!chat) return null;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/messages')} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 overflow-hidden">
            {recipientProfile?.avatarUrl ? (
              <img src={recipientProfile.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div>
            <h2 className="font-bold text-gray-900 leading-tight">
              {recipientProfile?.displayName || 'Loading...'}
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-0.5">
              {chat.listingTitle || 'Campus Conversation'}
            </p>
          </div>
        </div>
        
        {chat.listingId && (
          <button 
            onClick={() => navigate(`/checkout/${chat.listingId}`)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay Now</span>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
                  isMe 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                }`}>
                  <p>{msg.text}</p>
                  <div className={`text-[9px] mt-1 font-medium uppercase tracking-wider ${isMe ? 'text-indigo-200 text-right' : 'text-gray-400'}`}>
                    {msg.createdAt && formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Type your message..." 
            className="flex-1 bg-gray-50 border-0 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:hover:bg-indigo-600"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
