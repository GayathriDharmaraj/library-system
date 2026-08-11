import { useEffect, useState, type FormEvent } from 'react';
import ModalComponent from './Modal';
import type { Member, MembershipType } from '../types';
import { isValidEmail, isValidPhone } from '../utils/validators';
import { isFutureDate, todayISO } from '../utils/dateUtils';

interface MemberFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Member, 'id' | 'status' | 'joinDate' | 'booksIssued'>) => void;
  existingEmails: string[];
  initialMember?: Member | null;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  address: string;
  membershipType: MembershipType;
  membershipStart: string;
  membershipExpiry: string;
}

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dob: '',
  address: '',
  membershipType: 'Basic',
  membershipStart: todayISO(),
  membershipExpiry: '',
};

export default function MemberFormModal({ open, onClose, onSubmit, existingEmails, initialMember }: MemberFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const isEdit = Boolean(initialMember);

  useEffect(() => {
    if (open) {
      if (initialMember) {
        setForm({
          firstName: initialMember.firstName,
          lastName: initialMember.lastName,
          email: initialMember.email,
          phone: initialMember.phone,
          dob: initialMember.dob,
          address: initialMember.address,
          membershipType: initialMember.membershipType,
          membershipStart: initialMember.membershipStart,
          membershipExpiry: initialMember.membershipExpiry,
        });
      } else {
        setForm(emptyForm);
      }
      setErrors({});
    }
  }, [open, initialMember]);

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.firstName.trim()) nextErrors.firstName = 'First name is required.';
    else if (form.firstName.trim().length < 2 || form.firstName.trim().length > 50) nextErrors.firstName = 'First name must be 2–50 characters.';

    if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required.';
    else if (form.lastName.trim().length < 2 || form.lastName.trim().length > 50) nextErrors.lastName = 'Last name must be 2–50 characters.';

    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    else if (!isValidEmail(form.email)) nextErrors.email = 'Enter a valid email address.';
    else if (
      existingEmails
        .filter((email) => !isEdit || email !== initialMember?.email)
        .includes(form.email.trim().toLowerCase())
    ) {
      nextErrors.email = 'A member with this email already exists.';
    }

    if (!form.phone.trim()) nextErrors.phone = 'Phone number is required.';
    else if (!isValidPhone(form.phone)) nextErrors.phone = 'Enter a valid 10–13 digit phone number.';

    if (!form.dob) nextErrors.dob = 'Date of birth is required.';
    else if (isFutureDate(form.dob)) nextErrors.dob = 'Date of birth cannot be in the future.';

    if (!form.address.trim()) nextErrors.address = 'Address is required.';
    else if (form.address.trim().length > 200) nextErrors.address = 'Address must be under 200 characters.';

    if (!form.membershipStart) nextErrors.membershipStart = 'Membership start date is required.';
    if (!form.membershipExpiry) nextErrors.membershipExpiry = 'Membership expiry date is required.';
    else if (form.membershipStart && form.membershipExpiry <= form.membershipStart) {
      nextErrors.membershipExpiry = 'Expiry date must be after the start date.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      dob: form.dob,
      address: form.address.trim(),
      membershipType: form.membershipType,
      membershipStart: form.membershipStart,
      membershipExpiry: form.membershipExpiry,
    });
  };

  return (
    <ModalComponent
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Member' : 'New Member'}
      testId="member-form-modal"
      widthClass="max-w-2xl"
    >
      <form onSubmit={handleSubmit} noValidate data-testid="member-form" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="member-first-name" className="block text-sm font-medium text-ink-800 mb-1">First Name</label>
          <input
            id="member-first-name"
            data-testid="member-first-name"
            value={form.firstName}
            onChange={(e) => setField('firstName', e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.firstName ? 'border-rust-glow' : 'border-ink-900/15'}`}
          />
          {errors.firstName && <p data-testid="member-first-name-error" role="alert" className="text-rust-glow text-xs mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <label htmlFor="member-last-name" className="block text-sm font-medium text-ink-800 mb-1">Last Name</label>
          <input
            id="member-last-name"
            data-testid="member-last-name"
            value={form.lastName}
            onChange={(e) => setField('lastName', e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.lastName ? 'border-rust-glow' : 'border-ink-900/15'}`}
          />
          {errors.lastName && <p data-testid="member-last-name-error" role="alert" className="text-rust-glow text-xs mt-1">{errors.lastName}</p>}
        </div>

        <div>
          <label htmlFor="member-email" className="block text-sm font-medium text-ink-800 mb-1">Email</label>
          <input
            id="member-email"
            data-testid="member-email"
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.email ? 'border-rust-glow' : 'border-ink-900/15'}`}
          />
          {errors.email && <p data-testid="member-email-error" role="alert" className="text-rust-glow text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="member-phone" className="block text-sm font-medium text-ink-800 mb-1">Phone</label>
          <input
            id="member-phone"
            data-testid="member-phone"
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.phone ? 'border-rust-glow' : 'border-ink-900/15'}`}
          />
          {errors.phone && <p data-testid="member-phone-error" role="alert" className="text-rust-glow text-xs mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="member-dob" className="block text-sm font-medium text-ink-800 mb-1">Date of Birth</label>
          <input
            id="member-dob"
            data-testid="member-dob"
            type="date"
            value={form.dob}
            onChange={(e) => setField('dob', e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.dob ? 'border-rust-glow' : 'border-ink-900/15'}`}
          />
          {errors.dob && <p data-testid="member-dob-error" role="alert" className="text-rust-glow text-xs mt-1">{errors.dob}</p>}
        </div>

        <div>
          <label htmlFor="member-membership-type" className="block text-sm font-medium text-ink-800 mb-1">Membership Type</label>
          <select
            id="member-membership-type"
            data-testid="member-membership-type"
            value={form.membershipType}
            onChange={(e) => setField('membershipType', e.target.value)}
            className="w-full border border-ink-900/15 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="Basic">Basic</option>
            <option value="Premium">Premium</option>
            <option value="Student">Student</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="member-address" className="block text-sm font-medium text-ink-800 mb-1">Address</label>
          <input
            id="member-address"
            data-testid="member-address"
            value={form.address}
            onChange={(e) => setField('address', e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.address ? 'border-rust-glow' : 'border-ink-900/15'}`}
          />
          {errors.address && <p data-testid="member-address-error" role="alert" className="text-rust-glow text-xs mt-1">{errors.address}</p>}
        </div>

        <div>
          <label htmlFor="member-membership-start" className="block text-sm font-medium text-ink-800 mb-1">Membership Start Date</label>
          <input
            id="member-membership-start"
            data-testid="member-membership-start"
            type="date"
            value={form.membershipStart}
            onChange={(e) => setField('membershipStart', e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.membershipStart ? 'border-rust-glow' : 'border-ink-900/15'}`}
          />
          {errors.membershipStart && <p data-testid="member-membership-start-error" role="alert" className="text-rust-glow text-xs mt-1">{errors.membershipStart}</p>}
        </div>

        <div>
          <label htmlFor="member-membership-expiry" className="block text-sm font-medium text-ink-800 mb-1">Membership Expiry Date</label>
          <input
            id="member-membership-expiry"
            data-testid="member-membership-expiry"
            type="date"
            value={form.membershipExpiry}
            onChange={(e) => setField('membershipExpiry', e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.membershipExpiry ? 'border-rust-glow' : 'border-ink-900/15'}`}
          />
          {errors.membershipExpiry && <p data-testid="member-membership-expiry-error" role="alert" className="text-rust-glow text-xs mt-1">{errors.membershipExpiry}</p>}
        </div>

        <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
          <button
            type="button"
            data-testid="cancel-member-button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-ink-900/15 text-ink-800 hover:bg-ink-900/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            data-testid="save-member-button"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white"
          >
            {isEdit ? 'Save Changes' : 'Register Member'}
          </button>
        </div>
      </form>
    </ModalComponent>
  );
}
