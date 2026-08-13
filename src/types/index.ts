export type UserRole = 'admin' | 'librarian' | 'member';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  address: string;
  avatarColor: string;
  /** Links a 'member'-role account to their Member record. Unset for staff (admin/librarian) accounts. */
  memberId?: string;
}

export interface Category {
  id: string;
  name: string;
}

export type BookStatus = 'Available' | 'Unavailable';

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  publisher: string;
  publishedYear: number;
  totalCopies: number;
  availableCopies: number;
  description: string;
  status: BookStatus;
  coverColor: string;
  createdAt: string;
}

export type MembershipType = 'Basic' | 'Premium' | 'Student';
export type MemberStatus = 'Active' | 'Inactive';

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  address: string;
  membershipType: MembershipType;
  membershipStart: string;
  membershipExpiry: string;
  status: MemberStatus;
  joinDate: string;
  booksIssued: number;
}

export type IssueStatus = 'Issued' | 'Returned' | 'Overdue';

export interface IssueRecord {
  id: string;
  bookId: string;
  memberId: string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  status: IssueStatus;
  fine: number;
}

export interface ActivityItem {
  id: string;
  type: 'issue' | 'return' | 'member' | 'book';
  message: string;
  timestamp: string;
}
