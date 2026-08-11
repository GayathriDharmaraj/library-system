import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MemberFormModal from './MemberFormModal';
import type { Member } from '../types';
import { addDays, todayISO } from '../utils/dateUtils';

const existingMember: Member = {
  id: 'MEM-001',
  firstName: 'Aarav',
  lastName: 'Sharma',
  email: 'aarav.sharma@mail.com',
  phone: '9876543210',
  dob: '1990-01-15',
  address: '100 MG Road, Bengaluru, KA',
  membershipType: 'Basic',
  membershipStart: '2025-01-01',
  membershipExpiry: '2026-01-01',
  status: 'Active',
  joinDate: '2025-01-01',
  booksIssued: 0,
};

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByTestId('member-first-name'), 'Isha');
  await user.type(screen.getByTestId('member-last-name'), 'Verma');
  await user.type(screen.getByTestId('member-email'), 'isha.verma@mail.com');
  await user.type(screen.getByTestId('member-phone'), '9812345678');
  await user.type(screen.getByTestId('member-dob'), '1995-05-20');
  await user.type(screen.getByTestId('member-address'), '2 Reading Row, Bengaluru, KA');
  await user.type(screen.getByTestId('member-membership-expiry'), '2027-01-01');
}

describe('MemberFormModal', () => {
  it('renders "New Member" title when creating', () => {
    render(<MemberFormModal open onClose={vi.fn()} onSubmit={vi.fn()} existingEmails={[]} />);
    expect(screen.getByText('New Member')).toBeInTheDocument();
    expect(screen.getByTestId('save-member-button')).toHaveTextContent('Register Member');
  });

  it('renders "Edit Member" title and pre-fills fields when editing', () => {
    render(
      <MemberFormModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        existingEmails={[existingMember.email]}
        initialMember={existingMember}
      />
    );
    expect(screen.getByText('Edit Member')).toBeInTheDocument();
    expect(screen.getByTestId('save-member-button')).toHaveTextContent('Save Changes');
    expect(screen.getByTestId('member-first-name')).toHaveValue('Aarav');
    expect(screen.getByTestId('member-email')).toHaveValue('aarav.sharma@mail.com');
  });

  it('defaults membership type to Basic and start date to today for a new member', () => {
    render(<MemberFormModal open onClose={vi.fn()} onSubmit={vi.fn()} existingEmails={[]} />);
    expect(screen.getByTestId('member-membership-type')).toHaveValue('Basic');
    expect(screen.getByTestId('member-membership-start')).toHaveValue(todayISO());
  });

  it('shows required-field errors when submitting an empty form', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<MemberFormModal open onClose={vi.fn()} onSubmit={onSubmit} existingEmails={[]} />);
    await user.click(screen.getByTestId('save-member-button'));
    expect(screen.getByTestId('member-first-name-error')).toHaveTextContent('First name is required.');
    expect(screen.getByTestId('member-last-name-error')).toHaveTextContent('Last name is required.');
    expect(screen.getByTestId('member-email-error')).toHaveTextContent('Email is required.');
    expect(screen.getByTestId('member-phone-error')).toHaveTextContent('Phone number is required.');
    expect(screen.getByTestId('member-dob-error')).toHaveTextContent('Date of birth is required.');
    expect(screen.getByTestId('member-address-error')).toHaveTextContent('Address is required.');
    expect(screen.getByTestId('member-membership-expiry-error')).toHaveTextContent('Membership expiry date is required.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects an invalid email address', async () => {
    const user = userEvent.setup();
    render(<MemberFormModal open onClose={vi.fn()} onSubmit={vi.fn()} existingEmails={[]} />);
    await user.type(screen.getByTestId('member-email'), 'not-an-email');
    await user.click(screen.getByTestId('save-member-button'));
    expect(screen.getByTestId('member-email-error')).toHaveTextContent('Enter a valid email address.');
  });

  it('rejects a duplicate email when creating a new member', async () => {
    const user = userEvent.setup();
    render(
      <MemberFormModal open onClose={vi.fn()} onSubmit={vi.fn()} existingEmails={['isha.verma@mail.com']} />
    );
    await user.type(screen.getByTestId('member-email'), 'isha.verma@mail.com');
    await user.click(screen.getByTestId('save-member-button'));
    expect(screen.getByTestId('member-email-error')).toHaveTextContent('A member with this email already exists.');
  });

  it('allows keeping the same email when editing that same member', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <MemberFormModal
        open
        onClose={vi.fn()}
        onSubmit={onSubmit}
        existingEmails={[existingMember.email]}
        initialMember={existingMember}
      />
    );
    await user.clear(screen.getByTestId('member-membership-expiry'));
    await user.type(screen.getByTestId('member-membership-expiry'), '2028-01-01');
    await user.click(screen.getByTestId('save-member-button'));
    expect(screen.queryByTestId('member-email-error')).not.toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid phone number', async () => {
    const user = userEvent.setup();
    render(<MemberFormModal open onClose={vi.fn()} onSubmit={vi.fn()} existingEmails={[]} />);
    await user.type(screen.getByTestId('member-phone'), '123');
    await user.click(screen.getByTestId('save-member-button'));
    expect(screen.getByTestId('member-phone-error')).toHaveTextContent('Enter a valid 10–13 digit phone number.');
  });

  it('rejects a date of birth in the future', async () => {
    const user = userEvent.setup();
    render(<MemberFormModal open onClose={vi.fn()} onSubmit={vi.fn()} existingEmails={[]} />);
    await user.type(screen.getByTestId('member-dob'), addDays(todayISO(), 5));
    await user.click(screen.getByTestId('save-member-button'));
    expect(screen.getByTestId('member-dob-error')).toHaveTextContent('Date of birth cannot be in the future.');
  });

  it('rejects a membership expiry date on or before the start date', async () => {
    const user = userEvent.setup();
    render(<MemberFormModal open onClose={vi.fn()} onSubmit={vi.fn()} existingEmails={[]} />);
    await user.type(screen.getByTestId('member-membership-expiry'), todayISO());
    await user.click(screen.getByTestId('save-member-button'));
    expect(screen.getByTestId('member-membership-expiry-error')).toHaveTextContent(
      'Expiry date must be after the start date.'
    );
  });

  it('allows changing the membership type via the select', async () => {
    const user = userEvent.setup();
    render(<MemberFormModal open onClose={vi.fn()} onSubmit={vi.fn()} existingEmails={[]} />);
    await user.selectOptions(screen.getByTestId('member-membership-type'), 'Premium');
    expect(screen.getByTestId('member-membership-type')).toHaveValue('Premium');
  });

  it('submits the trimmed and normalized payload when the form is valid', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<MemberFormModal open onClose={vi.fn()} onSubmit={onSubmit} existingEmails={[]} />);
    await fillValidForm(user);
    await user.click(screen.getByTestId('save-member-button'));
    expect(onSubmit).toHaveBeenCalledWith({
      firstName: 'Isha',
      lastName: 'Verma',
      email: 'isha.verma@mail.com',
      phone: '9812345678',
      dob: '1995-05-20',
      address: '2 Reading Row, Bengaluru, KA',
      membershipType: 'Basic',
      membershipStart: todayISO(),
      membershipExpiry: '2027-01-01',
    });
  });

  it('calls onClose when the cancel button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<MemberFormModal open onClose={onClose} onSubmit={vi.fn()} existingEmails={[]} />);
    await user.click(screen.getByTestId('cancel-member-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
