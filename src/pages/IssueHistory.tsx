import { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { getBooks, getIssues, getMembers } from '../services/storage';
import { formatDate } from '../utils/dateUtils';

export default function IssueHistory() {
  const books = useMemo(() => getBooks(), []);
  const members = useMemo(() => getMembers(), []);
  const issues = useMemo(() => getIssues(), []);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [bookFilter, setBookFilter] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    let result = [...issues];
    if (fromDate) result = result.filter((i) => i.issueDate >= fromDate);
    if (toDate) result = result.filter((i) => i.issueDate <= toDate);
    if (bookFilter) result = result.filter((i) => i.bookId === bookFilter);
    if (memberFilter) result = result.filter((i) => i.memberId === memberFilter);
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    return result.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [issues, fromDate, toDate, bookFilter, memberFilter, statusFilter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setBookFilter('');
    setMemberFilter('');
    setStatusFilter('');
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-5" data-testid="issue-history-page">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink-900" data-testid="page-heading">Issue History</h1>
        <p className="text-sm text-ink-600">{filtered.length} of {issues.length} total issue records</p>
      </div>

      <div className="bg-white rounded-xl border border-ink-900/10 p-4 flex flex-wrap gap-3" data-testid="issue-history-filters">
        <div className="flex items-center gap-2">
          <label htmlFor="history-from-date" className="text-xs text-ink-600">From</label>
          <input
            id="history-from-date"
            data-testid="history-from-date"
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className="border border-ink-900/15 rounded-lg px-2 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="history-to-date" className="text-xs text-ink-600">To</label>
          <input
            id="history-to-date"
            data-testid="history-to-date"
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="border border-ink-900/15 rounded-lg px-2 py-2 text-sm"
          />
        </div>
        <select
          data-testid="history-book-filter"
          value={bookFilter}
          onChange={(e) => {
            setBookFilter(e.target.value);
            setPage(1);
          }}
          className="border border-ink-900/15 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Books</option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>{b.title}</option>
          ))}
        </select>
        <select
          data-testid="history-member-filter"
          value={memberFilter}
          onChange={(e) => {
            setMemberFilter(e.target.value);
            setPage(1);
          }}
          className="border border-ink-900/15 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Members</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
          ))}
        </select>
        <select
          data-testid="history-status-filter"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border border-ink-900/15 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Any Status</option>
          <option value="Issued">Issued</option>
          <option value="Returned">Returned</option>
          <option value="Overdue">Overdue</option>
        </select>
        <button
          type="button"
          data-testid="clear-history-filters-button"
          onClick={clearFilters}
          className="text-sm font-medium text-brand-600 px-3 py-2 hover:underline"
        >
          Clear Filters
        </button>
      </div>

      <div className="bg-white rounded-xl border border-ink-900/10 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState testId="issue-history-empty" title="No matching issue records" message="Try adjusting the filters above." />
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full text-sm" data-testid="issue-history-table">
              <thead>
                <tr className="bg-ink-900/5 text-left text-xs uppercase tracking-wide text-ink-600">
                  <th className="px-4 py-3">Issue ID</th>
                  <th className="px-4 py-3">Book</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Return Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/5">
                {paginated.map((issue) => {
                  const book = books.find((b) => b.id === issue.bookId);
                  const member = members.find((m) => m.id === issue.memberId);
                  return (
                    <tr key={issue.id} data-testid={`history-row-${issue.id}`} className="hover:bg-ink-900/[0.02]">
                      <td className="px-4 py-3 stamp text-xs">{issue.id}</td>
                      <td className="px-4 py-3 text-ink-900">{book?.title ?? 'Unknown'}</td>
                      <td className="px-4 py-3 text-ink-900">{member ? `${member.firstName} ${member.lastName}` : 'Unknown'}</td>
                      <td className="px-4 py-3 text-ink-700">{formatDate(issue.issueDate)}</td>
                      <td className="px-4 py-3 text-ink-700">{formatDate(issue.dueDate)}</td>
                      <td className="px-4 py-3 text-ink-700">{formatDate(issue.returnDate)}</td>
                      <td className="px-4 py-3"><StatusBadge status={issue.status} /></td>
                      <td className="px-4 py-3 text-ink-700">₹{issue.fine}</td>
                    </tr>
                  );
                })}
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
            testId="issue-history-pagination"
          />
        )}
      </div>
    </div>
  );
}
