# Security Specification for UniTrade

## Data Invariants
1. A listing must have a valid `sellerId` matching the creator's UID.
2. A listing's `collegeName` must match the seller's college at the time of creation.
3. Users can only modify their own profiles and their own listings.
4. Favorites can only be created/deleted by the specific user.
5. Reports can be created by any signed-in user but never modified or deleted.

## The Dirty Dozen Payloads (Target: Firestore)

1. **Identity Theft (Profile)**: Attempt to update another user's profile `displayName`.
2. **Spoofed Seller**: Create a listing with a `sellerId` that does not match the authenticated user's UID.
3. **Price Manipulation**: Attempt to update a listing's `price` to a negative value or a non-number.
4. **Status Escalation**: Any user attempting to change a listing status to 'verified' (if such status existed) or 'sold' on someone else's listing.
5. **Shadow Field injection**: Injecting `isAdmin: true` into a user profile.
6. **Orphaned Favorites**: Creating a favorite for a listing that does not exist.
7. **Favorite Spoofing**: User A creating a favorite document in User B's subcollection.
8. **Spam Reports**: User creating thousands of reports (need size limits and rate limiting feel).
9. **College Mismatch**: User from 'College A' listing an item under 'College B'.
10. **Immutable Alteration**: Attempting to change `createdAt` on an existing listing.
11. **Huge ID Poisoning**: Attempting to create a listing with a 2MB string as a document ID.
12. **Blanket Query Scraping**: Attempting to list all users' private data if it were in the same document.

## Test Runner (Logic Verification)
I will implement `firestore.rules` and verify them via code logic.
