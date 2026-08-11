import { useMemo, useState, type FormEvent } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import type { Category } from '../types';
import { getBooks, getCategories, nextId, setCategories } from '../services/storage';

export default function Categories() {
  const { showToast } = useToast();
  const books = useMemo(() => getBooks(), []);
  const [categories, setCategoriesState] = useState<Category[]>(() => getCategories());
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const persist = (next: Category[]) => {
    setCategoriesState(next);
    setCategories(next);
  };

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()));

  const bookCountFor = (categoryName: string) => books.filter((b) => b.category === categoryName).length;

  const openAdd = () => {
    setEditingCategory(null);
    setName('');
    setError('');
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setError('');
    setFormOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Category name is required.');
      return;
    }
    if (trimmed.length > 40) {
      setError('Category name must be under 40 characters.');
      return;
    }
    const duplicate = categories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== editingCategory?.id
    );
    if (duplicate) {
      setError('A category with this name already exists.');
      return;
    }

    if (editingCategory) {
      persist(categories.map((c) => (c.id === editingCategory.id ? { ...c, name: trimmed } : c)));
      showToast(`Category renamed to "${trimmed}".`, 'success');
    } else {
      const newCategory: Category = { id: nextId('CAT', categories.map((c) => c.id)), name: trimmed };
      persist([...categories, newCategory]);
      showToast(`Category "${trimmed}" added.`, 'success');
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (!deletingCategory) return;
    if (bookCountFor(deletingCategory.name) > 0) {
      showToast(`Can't delete "${deletingCategory.name}" — books are still assigned to it.`, 'error');
      setDeletingCategory(null);
      return;
    }
    persist(categories.filter((c) => c.id !== deletingCategory.id));
    showToast(`Category "${deletingCategory.name}" deleted.`, 'success');
    setDeletingCategory(null);
  };

  return (
    <div className="flex flex-col gap-5" data-testid="categories-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900" data-testid="page-heading">Categories</h1>
          <p className="text-sm text-ink-600">{categories.length} categories in the catalog</p>
        </div>
        <button
          type="button"
          data-testid="add-category-button"
          onClick={openAdd}
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg px-4 py-2.5 self-start"
        >
          + Add Category
        </button>
      </div>

      <input
        data-testid="category-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search categories..."
        className="border border-ink-900/15 rounded-lg px-3 py-2 text-sm bg-white max-w-sm"
      />

      <div className="bg-white rounded-xl border border-ink-900/10 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState testId="categories-empty-state" title="No categories found" message="Try a different search term." />
        ) : (
          <table className="w-full text-sm" data-testid="categories-table">
            <thead>
              <tr className="bg-ink-900/5 text-left text-xs uppercase tracking-wide text-ink-600">
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Books Assigned</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/5">
              {filtered.map((category) => (
                <tr key={category.id} data-testid={`category-row-${category.id}`}>
                  <td className="px-4 py-3 font-medium text-ink-900">{category.name}</td>
                  <td className="px-4 py-3 text-ink-700">{bookCountFor(category.name)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        data-testid={`edit-category-${category.id}`}
                        onClick={() => openEdit(category)}
                        className="text-ink-700 hover:underline text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        data-testid={`delete-category-${category.id}`}
                        onClick={() => setDeletingCategory(category)}
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
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingCategory ? 'Edit Category' : 'Add Category'} testId="category-form-modal">
        <form onSubmit={handleSubmit} noValidate data-testid="category-form" className="flex flex-col gap-4">
          <div>
            <label htmlFor="category-name" className="block text-sm font-medium text-ink-800 mb-1">Category Name</label>
            <input
              id="category-name"
              data-testid="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm ${error ? 'border-rust-glow' : 'border-ink-900/15'}`}
            />
            {error && <p data-testid="category-name-error" role="alert" className="text-rust-glow text-xs mt-1">{error}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              data-testid="cancel-category-button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-ink-900/15 text-ink-800 hover:bg-ink-900/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="save-category-button"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white"
            >
              {editingCategory ? 'Save Changes' : 'Add Category'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingCategory)}
        title="Delete this category?"
        message={`"${deletingCategory?.name}" will be permanently removed. This can't be undone if no books are assigned to it.`}
        confirmLabel="Delete Category"
        danger
        testId="delete-category-dialog"
        onConfirm={handleDelete}
        onCancel={() => setDeletingCategory(null)}
      />
    </div>
  );
}
