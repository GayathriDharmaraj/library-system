import { useEffect, useState, type FormEvent } from 'react';
import type { Book, Category } from '../types';
import { isValidISBN } from '../utils/validators';
import Modal from './Modal';

interface BookFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Book, 'id' | 'availableCopies' | 'status' | 'coverColor' | 'createdAt'>) => void;
  categories: Category[];
  existingIsbns: string[];
  initialBook?: Book | null;
}

interface FormState {
  isbn: string;
  title: string;
  author: string;
  category: string;
  publisher: string;
  publishedYear: string;
  totalCopies: string;
  description: string;
}

const emptyForm: FormState = {
  isbn: '',
  title: '',
  author: '',
  category: '',
  publisher: '',
  publishedYear: '',
  totalCopies: '',
  description: '',
};

export default function BookFormModal({ open, onClose, onSubmit, categories, existingIsbns, initialBook }: BookFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const isEdit = Boolean(initialBook);

  useEffect(() => {
    if (open) {
      if (initialBook) {
        setForm({
          isbn: initialBook.isbn,
          title: initialBook.title,
          author: initialBook.author,
          category: initialBook.category,
          publisher: initialBook.publisher,
          publishedYear: String(initialBook.publishedYear),
          totalCopies: String(initialBook.totalCopies),
          description: initialBook.description,
        });
      } else {
        setForm(emptyForm);
      }
      setErrors({});
    }
  }, [open, initialBook]);

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    const currentYear = new Date().getFullYear();

    if (!form.isbn.trim()) nextErrors.isbn = 'ISBN is required.';
    else if (!isValidISBN(form.isbn)) nextErrors.isbn = 'Enter a valid 10 or 13 digit ISBN.';
    else if (
      existingIsbns
        .filter((isbn) => !isEdit || isbn !== initialBook?.isbn)
        .includes(form.isbn.replace(/[-\s]/g, ''))
    ) {
      nextErrors.isbn = 'This ISBN already exists in the catalog.';
    }

    if (!form.title.trim()) nextErrors.title = 'Book title is required.';
    else if (form.title.trim().length < 2 || form.title.trim().length > 200) nextErrors.title = 'Title must be 2–200 characters.';

    if (!form.author.trim()) nextErrors.author = 'Author is required.';
    else if (form.author.trim().length < 2 || form.author.trim().length > 100) nextErrors.author = 'Author must be 2–100 characters.';

    if (!form.category) nextErrors.category = 'Please select a category.';
    if (!form.publisher.trim()) nextErrors.publisher = 'Publisher is required.';

    if (!form.publishedYear) nextErrors.publishedYear = 'Published year is required.';
    else {
      const year = Number(form.publishedYear);
      if (Number.isNaN(year) || year < 1450 || year > currentYear) {
        nextErrors.publishedYear = `Enter a year between 1450 and ${currentYear}.`;
      }
    }

    if (!form.totalCopies) nextErrors.totalCopies = 'Number of copies is required.';
    else {
      const copies = Number(form.totalCopies);
      if (Number.isNaN(copies) || copies <= 0) nextErrors.totalCopies = 'Number of copies must be greater than 0.';
    }

    if (form.description.trim().length > 1000) nextErrors.description = 'Description must be under 1000 characters.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      isbn: form.isbn.replace(/[-\s]/g, ''),
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category,
      publisher: form.publisher.trim(),
      publishedYear: Number(form.publishedYear),
      totalCopies: Number(form.totalCopies),
      description: form.description.trim(),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Book' : 'Add Book'} testId="book-form-modal" widthClass="max-w-2xl">
      <form onSubmit={handleSubmit} noValidate data-testid="book-form" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-1">
          <label htmlFor="book-isbn" className="block text-sm font-medium text-ink-800 mb-1">ISBN</label>
          <input
            id="book-isbn"
            data-testid="book-isbn"
            value={form.isbn}
            onChange={(e) => setField('isbn', e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.isbn ? 'border-rust-glow' : 'border-ink-900/15'}`}
            placeholder="9780XXXXXXXXX"
          />
          {errors.isbn && <p data-testid="book-isbn-error" role="alert" className="text-rust-glow text-xs mt-1">{errors.isbn}</p>}
        </div>

        <div>
          <label htmlFor="book-title" className="block text-sm font-medium text-ink-800 mb-1">Book Title</label>
          <input
            id="book-title"
            data-testid="book-title"
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.title ? 'border-rust-glow' : 'border-ink-900/15'}`}
          />
          {errors.title && <p data-testid="book-title-error" role="alert" className="text-rust-glow text-xs mt-1">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="book-author" className="block text-sm font-medium text-ink-800 mb-1">Author</label>
          <input
            id="book-author"
            data-testid="book-author"
            value={form.author}
            onChange={(e) => setField('author', e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.author ? 'border-rust-glow' : 'border-ink-900/15'}`}
          />
          {errors.author && <p data-testid="book-author-error" role="alert" className="text-rust-glow text-xs mt-1">{errors.author}</p>}
        </div>

        <div>
          <label htmlFor="book-category" className="block text-sm font-medium text-ink-800 mb-1">Category</label>
          <select
            id="book-category"
            data-testid="book-category"
            value={form.category}
            onChange={(e) => setField('category', e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm bg-white ${errors.category ? 'border-rust-glow' : 'border-ink-900/15'}`}
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          {errors.category && <p data-testid="book-category-error" role="alert" className="text-rust-glow text-xs mt-1">{errors.category}</p>}
        </div>

        <div>
          <label htmlFor="book-publisher" className="block text-sm font-medium text-ink-800 mb-1">Publisher</label>
          <input
            id="book-publisher"
            data-testid="book-publisher"
            value={form.publisher}
            onChange={(e) => setField('publisher', e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.publisher ? 'border-rust-glow' : 'border-ink-900/15'}`}
          />
          {errors.publisher && <p data-testid="book-publisher-error" role="alert" className="text-rust-glow text-xs mt-1">{errors.publisher}</p>}
        </div>

        <div>
          <label htmlFor="book-published-year" className="block text-sm font-medium text-ink-800 mb-1">Published Year</label>
          <input
            id="book-published-year"
            data-testid="book-published-year"
            type="number"
            value={form.publishedYear}
            onChange={(e) => setField('publishedYear', e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.publishedYear ? 'border-rust-glow' : 'border-ink-900/15'}`}
          />
          {errors.publishedYear && <p data-testid="book-published-year-error" role="alert" className="text-rust-glow text-xs mt-1">{errors.publishedYear}</p>}
        </div>

        <div>
          <label htmlFor="book-total-copies" className="block text-sm font-medium text-ink-800 mb-1">Number of Copies</label>
          <input
            id="book-total-copies"
            data-testid="book-total-copies"
            type="number"
            value={form.totalCopies}
            onChange={(e) => setField('totalCopies', e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.totalCopies ? 'border-rust-glow' : 'border-ink-900/15'}`}
          />
          {errors.totalCopies && <p data-testid="book-total-copies-error" role="alert" className="text-rust-glow text-xs mt-1">{errors.totalCopies}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="book-description" className="block text-sm font-medium text-ink-800 mb-1">Description</label>
          <textarea
            id="book-description"
            data-testid="book-description"
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            rows={3}
            className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.description ? 'border-rust-glow' : 'border-ink-900/15'}`}
          />
          {errors.description && <p data-testid="book-description-error" role="alert" className="text-rust-glow text-xs mt-1">{errors.description}</p>}
        </div>

        <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
          <button
            type="button"
            data-testid="cancel-book-button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-ink-900/15 text-ink-800 hover:bg-ink-900/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            data-testid="save-book-button"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white"
          >
            {isEdit ? 'Save Changes' : 'Add Book'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
