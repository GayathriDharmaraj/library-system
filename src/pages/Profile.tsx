import { useState, type FormEvent } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { resetDemoData } from '../services/storage';
import { isValidEmail, isValidPhone, passwordRules } from '../utils/validators';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  if (!user) return null;

  const handleResetData = () => {
    resetDemoData();
    setResetConfirmOpen(false);
    showToast('Demo data has been reset to its initial state.', 'success');
    setTimeout(() => window.location.reload(), 600);
  };

  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Name is required.';
    if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address.';
    if (!isValidPhone(phone)) nextErrors.phone = 'Enter a valid phone number.';
    if (!address.trim()) nextErrors.address = 'Address is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    updateUser({ ...user, name: name.trim(), email: email.trim(), phone: phone.trim(), address: address.trim() });
    showToast('Profile updated successfully.', 'success');
    setEditing(false);
  };

  const handleChangePassword = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!currentPassword) nextErrors.currentPassword = 'Current password is required.';
    const failedRules = passwordRules.filter((rule) => !rule.test(newPassword));
    if (failedRules.length > 0) nextErrors.newPassword = 'Password does not meet all requirements below.';
    if (newPassword !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';
    setPasswordErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    showToast('Password changed successfully.', 'success');
    setChangingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="flex flex-col gap-5 max-w-2xl" data-testid="profile-page">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink-900" data-testid="page-heading">My Profile</h1>
        <p className="text-sm text-ink-600">Manage your account details and security settings.</p>
      </div>

      <div className="bg-white rounded-xl border border-ink-900/10 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-display font-bold text-xl"
            style={{ backgroundColor: user.avatarColor }}
            data-testid="profile-photo"
            aria-hidden="true"
          >
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="font-display font-semibold text-ink-900" data-testid="profile-name-display">{user.name}</p>
            <p className="text-sm text-ink-600 capitalize" data-testid="profile-role-display">{user.role}</p>
          </div>
          {!editing && (
            <button
              type="button"
              data-testid="edit-profile-button"
              onClick={() => setEditing(true)}
              className="ml-auto text-sm font-medium text-brand-600 hover:underline"
            >
              Edit Profile
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSaveProfile} noValidate data-testid="profile-form" className="flex flex-col gap-4">
            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium text-ink-800 mb-1">Name</label>
              <input
                id="profile-name"
                data-testid="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.name ? 'border-rust-glow' : 'border-ink-900/15'}`}
              />
              {errors.name && <p role="alert" className="text-rust-glow text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="profile-email" className="block text-sm font-medium text-ink-800 mb-1">Email</label>
              <input
                id="profile-email"
                data-testid="profile-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.email ? 'border-rust-glow' : 'border-ink-900/15'}`}
              />
              {errors.email && <p role="alert" className="text-rust-glow text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="profile-phone" className="block text-sm font-medium text-ink-800 mb-1">Phone</label>
              <input
                id="profile-phone"
                data-testid="profile-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.phone ? 'border-rust-glow' : 'border-ink-900/15'}`}
              />
              {errors.phone && <p role="alert" className="text-rust-glow text-xs mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label htmlFor="profile-address" className="block text-sm font-medium text-ink-800 mb-1">Address</label>
              <input
                id="profile-address"
                data-testid="profile-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.address ? 'border-rust-glow' : 'border-ink-900/15'}`}
              />
              {errors.address && <p role="alert" className="text-rust-glow text-xs mt-1">{errors.address}</p>}
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                data-testid="cancel-profile-button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-ink-900/15 text-ink-800 hover:bg-ink-900/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="save-profile-button"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-ink-600 text-xs uppercase tracking-wide">Email</dt>
              <dd className="text-ink-900" data-testid="profile-email-display">{user.email}</dd>
            </div>
            <div>
              <dt className="text-ink-600 text-xs uppercase tracking-wide">Phone</dt>
              <dd className="text-ink-900" data-testid="profile-phone-display">{user.phone}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-ink-600 text-xs uppercase tracking-wide">Address</dt>
              <dd className="text-ink-900" data-testid="profile-address-display">{user.address}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="bg-white rounded-xl border border-ink-900/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-ink-900">Password</h3>
          {!changingPassword && (
            <button
              type="button"
              data-testid="change-password-button"
              onClick={() => setChangingPassword(true)}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Change Password
            </button>
          )}
        </div>

        {changingPassword && (
          <form onSubmit={handleChangePassword} noValidate data-testid="change-password-form" className="flex flex-col gap-4">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-ink-800 mb-1">Current Password</label>
              <input
                id="current-password"
                data-testid="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm ${passwordErrors.currentPassword ? 'border-rust-glow' : 'border-ink-900/15'}`}
              />
              {passwordErrors.currentPassword && <p role="alert" className="text-rust-glow text-xs mt-1">{passwordErrors.currentPassword}</p>}
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-ink-800 mb-1">New Password</label>
              <input
                id="new-password"
                data-testid="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm ${passwordErrors.newPassword ? 'border-rust-glow' : 'border-ink-900/15'}`}
              />
              {passwordErrors.newPassword && <p role="alert" className="text-rust-glow text-xs mt-1">{passwordErrors.newPassword}</p>}
              <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1" data-testid="password-rules">
                {passwordRules.map((rule) => {
                  const passed = rule.test(newPassword);
                  return (
                    <li key={rule.label} className={`text-xs flex items-center gap-1.5 ${passed ? 'text-moss-600' : 'text-ink-600'}`}>
                      <span aria-hidden="true">{passed ? '✓' : '○'}</span>
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-ink-800 mb-1">Confirm New Password</label>
              <input
                id="confirm-password"
                data-testid="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm ${passwordErrors.confirmPassword ? 'border-rust-glow' : 'border-ink-900/15'}`}
              />
              {passwordErrors.confirmPassword && <p role="alert" className="text-rust-glow text-xs mt-1">{passwordErrors.confirmPassword}</p>}
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                data-testid="cancel-password-button"
                onClick={() => setChangingPassword(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-ink-900/15 text-ink-800 hover:bg-ink-900/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="save-password-button"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white"
              >
                Update Password
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-white rounded-xl border border-ink-900/10 p-6" data-testid="settings-section">
        <h3 className="font-display font-semibold text-ink-900 mb-1">Test Environment Settings</h3>
        <p className="text-sm text-ink-600 mb-4">
          Reset all books, members, and issue records back to the original demo data. Useful between automated test runs.
        </p>
        <button
          type="button"
          data-testid="reset-demo-data-button"
          onClick={() => setResetConfirmOpen(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-rust-glow/40 text-rust-glow hover:bg-rust-glow/10"
        >
          Reset Demo Data
        </button>
      </div>

      <ConfirmDialog
        open={resetConfirmOpen}
        title="Reset all demo data?"
        message="This will erase all changes and restore the original 30 books, 20 members, and issue history. This cannot be undone."
        confirmLabel="Reset Data"
        danger
        testId="reset-demo-data-dialog"
        onConfirm={handleResetData}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </div>
  );
}
