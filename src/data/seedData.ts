import type { Book, Category, IssueRecord, Member, ActivityItem, AuthUser } from '../types';
import { addDays, todayISO } from '../utils/dateUtils';
import { calculateFine } from '../utils/fine';

export const CATEGORY_NAMES = [
  'Fiction',
  'Science',
  'Technology',
  'History',
  'Biography',
  'Mystery',
  'Romance',
  "Children's",
  'Education',
];

export const seedCategories = (): Category[] =>
  CATEGORY_NAMES.map((name, i) => ({ id: `CAT-${String(i + 1).padStart(2, '0')}`, name }));

const coverColors = ['#4f46e5', '#c76b3f', '#3f7d58', '#b0592f', '#362da3', '#d9a441'];

const bookSeeds: Array<[string, string, string, string, string, number]> = [
  ['9780743273565', 'The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', 'Scribner', 1925],
  ['9780061120084', 'To Kill a Mockingbird', 'Harper Lee', 'Fiction', 'J.B. Lippincott', 1960],
  ['9780451524935', '1984', 'George Orwell', 'Fiction', 'Secker & Warburg', 1949],
  ['9780141439518', 'Pride and Prejudice', 'Jane Austen', 'Romance', 'T. Egerton', 1813],
  ['9780316769488', 'The Catcher in the Rye', 'J.D. Salinger', 'Fiction', 'Little, Brown', 1951],
  ['9780062315007', 'The Alchemist', 'Paulo Coelho', 'Fiction', 'HarperOne', 1988],
  ['9780544003415', 'The Lord of the Rings', 'J.R.R. Tolkien', 'Fiction', 'Allen & Unwin', 1954],
  ['9780618260300', 'The Hobbit', 'J.R.R. Tolkien', "Children's", 'Allen & Unwin', 1937],
  ['9780439708180', "Harry Potter and the Sorcerer's Stone", 'J.K. Rowling', "Children's", 'Bloomsbury', 1997],
  ['9780545010221', 'Harry Potter and the Deathly Hallows', 'J.K. Rowling', "Children's", 'Bloomsbury', 2007],
  ['9780307474278', 'The Da Vinci Code', 'Dan Brown', 'Mystery', 'Doubleday', 2003],
  ['9780375842207', 'The Hunger Games', 'Suzanne Collins', 'Fiction', 'Scholastic', 2008],
  ['9780553293357', 'Foundation', 'Isaac Asimov', 'Science', 'Gnome Press', 1951],
  ['9780441013593', 'Dune', 'Frank Herbert', 'Science', 'Chilton Books', 1965],
  ['9780345391803', "The Hitchhiker's Guide to the Galaxy", 'Douglas Adams', 'Science', 'Pan Books', 1979],
  ['9780671027032', 'A Brief History of Time', 'Stephen Hawking', 'Science', 'Bantam', 1988],
  ['9780062316097', 'Sapiens', 'Yuval Noah Harari', 'History', 'Harvill Secker', 2011],
  ['9780307887894', 'Steve Jobs', 'Walter Isaacson', 'Biography', 'Simon & Schuster', 2011],
  ['9780553380163', 'A Brief History of Nearly Everything', 'Bill Bryson', 'Science', 'Broadway Books', 2003],
  ['9780262033848', 'Introduction to Algorithms', 'Thomas H. Cormen', 'Technology', 'MIT Press', 2009],
  ['9780132350884', 'Clean Code', 'Robert C. Martin', 'Technology', 'Prentice Hall', 2008],
  ['9780201633610', 'Design Patterns', 'Erich Gamma', 'Technology', 'Addison-Wesley', 1994],
  ['9780596007126', 'Head First Design Patterns', 'Eric Freeman', 'Technology', "O'Reilly", 2004],
  ['9780134685991', 'Effective Java', 'Joshua Bloch', 'Technology', 'Addison-Wesley', 2017],
  ['9780385504201', 'The Diary of a Young Girl', 'Anne Frank', 'Biography', 'Contact Publishing', 1947],
  ['9780679783268', 'Long Walk to Freedom', 'Nelson Mandela', 'Biography', 'Little, Brown', 1994],
  ['9780064400558', 'Charlotte\'s Web', 'E.B. White', "Children's", 'Harper & Brothers', 1952],
  ['9780439064866', 'Harry Potter and the Chamber of Secrets', 'J.K. Rowling', "Children's", 'Bloomsbury', 1998],
  ['9780199535569', 'Emma', 'Jane Austen', 'Romance', 'John Murray', 1815],
  ['9780316015844', 'Twilight', 'Stephenie Meyer', 'Romance', 'Little, Brown', 2005],
  ['9780061964368', 'And Then There Were None', 'Agatha Christie', 'Mystery', 'Collins Crime Club', 1939],
  ['9780062073488', 'Murder on the Orient Express', 'Agatha Christie', 'Mystery', 'Collins Crime Club', 1934],
  ['9780199536002', 'Jane Eyre', 'Charlotte Brontë', 'Fiction', 'Smith, Elder & Co.', 1847],
];

export const seedBooks = (): Book[] =>
  bookSeeds.map(([isbn, title, author, category, publisher, publishedYear], i) => {
    const totalCopies = 3 + (i % 5);
    // All copies start available; buildSeedIssues() below is the single source of truth
    // for decrementing availableCopies to match the actual active issue records it creates.
    const availableCopies = totalCopies;
    return {
      id: `BK-${String(i + 1).padStart(3, '0')}`,
      isbn,
      title,
      author,
      category,
      publisher,
      publishedYear,
      totalCopies,
      availableCopies,
      description: `${title} is a widely read ${category.toLowerCase()} title by ${author}, published by ${publisher} in ${publishedYear}. A staple recommended by our librarians.`,
      status: availableCopies > 0 ? 'Available' : 'Unavailable',
      coverColor: coverColors[i % coverColors.length],
      createdAt: addDays(todayISO(), -(180 - i * 3)),
    };
  });

const firstNames = ['Aarav', 'Isha', 'Rohan', 'Priya', 'Karan', 'Neha', 'Vikram', 'Ananya', 'Sanjay', 'Meera', 'Arjun', 'Divya', 'Rahul', 'Kavya', 'Aditya', 'Pooja', 'Nikhil', 'Riya', 'Suresh', 'Tanvi'];
const lastNames = ['Sharma', 'Verma', 'Iyer', 'Nair', 'Gupta', 'Kapoor', 'Reddy', 'Menon', 'Joshi', 'Chopra', 'Malhotra', 'Rao', 'Bansal', 'Saxena', 'Mehta', 'Bose', 'Kulkarni', 'Pillai', 'Agarwal', 'Desai'];
const membershipTypes: Array<Member['membershipType']> = ['Basic', 'Premium', 'Student'];

export const seedMembers = (): Member[] =>
  firstNames.map((firstName, i) => {
    const lastName = lastNames[i];
    const joinDate = addDays(todayISO(), -(400 - i * 10));
    const membershipStart = joinDate;
    const membershipExpiry = addDays(joinDate, 365);
    const status: Member['status'] = i % 9 === 0 ? 'Inactive' : 'Active';
    return {
      id: `MEM-${String(i + 1).padStart(3, '0')}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@mail.com`,
      phone: `98${(10000000 + i * 137).toString().slice(0, 8)}`,
      dob: `${1975 + (i % 30)}-0${(i % 9) + 1}-1${i % 9}`,
      address: `${100 + i} MG Road, Bengaluru, KA`,
      membershipType: membershipTypes[i % membershipTypes.length],
      membershipStart,
      membershipExpiry,
      status,
      joinDate,
      booksIssued: 0,
    };
  });

export const buildSeedIssues = (books: Book[], members: Member[]): { issues: IssueRecord[]; books: Book[]; members: Member[] } => {
  const issues: IssueRecord[] = [];
  const booksCopy = books.map((b) => ({ ...b }));
  const membersCopy = members.map((m) => ({ ...m }));

  const patterns: Array<{ issueOffset: number; dueOffset: number; returned: boolean; returnOffset?: number }> = [
    { issueOffset: -40, dueOffset: -26, returned: true, returnOffset: -30 },
    { issueOffset: -35, dueOffset: -21, returned: true, returnOffset: -22 },
    { issueOffset: -30, dueOffset: -16, returned: true, returnOffset: -14 },
    { issueOffset: -28, dueOffset: -14, returned: true, returnOffset: -20 },
    { issueOffset: -25, dueOffset: -11, returned: true, returnOffset: -10 },
    { issueOffset: -20, dueOffset: -6, returned: true, returnOffset: -5 },
    { issueOffset: -18, dueOffset: -4, returned: false }, // overdue
    { issueOffset: -16, dueOffset: -2, returned: false }, // overdue
    { issueOffset: -15, dueOffset: -1, returned: false }, // overdue
    { issueOffset: -14, dueOffset: 0, returned: false }, // due today
    { issueOffset: -12, dueOffset: 2, returned: false }, // issued, due soon
    { issueOffset: -10, dueOffset: 4, returned: false },
    { issueOffset: -9, dueOffset: 5, returned: false },
    { issueOffset: -8, dueOffset: 6, returned: false },
    { issueOffset: -7, dueOffset: 7, returned: false },
    { issueOffset: -45, dueOffset: -31, returned: true, returnOffset: -33 },
    { issueOffset: -50, dueOffset: -36, returned: true, returnOffset: -35 },
    { issueOffset: -22, dueOffset: -8, returned: true, returnOffset: -9 },
    { issueOffset: -19, dueOffset: -5, returned: false }, // overdue
    { issueOffset: -60, dueOffset: -46, returned: true, returnOffset: -44 },
  ];

  patterns.forEach((p, i) => {
    const book = booksCopy[i % booksCopy.length];
    const member = membersCopy[i % membersCopy.length];
    const issueDate = addDays(todayISO(), p.issueOffset);
    const dueDate = addDays(todayISO(), p.dueOffset);
    const returnDate = p.returned ? addDays(todayISO(), p.returnOffset ?? 0) : null;
    const status: IssueRecord['status'] = p.returned ? 'Returned' : (p.dueOffset < 0 ? 'Overdue' : 'Issued');
    const fine = p.returned ? calculateFine(dueDate, returnDate) : status === 'Overdue' ? calculateFine(dueDate, null) : 0;

    issues.push({
      id: `ISS-${String(i + 1).padStart(3, '0')}`,
      bookId: book.id,
      memberId: member.id,
      issueDate,
      dueDate,
      returnDate,
      status,
      fine,
    });

    if (!p.returned) {
      member.booksIssued += 1;
      book.availableCopies = Math.max(0, book.availableCopies - 1);
      book.status = book.availableCopies > 0 ? 'Available' : 'Unavailable';
    }
  });

  return { issues, books: booksCopy, members: membersCopy };
};

export const seedActivity = (): ActivityItem[] => {
  const now = Date.now();
  return [
    { id: 'ACT-1', type: 'issue', message: 'Book "Dune" issued to Priya Iyer', timestamp: new Date(now - 1000 * 60 * 30).toISOString() },
    { id: 'ACT-2', type: 'return', message: 'Book "The Alchemist" returned by Rohan Nair', timestamp: new Date(now - 1000 * 60 * 90).toISOString() },
    { id: 'ACT-3', type: 'member', message: 'New member registered: Tanvi Desai', timestamp: new Date(now - 1000 * 60 * 60 * 3).toISOString() },
    { id: 'ACT-4', type: 'book', message: 'New book added: "Clean Code"', timestamp: new Date(now - 1000 * 60 * 60 * 6).toISOString() },
    { id: 'ACT-5', type: 'issue', message: 'Book "1984" issued to Karan Gupta', timestamp: new Date(now - 1000 * 60 * 60 * 20).toISOString() },
    { id: 'ACT-6', type: 'return', message: 'Book "Foundation" returned by Meera Kapoor', timestamp: new Date(now - 1000 * 60 * 60 * 30).toISOString() },
  ];
};

export const seedUsers: AuthUser[] = [
  {
    id: 'USR-ADMIN',
    name: 'Gayathri',
    email: 'admin@library.com',
    role: 'admin',
    phone: '9876543210',
    address: '1 Library Lane, Bengaluru, KA',
    avatarColor: '#4f46e5',
  },
  {
    id: 'USR-LIBRARIAN',
    name: 'Vikram Librarian',
    email: 'librarian@library.com',
    role: 'librarian',
    phone: '9812345678',
    address: '2 Reading Row, Bengaluru, KA',
    avatarColor: '#c76b3f',
  },
  {
    id: 'USR-MEMBER',
    name: 'Ananya Menon',
    email: 'member@library.com',
    role: 'member',
    phone: '9810000959',
    address: '107 MG Road, Bengaluru, KA',
    avatarColor: '#3f7d58',
    memberId: 'MEM-008',
  },
];

export const CREDENTIALS: Record<string, string> = {
  'admin@library.com': 'Admin@123',
  'librarian@library.com': 'Librarian@123',
  'member@library.com': 'Member@123',
};
