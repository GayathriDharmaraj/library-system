import { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { useToast } from '../context/ToastContext';
import { getBooks, getIssues, getMembers } from '../services/storage';
import { formatDate } from '../utils/dateUtils';
import { calculateFine, overdueDays, overdueSeverity } from '../utils/fine';

const severityStyles: Record<string, string> = {
  low: 'bg-amber-glow/15 text-amber-glow border-amber-glow/40',
  medium: 'bg-clay-500/15 text-clay-600 border-clay-500/40',
  high: 'bg-rust-glow/15 text-rust-glow border-rust-glow/40',
};

const severityLabel: Record<string, string> = {
  low: '1–3 days',
  medium: '4–7 days',
  high: '7+ days',
};

export default function OverdueBooks() {
  const { showToast } = useToast();
  const books = useMemo(() => getBooks(), []);
  const members = useMemo(() => getMembers(), []);
  const issues = useMemo(() => getIssues(), []);

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const overdueList = useMemo(() => {
    let list = issues
      .filter((i) => i.status !== 'Returned')
      .map((issue) => {
        const days = overdueDays(issue.dueDate, null);
        return { issue, days, fine: calculateFine(issue.dueDate, null), severity: overdueSeverity(days) };
      })
      .filter((item) => item.days > 0);

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter(({ issue }) => {
        const member = members.find((m) => m.id === issue.memberId);
        const book = books.find((b) => b.id === issue.bookId);
        return (
          member?.firstName.toLowerCase().includes(term) ||
          member?.lastName.toLowerCase().includes(term) ||
          book?.title.toLowerCase().includes(term)
        );
      });
    }
    if (severityFilter) list = list.filter((item) => item.severity === severityFilter);

    list.sort((a, b) => (sortDir === 'asc' ? a.days - b.days : b.days - a.days));
    return list;
  }, [issues, members, books, search, severityFilter, sortDir]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return overdueList.slice(start, start + pageSize);
  }, [overdueList, page, pageSize]);

  return (
    <div className="flex flex-col gap-5" data-testid="overdue-books-page">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink-900" data-testid="page-heading">Overdue Books</h1>
        <p className="text-sm text-ink-600">{overdueList.length} books past their due date</p>
      </div>

      <div className="bg-white rounded-xl border border-ink-900/10 p-4 flex flex-wrap gap-3" data-testid="overdue-filters">
        <input
          data-testid="overdue-search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by member or book..."
          className="flex-1 min-w-[200px] border border-ink-900/15 rounded-lg px-3 py-2 text-sm"
        />
        <select
          data-testid="overdue-severity-filter"
          value={severityFilter}
          onChange={(e) => {
            setSeverityFilter(e.target.value);
            setPage(1);
          }}
          className="border border-ink-900/15 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Any Severity</option>
          <option value="low">1–3 days</option>
          <option value="medium">4–7 days</option>
          <option value="high">More than 7 days</option>
        </select>
        <button
          type="button"
          data-testid="overdue-sort-toggle"
          onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
          className="border border-ink-900/15 rounded-lg px-3 py-2 text-sm bg-white hover:bg-ink-900/5"
        >
          Sort by days {sortDir === 'asc' ? '▲' : '▼'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-ink-900/10 overflow-hidden">
        {overdueList.length === 0 ? (
          <EmptyState testId="overdue-empty-state" title="No overdue books" message="Every borrowed book is within its due date. Nice work!" />
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full text-sm" data-testid="overdue-table">
              <thead>
                <tr className="bg-ink-900/5 text-left text-xs uppercase tracking-wide text-ink-600">
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Book</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Days Overdue</th>
                  <th className="px-4 py-3">Fine</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/5">
                {paginated.map(({ issue, days, fine, severity }) => {
                  const member = members.find((m) => m.id === issue.memberId);
                  const book = books.find((b) => b.id === issue.bookId);
                  return (
                    <tr key={issue.id} data-testid={`overdue-row-${issue.id}`} className="hover:bg-ink-900/[0.02]">
                      <td className="px-4 py-3 text-ink-900">{member ? `${member.firstName} ${member.lastName}` : 'Unknown'}</td>
                      <td className="px-4 py-3 text-ink-900">{book?.title ?? 'Unknown'}</td>
                      <td className="px-4 py-3 text-ink-700">{formatDate(issue.issueDate)}</td>
                      <td className="px-4 py-3 text-ink-700">{formatDate(issue.dueDate)}</td>
                      <td className="px-4 py-3">
                        <span
                          data-testid={`overdue-severity-${issue.id}`}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${severityStyles[severity]}`}
                          title={severityLabel[severity]}
                        >
                          {days} days
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-700">₹{fine}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          data-testid={`contact-member-${issue.id}`}
                          onClick={() =>
                            showToast(
                              `A reminder email would be sent to ${member?.email ?? 'the member'} in a live system.`,
                              'info'
                            )
                          }
                          className="text-brand-600 hover:underline text-xs font-medium"
                        >
                          Contact Member
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {overdueList.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={overdueList.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            testId="overdue-pagination"
          />
        )}
      </div>
    </div>
  );
}
