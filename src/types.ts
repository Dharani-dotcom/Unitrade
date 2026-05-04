export enum ListingCategory {
  Books = 'Books',
  Electronics = 'Electronics',
  Bikes = 'Bikes',
  HostelItems = 'Hostel Items',
  Fashion = 'Fashion',
  Others = 'Others'
}

export enum ListingStatus {
  Active = 'active',
  Sold = 'sold',
  Reported = 'reported'
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  collegeName: string;
  location?: string;
  avatarUrl?: string;
  createdAt: any;
}

export enum ListingCondition {
  New = 'New',
  Used = 'Used'
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  condition: ListingCondition;
  images: string[];
  sellerId: string;
  sellerName: string;
  collegeName: string;
  location?: string;
  whatsappNumber?: string;
  status: ListingStatus;
  createdAt: any;
  updatedAt: any;
  favoritesCount: number;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: any;
  listingId?: string;
  listingTitle?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
