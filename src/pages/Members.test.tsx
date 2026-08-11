import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import ToastStack from '../components/ToastStack';
import Members from './Members';
import { setMembers, setIssues, getMembers, getActivity } from '../services/storage';
import type { Member, IssueRecord } from '../types';

function MemberIdMarker() {
  const { id } = useParams();
  return <div data-testid="member-details-marker">{id}</div>;
}

function renderMembers(initialEntry = '/members') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/members" element={<Members />} />
            <Route path="/members/:id" element={<MemberIdMarker />} />
          </Routes>
          <ToastStack />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    id: 'MEM-001',
    firstName: 'Aarav',
    lastName: 'Sharma',
    email: 'aarav.sharma@mail.com',
    phone: '9876543210',
    dob: '1990-01-15',
    address: '100 MG Road, Bengaluru, KA',
    membershipType: 'Basic',
    membershipStart: '2025-01-01',
    membershipExpiry: '2027-01-01',
    status: 'Active',
    joinDate: '2025-01-01',
    booksIssued: 0,
    ...overrides,
  };
}

describe('Members page', () => {
  it('shows an empty state when there are no members', () => {
    setMembers([]);
    renderMembers();
    expect(screen.getByTestId('members-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('members-table')).not.toBeInTheDocument();
  });

  it('renders a row for each member with key fields', () => {
    setMembers([
      makeMember({ id: 'MEM-001', firstName: 'Aarav', lastName: 'Sharma' }),
      makeMember({ id: 'MEM-002', firstName: 'Isha', lastName: 'Verma', email: 'isha.verma@mail.com' }),
    ]);
    renderMembers();
    expect(screen.getByTestId('member-row-MEM-001')).toHaveTextContent('Aarav Sharma');
    expect(screen.getByTestId('member-row-MEM-002')).toHaveTextContent('Isha Verma');
    expect(screen.getByText('2 of 2 registered members')).toBeInTheDocument();
  });

  it('filters members by search term across name, email, and phone', async () => {
    setMembers([
      makeMember({ id: 'MEM-001', firstName: 'Aarav', lastName: 'Sharma', email: 'aarav.sharma@mail.com' }),
      makeMember({ id: 'MEM-002', firstName: 'Isha', lastName: 'Verma', email: 'isha.verma@mail.com', phone: '9812345678' }),
    ]);
    const user = userEvent.setup();
    renderMembers();
    await user.type(screen.getByTestId('member-search'), 'isha');
    expect(screen.queryByTestId('member-row-MEM-001')).not.toBeInTheDocument();
    expect(screen.getByTestId('member-row-MEM-002')).toBeInTheDocument();
  });

  it('filters members by membership type', async () => {
    setMembers([
      makeMember({ id: 'MEM-001', membershipType: 'Basic' }),
      makeMember({ id: 'MEM-002', membershipType: 'Premium' }),
    ]);
    const user = userEvent.setup();
    renderMembers();
    await user.selectOptions(screen.getByTestId('member-type-filter'), 'Premium');
    expect(screen.queryByTestId('member-row-MEM-001')).not.toBeInTheDocument();
    expect(screen.getByTestId('member-row-MEM-002')).toBeInTheDocument();
  });

  it('filters members by status', async () => {
    setMembers([
      makeMember({ id: 'MEM-001', status: 'Active' }),
      makeMember({ id: 'MEM-002', status: 'Inactive' }),
    ]);
    const user = userEvent.setup();
    renderMembers();
    await user.selectOptions(screen.getByTestId('member-status-filter'), 'Inactive');
    expect(screen.queryByTestId('member-row-MEM-001')).not.toBeInTheDocument();
    expect(screen.getByTestId('member-row-MEM-002')).toBeInTheDocument();
  });

  it('shows a "no results" empty state with a clear-filters action when a search matches nothing', async () => {
    setMembers([makeMember({ id: 'MEM-001' })]);
    const user = userEvent.setup();
    renderMembers();
    await user.type(screen.getByTestId('member-search'), 'nonexistent-person');
    const empty = screen.getByTestId('members-empty-state');
    expect(empty).toBeInTheDocument();
    await user.click(within(empty).getByText('Clear filters'));
    expect(screen.getByTestId('member-row-MEM-001')).toBeInTheDocument();
  });

  it('clear filters button resets search and filter dropdowns', async () => {
    setMembers([
      makeMember({ id: 'MEM-001', membershipType: 'Basic' }),
      makeMember({ id: 'MEM-002', membershipType: 'Premium' }),
    ]);
    const user = userEvent.setup();
    renderMembers();
    await user.type(screen.getByTestId('member-search'), 'nobody');
    await user.selectOptions(screen.getByTestId('member-type-filter'), 'Premium');
    await user.click(screen.getByTestId('clear-member-filters-button'));
    expect(screen.getByTestId('member-search')).toHaveValue('');
    expect(screen.getByTestId('member-type-filter')).toHaveValue('');
    expect(screen.getByTestId('member-row-MEM-001')).toBeInTheDocument();
    expect(screen.getByTestId('member-row-MEM-002')).toBeInTheDocument();
  });

  it('paginates members beyond the default page size of 10', async () => {
    const members = Array.from({ length: 15 }, (_, i) =>
      makeMember({ id: `MEM-${String(i + 1).padStart(3, '0')}`, firstName: `Person${i + 1}` })
    );
    setMembers(members);
    const user = userEvent.setup();
    renderMembers();
    expect(screen.getByTestId('member-row-MEM-001')).toBeInTheDocument();
    expect(screen.queryByTestId('member-row-MEM-011')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('members-pagination-next'));
    expect(screen.getByTestId('member-row-MEM-011')).toBeInTheDocument();
    expect(screen.queryByTestId('member-row-MEM-001')).not.toBeInTheDocument();
  });

  it('navigates to the member details page when View is clicked', async () => {
    setMembers([makeMember({ id: 'MEM-001' })]);
    const user = userEvent.setup();
    renderMembers();
    await user.click(screen.getByTestId('view-member-MEM-001'));
    expect(screen.getByTestId('member-details-marker')).toHaveTextContent('MEM-001');
  });

  it('adds a new member and persists it to storage with a generated id', async () => {
    setMembers([makeMember({ id: 'MEM-001' })]);
    const user = userEvent.setup();
    renderMembers();
    await user.click(screen.getByTestId('add-member-button'));
    await user.type(screen.getByTestId('member-first-name'), 'Isha');
    await user.type(screen.getByTestId('member-last-name'), 'Verma');
    await user.type(screen.getByTestId('member-email'), 'isha.verma@mail.com');
    await user.type(screen.getByTestId('member-phone'), '9812345678');
    await user.type(screen.getByTestId('member-dob'), '1995-05-20');
    await user.type(screen.getByTestId('member-address'), '2 Reading Row, Bengaluru, KA');
    await user.type(screen.getByTestId('member-membership-expiry'), '2028-01-01');
    await user.click(screen.getByTestId('save-member-button'));

    expect(screen.queryByTestId('member-form-modal')).not.toBeInTheDocument();
    const stored = getMembers();
    expect(stored).toHaveLength(2);
    const created = stored.find((m) => m.email === 'isha.verma@mail.com');
    expect(created?.id).toBe('MEM-002');
    expect(created?.status).toBe('Active');
    expect(created?.booksIssued).toBe(0);
    expect(screen.getByText('Isha Verma was registered.')).toBeInTheDocument();
    expect(getActivity()[0].message).toContain('New member registered: Isha Verma');
  });

  it('edits an existing member and persists the change', async () => {
    setMembers([makeMember({ id: 'MEM-001', firstName: 'Aarav' })]);
    const user = userEvent.setup();
    renderMembers();
    await user.click(screen.getByTestId('edit-member-MEM-001'));
    expect(screen.getByTestId('member-first-name')).toHaveValue('Aarav');
    await user.clear(screen.getByTestId('member-first-name'));
    await user.type(screen.getByTestId('member-first-name'), 'Aarav Updated');
    await user.click(screen.getByTestId('save-member-button'));

    expect(getMembers()[0].firstName).toBe('Aarav Updated');
    expect(screen.getByText("Aarav Updated Sharma's details were updated.")).toBeInTheDocument();
  });

  it('shows a plain delete warning for a member with no active loans', async () => {
    setMembers([makeMember({ id: 'MEM-001' })]);
    setIssues([]);
    const user = userEvent.setup();
    renderMembers();
    await user.click(screen.getByTestId('delete-member-MEM-001'));
    expect(screen.getByTestId('delete-member-dialog')).toHaveTextContent('Aarav Sharma will be permanently removed.');
  });

  it('warns about active loans when deleting a member who has one', async () => {
    setMembers([makeMember({ id: 'MEM-001' })]);
    const activeIssue: IssueRecord = {
      id: 'ISS-001',
      bookId: 'BK-001',
      memberId: 'MEM-001',
      issueDate: '2026-01-01',
      dueDate: '2026-01-15',
      returnDate: null,
      status: 'Issued',
      fine: 0,
    };
    setIssues([activeIssue]);
    const user = userEvent.setup();
    renderMembers();
    await user.click(screen.getByTestId('delete-member-MEM-001'));
    expect(screen.getByTestId('delete-member-dialog')).toHaveTextContent('has active book loans');
  });

  it('deletes a member on confirm and removes it from storage', async () => {
    setMembers([makeMember({ id: 'MEM-001' })]);
    setIssues([]);
    const user = userEvent.setup();
    renderMembers();
    await user.click(screen.getByTestId('delete-member-MEM-001'));
    await user.click(screen.getByTestId('delete-member-dialog-confirm'));
    expect(getMembers()).toHaveLength(0);
    expect(screen.getByText('Aarav Sharma was removed.')).toBeInTheDocument();
  });

  it('keeps the member when the delete dialog is cancelled', async () => {
    setMembers([makeMember({ id: 'MEM-001' })]);
    setIssues([]);
    const user = userEvent.setup();
    renderMembers();
    await user.click(screen.getByTestId('delete-member-MEM-001'));
    await user.click(screen.getByTestId('delete-member-dialog-cancel'));
    expect(getMembers()).toHaveLength(1);
    expect(screen.getByTestId('member-row-MEM-001')).toBeInTheDocument();
  });
});
