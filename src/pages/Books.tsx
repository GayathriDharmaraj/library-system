import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookFormModal from '../components/BookFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import type { Book } from '../types';
import { getBooks, getCategories, getIssues, nextId, pushActivity, setBooks } from '../services/storage';

type SortKey = 'title' | 'author' | 'category' | 'publishedYear' | 'availableCopies';

export default function Books() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const categories = useMemo(() => getCategories(), []);

  const [books, setBooksState] = useState<Book[]>(() => getBooks());
  const [search, setSearch] = useState('');
  const [searchField, setSearchField] = useState<'title' | 'author' | 'isbn'>('title');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);

  const persist = (next: Book[]) => {
    setBooksState(next);
    setBooks(next);
  };

  const filtered = useMemo(() => {
    let result = [...books];

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter((b) => {
        if (searchField === 'title') return b.title.toLowerCase().includes(term);
        if (searchField === 'author') return b.author.toLowerCase().includes(term);
        return b.isbn.toLowerCase().includes(term);
      });
    }
    if (categoryFilter) result = result.filter((b) => b.category === categoryFilter);
    if (availabilityFilter === 'available') result = result.filter((b) => b.availableCopies > 0);
    if (availabilityFilter === 'unavailable') result = result.filter((b) => b.availableCopies === 0);
    if (statusFilter) result = result.filter((b) => b.status === statusFilter);

    result.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [books, search, searchField, categoryFilter, availabilityFilter, statusFilter, sortKey, sortDir]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setAvailabilityFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleAdd = (data: Omit<Book, 'id' | 'availableCopies' | 'status' | 'coverColor' | 'createdAt'>) => {
    const id = nextId('BK', books.map((b) => b.id));
    const newBook: Book = {
      ...data,
      id,
      availableCopies: data.totalCopies,
      status: data.totalCopies > 0 ? 'Available' : 'Unavailable',
      coverColor: '#4f46e5',
      createdAt: new Date().toISOString(),
    };
    persist([newBook, ...books]);
    pushActivity({ type: 'book', message: `New book added: "${newBook.title}"` });
    showToast(`"${newBook.title}" was added to the catalog.`, 'success');
    setFormOpen(false);
  };

  const handleEdit = (data: Omit<Book, 'id' | 'availableCopies' | 'status' | 'coverColor' | 'createdAt'>) => {
    if (!editingBook) return;
    const issuedCopies = editingBook.totalCopies - editingBook.availableCopies;
    const newAvailable = Math.max(0, data.totalCopies - issuedCopies);
    const updated: Book = {
      ...editingBook,
      ...data,
      availableCopies: newAvailable,
      status: newAvailable > 0 ? 'Available' : 'Unavailable',
    };
    persist(books.map((b) => (b.id === updated.id ? updated : b)));
    showToast(`"${updated.title}" was updated.`, 'success');
    setEditingBook(null);
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (!deletingBook) return;
    persist(books.filter((b) => b.id !== deletingBook.id));
    showToast(`"${deletingBook.title}" was removed from the catalog.`, 'success');
    setDeletingBook(null);
  };

  const existingIsbns = books.map((b) => b.isbn);
  const issues = useMemo(() => getIssues(), []);
  const hasActiveIssue = (bookId: string) => issues.some((i) => i.bookId === bookId && i.status !== 'Returned');

  return (
    <div className="flex flex-col gap-5" data-testid="books-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900" data-testid="page-heading">Books</h1>
          <p className="text-sm text-ink-600">{filtered.length} of {books.length} titles in the catalog</p>
        </div>
        <button
          type="button"
          data-testid="add-book-button"
          onClick={() => {
            setEditingBook(null);
            setFormOpen(true);
          }}
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg px-4 py-2.5 self-start"
        >
          + Add Book
        </button>
      </div>

      <div className="bg-white rounded-xl border border-ink-900/10 p-4 flex flex-col gap-3" data-testid="books-filters">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-1 gap-2">
            <select
              data-testid="books-search-field"
              value={searchField}
              onChange={(e) => {
                setSearchField(e.target.value as typeof searchField);
                setPage(1);
              }}
              className="border border-ink-900/15 rounded-lg px-2 text-sm bg-white"
            >
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="isbn">ISBN</option>
            </select>
            <input
              data-testid="books-search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={`Search by ${searchField}...`}
              className="flex-1 border border-ink-900/15 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            data-testid="books-category-filter"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="border border-ink-900/15 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <select
            data-testid="books-availability-filter"
            value={availabilityFilter}
            onChange={(e) => {
              setAvailabilityFilter(e.target.value);
              setPage(1);
            }}
            className="border border-ink-900/15 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Any Availability</option>
            <option value="available">Has Copies Available</option>
            <option value="unavailable">Fully Checked Out</option>
          </select>

          <select
            data-testid="books-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border border-ink-900/15 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Any Status</option>
            <option value="Available">Available</option>
            <option value="Unavailable">Unavailable</option>
          </select>

          <button
            type="button"
            data-testid="clear-filters-button"
            onClick={clearFilters}
            className="text-sm font-medium text-brand-600 px-3 py-2 hover:underline"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-ink-900/10 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            testId="books-empty-state"
            title="No books match your search"
            message="Try adjusting your filters or search term, or clear filters to see the full catalog."
            action={
              <button type="button" onClick={clearFilters} className="text-sm font-medium text-brand-600 hover:underline">
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full text-sm" data-testid="books-table">
              <thead>
                <tr className="bg-ink-900/5 text-left text-xs uppercase tracking-wide text-ink-600">
                  <th className="px-4 py-3">Book ID</th>
                  <th className="px-4 py-3">ISBN</th>
                  <th className="px-4 py-3 cursor-pointer" data-testid="sort-title" onClick={() => toggleSort('title')}>
                    Title {sortKey === 'title' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-4 py-3 cursor-pointer" data-testid="sort-author" onClick={() => toggleSort('author')}>
                    Author {sortKey === 'author' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-4 py-3 cursor-pointer" data-testid="sort-category" onClick={() => toggleSort('category')}>
                    Category {sortKey === 'category' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-4 py-3">Publisher</th>
                  <th className="px-4 py-3 cursor-pointer" data-testid="sort-year" onClick={() => toggleSort('publishedYear')}>
                    Year {sortKey === 'publishedYear' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3 cursor-pointer" data-testid="sort-available" onClick={() => toggleSort('availableCopies')}>
                    Available {sortKey === 'availableCopies' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/5">
                {paginated.map((book) => (
                  <tr key={book.id} data-testid={`book-row-${book.id}`} className="hover:bg-ink-900/[0.02]">
                    <td className="px-4 py-3 stamp text-xs">{book.id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-700" data-testid="book-isbn-cell">{book.isbn}</td>
                    <td className="px-4 py-3 font-medium text-ink-900" data-testid="book-title-cell">{book.title}</td>
                    <td className="px-4 py-3 text-ink-700">{book.author}</td>
                    <td className="px-4 py-3 text-ink-700">{book.category}</td>
                    <td className="px-4 py-3 text-ink-700">{book.publisher}</td>
                    <td className="px-4 py-3 text-ink-700">{book.publishedYear}</td>
                    <td className="px-4 py-3 text-ink-700">{book.totalCopies}</td>
                    <td className="px-4 py-3 text-ink-700">{book.availableCopies}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={book.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          data-testid={`view-book-${book.id}`}
                          onClick={() => navigate(`/books/${book.id}`)}
                          className="text-brand-600 hover:underline text-xs font-medium"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          data-testid={`edit-book-${book.id}`}
                          onClick={() => {
                            setEditingBook(book);
                            setFormOpen(true);
                          }}
                          className="text-ink-700 hover:underline text-xs font-medium"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          data-testid={`delete-book-${book.id}`}
                          onClick={() => setDeletingBook(book)}
                          className="text-rust-glow hover:underline text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            testId="books-pagination"
          />
        )}
      </div>

      <BookFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingBook(null);
        }}
        onSubmit={editingBook ? handleEdit : handleAdd}
        categories={categories}
        existingIsbns={existingIsbns}
        initialBook={editingBook}
      />

      <ConfirmDialog
        open={Boolean(deletingBook)}
        title="Delete this book?"
        message={
          deletingBook && hasActiveIssue(deletingBook.id)
            ? `"${deletingBook.title}" has copies currently issued. Deleting it will remove it from the catalog permanently.`
            : `"${deletingBook?.title}" will be permanently removed from the catalog.`
        }
        confirmLabel="Delete Book"
        danger
        testId="delete-book-dialog"
        onConfirm={handleDelete}
        onCancel={() => setDeletingBook(null)}
      />
    </div>
  );
}
