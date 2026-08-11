import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from './Pagination';

describe('Pagination', () => {
  it('shows the correct range label for a middle page', () => {
    render(
      <Pagination page={2} pageSize={10} total={25} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} testId="pg" />
    );
    expect(screen.getByTestId('pg-range-label')).toHaveTextContent('Showing 11–20 of 25');
  });

  it('shows "No results" when total is 0', () => {
    render(
      <Pagination page={1} pageSize={10} total={0} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} testId="pg" />
    );
    expect(screen.getByTestId('pg-range-label')).toHaveTextContent('No results');
  });

  it('clamps the end item to the total on the last page', () => {
    render(
      <Pagination page={3} pageSize={10} total={25} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} testId="pg" />
    );
    expect(screen.getByTestId('pg-range-label')).toHaveTextContent('Showing 21–25 of 25');
  });

  it('disables Prev on the first page', () => {
    render(
      <Pagination page={1} pageSize={10} total={25} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} testId="pg" />
    );
    expect(screen.getByTestId('pg-prev')).toBeDisabled();
    expect(screen.getByTestId('pg-next')).not.toBeDisabled();
  });

  it('disables Next on the last page', () => {
    render(
      <Pagination page={3} pageSize={10} total={25} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} testId="pg" />
    );
    expect(screen.getByTestId('pg-next')).toBeDisabled();
    expect(screen.getByTestId('pg-prev')).not.toBeDisabled();
  });

  it('calls onPageChange with the next page when Next is clicked', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Pagination page={1} pageSize={10} total={25} onPageChange={onPageChange} onPageSizeChange={vi.fn()} testId="pg" />
    );
    await user.click(screen.getByTestId('pg-next'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with the previous page when Prev is clicked', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Pagination page={2} pageSize={10} total={25} onPageChange={onPageChange} onPageSizeChange={vi.fn()} testId="pg" />
    );
    await user.click(screen.getByTestId('pg-prev'));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageSizeChange with the numeric value when the page size select changes', async () => {
    const onPageSizeChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Pagination page={1} pageSize={10} total={25} onPageChange={vi.fn()} onPageSizeChange={onPageSizeChange} testId="pg" />
    );
    await user.selectOptions(screen.getByTestId('pg-page-size'), '25');
    expect(onPageSizeChange).toHaveBeenCalledWith(25);
  });

  it('computes total pages as at least 1 even when total is 0', () => {
    render(
      <Pagination page={1} pageSize={10} total={0} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} testId="pg" />
    );
    expect(screen.getByTestId('pg-current')).toHaveTextContent('1 / 1');
  });
});
