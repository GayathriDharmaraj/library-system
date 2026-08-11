import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Categories from './Categories';
import ToastStack from '../components/ToastStack';
import { renderWithProviders } from '../test/test-utils';
import { setBooks, setCategories, getCategories } from '../services/storage';
import type { Book, Category } from '../types';

const category = (overrides: Partial<Category>): Category => ({ id: 'CAT-01', name: 'Fiction', ...overrides });

const book = (overrides: Partial<Book>): Book => ({
  id: 'BK-001',
  isbn: '9780743273565',
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  category: 'Fiction',
  publisher: 'Scribner',
  publishedYear: 1925,
  totalCopies: 5,
  availableCopies: 5,
  description: '',
  status: 'Available',
  coverColor: '#4f46e5',
  createdAt: '2026-01-01',
  ...overrides,
});

function renderPage() {
  return renderWithProviders(
    <>
      <Categories />
      <ToastStack />
    </>
  );
}

describe('Categories', () => {
  it('renders the category count and the list of categories', () => {
    setBooks([]);
    setCategories([category({ id: 'CAT-01', name: 'Fiction' }), category({ id: 'CAT-02', name: 'Science' })]);
    renderPage();
    expect(screen.getByText('2 categories in the catalog')).toBeInTheDocument();
    expect(screen.getByTestId('category-row-CAT-01')).toHaveTextContent('Fiction');
    expect(screen.getByTestId('category-row-CAT-02')).toHaveTextContent('Science');
  });

  it('shows the book count assigned to each category', () => {
    setBooks([
      book({ id: 'BK-001', category: 'Fiction' }),
      book({ id: 'BK-002', category: 'Fiction' }),
      book({ id: 'BK-003', category: 'Science' }),
    ]);
    setCategories([category({ id: 'CAT-01', name: 'Fiction' }), category({ id: 'CAT-02', name: 'Science' })]);
    renderPage();
    expect(screen.getByTestId('category-row-CAT-01')).toHaveTextContent('2');
    expect(screen.getByTestId('category-row-CAT-02')).toHaveTextContent('1');
  });

  it('filters categories by search term case-insensitively', async () => {
    setBooks([]);
    setCategories([category({ id: 'CAT-01', name: 'Fiction' }), category({ id: 'CAT-02', name: 'Science' })]);
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByTestId('category-search'), 'FICT');
    expect(screen.getByTestId('category-row-CAT-01')).toBeInTheDocument();
    expect(screen.queryByTestId('category-row-CAT-02')).not.toBeInTheDocument();
  });

  it('shows an empty state when the search matches nothing', async () => {
    setBooks([]);
    setCategories([category({ id: 'CAT-01', name: 'Fiction' })]);
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByTestId('category-search'), 'zzz');
    expect(screen.getByTestId('categories-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('categories-table')).not.toBeInTheDocument();
  });

  it('opens the Add Category modal with an empty field', async () => {
    setBooks([]);
    setCategories([]);
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('add-category-button'));
    expect(screen.getByRole('heading', { name: 'Add Category' })).toBeInTheDocument();
    expect(screen.getByTestId('category-name')).toHaveValue('');
  });

  it('shows a validation error when submitting an empty name', async () => {
    setBooks([]);
    setCategories([]);
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('add-category-button'));
    await user.click(screen.getByTestId('save-category-button'));
    expect(screen.getByTestId('category-name-error')).toHaveTextContent('Category name is required.');
  });

  it('shows a validation error for a name longer than 40 characters', async () => {
    setBooks([]);
    setCategories([]);
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('add-category-button'));
    fireEvent.change(screen.getByTestId('category-name'), { target: { value: 'a'.repeat(41) } });
    await user.click(screen.getByTestId('save-category-button'));
    expect(screen.getByTestId('category-name-error')).toHaveTextContent('Category name must be under 40 characters.');
  });

  it('shows a validation error for a duplicate name, case-insensitively', async () => {
    setBooks([]);
    setCategories([category({ id: 'CAT-01', name: 'Fiction' })]);
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('add-category-button'));
    await user.type(screen.getByTestId('category-name'), 'fiction');
    await user.click(screen.getByTestId('save-category-button'));
    expect(screen.getByTestId('category-name-error')).toHaveTextContent('A category with this name already exists.');
  });

  it('adds a new category, persists it, and shows a success toast', async () => {
    setBooks([]);
    setCategories([]);
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('add-category-button'));
    await user.type(screen.getByTestId('category-name'), 'Poetry');
    await user.click(screen.getByTestId('save-category-button'));
    expect(screen.getByTestId('toast-success')).toHaveTextContent('Category "Poetry" added.');
    expect(getCategories()).toEqual([{ id: 'CAT-001', name: 'Poetry' }]);
    expect(screen.queryByRole('heading', { name: 'Add Category' })).not.toBeInTheDocument();
  });

  it('opens the Edit modal pre-filled with the existing name', async () => {
    setBooks([]);
    setCategories([category({ id: 'CAT-01', name: 'Fiction' })]);
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('edit-category-CAT-01'));
    expect(screen.getByRole('heading', { name: 'Edit Category' })).toBeInTheDocument();
    expect(screen.getByTestId('category-name')).toHaveValue('Fiction');
  });

  it('renames a category, persists the change, and shows a success toast', async () => {
    setBooks([]);
    setCategories([category({ id: 'CAT-01', name: 'Fiction' })]);
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('edit-category-CAT-01'));
    await user.clear(screen.getByTestId('category-name'));
    await user.type(screen.getByTestId('category-name'), 'Classic Fiction');
    await user.click(screen.getByTestId('save-category-button'));
    expect(screen.getByTestId('toast-success')).toHaveTextContent('Category renamed to "Classic Fiction".');
    expect(getCategories()).toEqual([{ id: 'CAT-01', name: 'Classic Fiction' }]);
  });

  it('allows saving an edit with the name unchanged, without triggering a duplicate error', async () => {
    setBooks([]);
    setCategories([category({ id: 'CAT-01', name: 'Fiction' }), category({ id: 'CAT-02', name: 'Science' })]);
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('edit-category-CAT-01'));
    await user.click(screen.getByTestId('save-category-button'));
    expect(screen.queryByTestId('category-name-error')).not.toBeInTheDocument();
    expect(screen.getByTestId('toast-success')).toHaveTextContent('Category renamed to "Fiction".');
  });

  it('cancelling the form modal discards changes', async () => {
    setBooks([]);
    setCategories([category({ id: 'CAT-01', name: 'Fiction' })]);
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('add-category-button'));
    await user.type(screen.getByTestId('category-name'), 'Poetry');
    await user.click(screen.getByTestId('cancel-category-button'));
    expect(screen.queryByRole('heading', { name: 'Add Category' })).not.toBeInTheDocument();
    expect(getCategories()).toEqual([category({ id: 'CAT-01', name: 'Fiction' })]);
  });

  it('deletes an unused category after confirmation and shows a success toast', async () => {
    setBooks([]);
    setCategories([category({ id: 'CAT-01', name: 'Fiction' })]);
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('delete-category-CAT-01'));
    expect(screen.getByTestId('delete-category-dialog')).toBeInTheDocument();
    await user.click(screen.getByTestId('delete-category-dialog-confirm'));
    expect(screen.getByTestId('toast-success')).toHaveTextContent('Category "Fiction" deleted.');
    expect(getCategories()).toEqual([]);
  });

  it('blocks deleting a category that still has books assigned, and keeps it in the list', async () => {
    setBooks([book({ id: 'BK-001', category: 'Fiction' })]);
    setCategories([category({ id: 'CAT-01', name: 'Fiction' })]);
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('delete-category-CAT-01'));
    await user.click(screen.getByTestId('delete-category-dialog-confirm'));
    expect(screen.getByTestId('toast-error')).toHaveTextContent(
      `Can't delete "Fiction" — books are still assigned to it.`
    );
    expect(getCategories()).toEqual([category({ id: 'CAT-01', name: 'Fiction' })]);
    expect(screen.getByTestId('category-row-CAT-01')).toBeInTheDocument();
  });

  it('cancelling the delete confirmation leaves the category intact', async () => {
    setBooks([]);
    setCategories([category({ id: 'CAT-01', name: 'Fiction' })]);
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('delete-category-CAT-01'));
    await user.click(screen.getByTestId('delete-category-dialog-cancel'));
    expect(screen.queryByTestId('delete-category-dialog')).not.toBeInTheDocument();
    expect(getCategories()).toEqual([category({ id: 'CAT-01', name: 'Fiction' })]);
  });
});
