import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { getBooks, getIssues, getMembers } from '../services/storage';
import { formatDate } from '../utils/dateUtils';

export default function MemberDetails() {
  const { id } = useParams();
  const members = useMemo(() => getMembers(), []);
  const books = useMemo(() => getBooks(), []);
  const issues = useMemo(() => getIssues(), []);

  const member = members.find((m) => m.id === id);
  const history = issues
    .filter((i) => i.memberId === id)
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

  if (!member) {
    return (
      <div data-testid="member-details-page">
        <EmptyState
          testId="member-not-found"
          title="Member not found"
          message="This member may have been removed."
          action={
            <Link to="/members" className="text-sm font-medium text-brand-600 hover:underline">
              Back to Members
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" data-testid="member-details-page">
      <div>
        <Link to="/members" className="text-sm text-brand-600 hover:underline" data-testid="back-to-members">
          ← Back to Members
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-ink-900/10 p-6 flex flex-col sm:flex-row gap-6">
        <div
          className="w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center text-white font-display font-bold text-2xl self-center sm:self-start bg-brand-600"
          aria-hidden="true"
        >
          {member.firstName.charAt(0)}{member.lastName.charAt(0)}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="font-display font-bold text-2xl text-ink-900" data-testid="page-heading">
                {member.firstName} {member.lastName}
              </h1>
              <p className="text-ink-600 text-sm">{member.membershipType} Member since {formatDate(member.joinDate)}</p>
            </div>
            <StatusBadge status={member.status} />
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 text-sm">
            <div>
              <dt className="text-ink-600 text-xs uppercase tracking-wide">Email</dt>
              <dd className="text-ink-900">{member.email}</dd>
            </div>
            <div>
              <dt className="text-ink-600 text-xs uppercase tracking-wide">Phone</dt>
              <dd className="text-ink-900">{member.phone}</dd>
            </div>
            <div>
              <dt className="text-ink-600 text-xs uppercase tracking-wide">Date of Birth</dt>
              <dd className="text-ink-900">{formatDate(member.dob)}</dd>
            </div>
            <div>
              <dt className="text-ink-600 text-xs uppercase tracking-wide">Membership Start</dt>
              <dd className="text-ink-900">{formatDate(member.membershipStart)}</dd>
            </div>
            <div>
              <dt className="text-ink-600 text-xs uppercase tracking-wide">Membership Expiry</dt>
              <dd className="text-ink-900">{formatDate(member.membershipExpiry)}</dd>
            </div>
            <div>
              <dt className="text-ink-600 text-xs uppercase tracking-wide">Books Currently Issued</dt>
              <dd className="text-ink-900" data-testid="member-books-issued">{member.booksIssued}</dd>
            </div>
            <div className="sm:col-span-3">
              <dt className="text-ink-600 text-xs uppercase tracking-wide">Address</dt>
              <dd className="text-ink-900">{member.address}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-ink-900/10 overflow-hidden">
        <h3 className="font-display font-semibold text-sm text-ink-900 px-4 pt-4 pb-2">Borrowing History</h3>
        {history.length === 0 ? (
          <EmptyState testId="member-history-empty" title="No borrowing history" message="This member hasn't issued any books yet." />
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink-900/5 text-left text-xs uppercase tracking-wide text-ink-600">
                  <th className="px-4 py-3">Book</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Return Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/5">
                {history.map((record) => {
                  const book = books.find((b) => b.id === record.bookId);
                  return (
                    <tr key={record.id} data-testid={`member-history-row-${record.id}`}>
                      <td className="px-4 py-3 text-ink-900">{book?.title ?? 'Unknown Book'}</td>
                      <td className="px-4 py-3 text-ink-700">{formatDate(record.issueDate)}</td>
                      <td className="px-4 py-3 text-ink-700">{formatDate(record.dueDate)}</td>
                      <td className="px-4 py-3 text-ink-700">{formatDate(record.returnDate)}</td>
                      <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                      <td className="px-4 py-3 text-ink-700">₹{record.fine}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
