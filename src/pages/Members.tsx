import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import MemberFormModal from '../components/MemberFormModal';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import type { Member } from '../types';
import { getIssues, getMembers, nextId, pushActivity, setMembers } from '../services/storage';
import { formatDate, todayISO } from '../utils/dateUtils';

export default function Members() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [members, setMembersState] = useState<Member[]>(() => getMembers());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);

  const issues = useMemo(() => getIssues(), []);

  const persist = (next: Member[]) => {
    setMembersState(next);
    setMembers(next);
  };

  const filtered = useMemo(() => {
    let result = [...members];
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (m) =>
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(term) ||
          m.email.toLowerCase().includes(term) ||
          m.phone.includes(term)
      );
    }
    if (typeFilter) result = result.filter((m) => m.membershipType === typeFilter);
    if (statusFilter) result = result.filter((m) => m.status === statusFilter);
    return result;
  }, [members, search, typeFilter, statusFilter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const handleAdd = (data: Omit<Member, 'id' | 'status' | 'joinDate' | 'booksIssued'>) => {
    const id = nextId('MEM', members.map((m) => m.id));
    const newMember: Member = {
      ...data,
      id,
      status: 'Active',
      joinDate: todayISO(),
      booksIssued: 0,
    };
    persist([newMember, ...members]);
    pushActivity({ type: 'member', message: `New member registered: ${newMember.firstName} ${newMember.lastName}` });
    showToast(`${newMember.firstName} ${newMember.lastName} was registered.`, 'success');
    setFormOpen(false);
  };

  const handleEdit = (data: Omit<Member, 'id' | 'status' | 'joinDate' | 'booksIssued'>) => {
    if (!editingMember) return;
    const updated: Member = { ...editingMember, ...data };
    persist(members.map((m) => (m.id === updated.id ? updated : m)));
    showToast(`${updated.firstName} ${updated.lastName}'s details were updated.`, 'success');
    setEditingMember(null);
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (!deletingMember) return;
    persist(members.filter((m) => m.id !== deletingMember.id));
    showToast(`${deletingMember.firstName} ${deletingMember.lastName} was removed.`, 'success');
    setDeletingMember(null);
  };

  const existingEmails = members.map((m) => m.email);
  const hasActiveLoans = (memberId: string) => issues.some((i) => i.memberId === memberId && i.status !== 'Returned');

  return (
    <div className="flex flex-col gap-5" data-testid="members-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900" data-testid="page-heading">Members</h1>
          <p className="text-sm text-ink-600">{filtered.length} of {members.length} registered members</p>
        </div>
        <button
          type="button"
          data-testid="add-member-button"
          onClick={() => {
            setEditingMember(null);
            setFormOpen(true);
          }}
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg px-4 py-2.5 self-start"
        >
          + New Member
        </button>
      </div>

      <div className="bg-white rounded-xl border border-ink-900/10 p-4 flex flex-wrap gap-3" data-testid="members-filters">
        <input
          data-testid="member-search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name, email, or phone..."
          className="flex-1 min-w-[200px] border border-ink-900/15 rounded-lg px-3 py-2 text-sm"
        />
        <select
          data-testid="member-type-filter"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="border border-ink-900/15 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Membership Types</option>
          <option value="Basic">Basic</option>
          <option value="Premium">Premium</option>
          <option value="Student">Student</option>
        </select>
        <select
          data-testid="member-status-filter"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border border-ink-900/15 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Any Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <button
          type="button"
          data-testid="clear-member-filters-button"
          onClick={clearFilters}
          className="text-sm font-medium text-brand-600 px-3 py-2 hover:underline"
        >
          Clear Filters
        </button>
      </div>

      <div className="bg-white rounded-xl border border-ink-900/10 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            testId="members-empty-state"
            title="No members found"
            message="Try a different search term or clear your filters."
            action={
              <button type="button" onClick={clearFilters} className="text-sm font-medium text-brand-600 hover:underline">
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full text-sm" data-testid="members-table">
              <thead>
                <tr className="bg-ink-900/5 text-left text-xs uppercase tracking-wide text-ink-600">
                  <th className="px-4 py-3">Member ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Membership</th>
                  <th className="px-4 py-3">Join Date</th>
                  <th className="px-4 py-3">Books Issued</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/5">
                {paginated.map((member) => (
                  <tr key={member.id} data-testid={`member-row-${member.id}`} className="hover:bg-ink-900/[0.02]">
                    <td className="px-4 py-3 stamp text-xs">{member.id}</td>
                    <td className="px-4 py-3 font-medium text-ink-900" data-testid="member-name-cell">
                      {member.firstName} {member.lastName}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{member.email}</td>
                    <td className="px-4 py-3 text-ink-700">{member.phone}</td>
                    <td className="px-4 py-3 text-ink-700">{member.membershipType}</td>
                    <td className="px-4 py-3 text-ink-700">{formatDate(member.joinDate)}</td>
                    <td className="px-4 py-3 text-ink-700">{member.booksIssued}</td>
                    <td className="px-4 py-3"><StatusBadge status={member.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          data-testid={`view-member-${member.id}`}
                          onClick={() => navigate(`/members/${member.id}`)}
                          className="text-brand-600 hover:underline text-xs font-medium"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          data-testid={`edit-member-${member.id}`}
                          onClick={() => {
                            setEditingMember(member);
                            setFormOpen(true);
                          }}
                          className="text-ink-700 hover:underline text-xs font-medium"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          data-testid={`delete-member-${member.id}`}
                          onClick={() => setDeletingMember(member)}
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
            testId="members-pagination"
          />
        )}
      </div>

      <MemberFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingMember(null);
        }}
        onSubmit={editingMember ? handleEdit : handleAdd}
        existingEmails={existingEmails}
        initialMember={editingMember}
      />

      <ConfirmDialog
        open={Boolean(deletingMember)}
        title="Delete this member?"
        message={
          deletingMember && hasActiveLoans(deletingMember.id)
            ? `${deletingMember.firstName} ${deletingMember.lastName} has active book loans. Deleting this member will remove their record permanently.`
            : `${deletingMember?.firstName} ${deletingMember?.lastName} will be permanently removed.`
        }
        confirmLabel="Delete Member"
        danger
        testId="delete-member-dialog"
        onConfirm={handleDelete}
        onCancel={() => setDeletingMember(null)}
      />
    </div>
  );
}
