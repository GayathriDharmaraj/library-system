# LibraryHub — Library Management System (QA Automation Practice Project)

A fully client-side Library Management System built with **React, TypeScript, Vite, and Tailwind CSS**, designed as a realistic QA automation testing target for Selenium, Playwright, or Cypress. All data is mocked and persisted in `localStorage` — no backend required.

---

## 1. Setup & Running Locally

**Requirements:** Node.js 18+ and npm.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
# App runs at http://localhost:5173

# 3. Build for production
npm run build

# 4. Preview the production build
npm run preview
```

The app seeds itself automatically on first load (30 books, 20 members, 20 issue-history records, 9 categories). All further changes (add/edit/delete/issue/return) persist in `localStorage` and survive a page refresh.

To wipe and re-seed the data at any time, go to **Profile → Test Environment Settings → Reset Demo Data**.

---

## 2. Test Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin@library.com` | `Admin@123` |
| Librarian | `librarian@library.com` | `Librarian@123` |
| Member | `member@library.com` | `Member@123` |

Admin and Librarian see the full library-management UI. Member is a patron self-service account (linked to member record `MEM-008`) that only sees its own borrowed books, fines, and profile at `/my-account` — staff-only routes redirect a Member back to `/my-account`.

**Any of the 20 seeded members can also log in as themselves** — just use their own email (`firstname.lastname@mail.com`, e.g. `aarav.sharma@mail.com`) with the shared password `Member@123`. No separate credential list is needed per member; `login()` falls back to matching against the real `Member` records in storage whenever the email isn't a staff account.

---

## 3. Pages & Routes

| Page | Route |
|---|---|
| Login | `/login` |
| Dashboard | `/dashboard` |
| Books | `/books` |
| Book Details | `/books/:id` |
| Members | `/members` |
| Member Details | `/members/:id` |
| Issue Book | `/issue-book` |
| Return Books | `/return-books` |
| Overdue Books | `/overdue-books` |
| Issue History | `/issue-history` |
| Categories | `/categories` |
| My Account (Member only) | `/my-account` |
| Profile | `/profile` |
| 404 Not Found | any unmatched route |

---

## 4. Project Structure

```
src/
├── components/     # Reusable UI: Sidebar, Layout, Modal, ConfirmDialog, forms, etc.
├── pages/          # One file per route
├── context/        # AuthContext, ToastContext
├── services/       # storage.ts (localStorage), auth.ts (mock login)
├── data/           # seedData.ts — generates the 30 books / 20 members / 20 issues
├── types/          # Shared TypeScript interfaces
├── utils/          # dateUtils, validators, fine calculation
├── App.tsx         # Route definitions
└── main.tsx        # Entry point
```

---

## 5. Key Business Rules Implemented

- Concurrent book limit depends on membership type: **Basic = 5, Student = 3, Premium = unlimited** (see `src/utils/membership.ts`).
- A book cannot be issued when `availableCopies = 0`.
- Due date cannot be earlier than the issue date; issue date cannot be in the past.
- Fine = **₹10 per day overdue**, calculated from due date to return date (or today, if still outstanding).
- Overdue severity coloring: 1–3 days = yellow, 4–7 days = orange, 7+ days = red.
- Duplicate ISBN and duplicate member email are blocked on add/edit.
- A category cannot be deleted while books are still assigned to it.
- Password change requires: 8+ characters, uppercase, lowercase, number, special character, and matching confirmation.

---

## 6. QA Test Scenarios Supported

**Login:** successful login, invalid username, invalid password, empty username, empty password, password show/hide, logout.

**Books:** add book, missing required fields, duplicate ISBN, edit, delete, search (title/author/ISBN), filter (category/availability/status), sort (title/author/category/year/available copies), pagination (10/25/50), view details.

**Members:** register, invalid email, invalid phone, duplicate email, edit, delete, search, filter (type/status).

**Issue/Return:** issue an available book, attempt to issue an unavailable book, hit the membership-tier book limit (Basic 5 / Student 3 / Premium unlimited), invalid due date, return a book, return an overdue book, verify fine calculation, verify availability updates after return.

**UI:** sidebar navigation, responsive hamburger menu, toast notifications, confirmation dialogs, empty search results, 404 page, logout confirmation.

**Roles/Permissions:** Member login lands on `/my-account` instead of `/dashboard`; direct navigation to any staff-only route (Dashboard, Books, Members, Issue Book, Return Books, Overdue Books, Issue History, Categories) redirects a Member back to `/my-account`; Admin/Librarian retain full access to all staff routes.

---

## 7. Important `data-testid` Selectors

**Login**
`login-form`, `login-username`, `login-password`, `toggle-password-visibility`, `remember-me`, `login-button`, `forgot-password-link`, `login-error`, `login-username-error`, `login-password-error`

**Layout / Navigation**
`sidebar`, `hamburger-menu`, `nav-dashboard`, `nav-books`, `nav-members`, `nav-issue-book`, `nav-return-books`, `nav-overdue-books`, `nav-issue-history`, `nav-categories`, `nav-profile`, `logout-button`, `confirm-logout-dialog`, `toast-container`, `toast-success` / `toast-error` / `toast-info`

**Dashboard**
`stats-grid`, `stat-total-books`, `stat-available-books`, `stat-issued-books`, `stat-total-members`, `stat-overdue-books`, `stat-due-today`, `chart-monthly-issues`, `chart-category-popularity`, `chart-returned-vs-issued`, `recent-activity`

**Books**
`add-book-button`, `books-search`, `books-search-field`, `books-category-filter`, `books-availability-filter`, `books-status-filter`, `clear-filters-button`, `books-table`, `book-row-{id}`, `view-book-{id}`, `edit-book-{id}`, `delete-book-{id}`, `books-pagination-*`, `book-form`, `book-isbn`, `book-title`, `book-author`, `book-category`, `book-publisher`, `book-published-year`, `book-total-copies`, `book-description`, `save-book-button`, `cancel-book-button`, `delete-book-dialog`

**Members**
`add-member-button`, `member-search`, `member-type-filter`, `member-status-filter`, `members-table`, `member-row-{id}`, `view-member-{id}`, `edit-member-{id}`, `delete-member-{id}`, `member-form`, `member-first-name`, `member-last-name`, `member-email`, `member-phone`, `member-dob`, `member-address`, `member-membership-type`, `member-membership-start`, `member-membership-expiry`, `save-member-button`, `delete-member-dialog`

**Issue / Return**
`issue-select-member`, `issue-select-book`, `issue-date`, `issue-due-date`, `issue-book-button`, `confirm-issue-dialog`, `return-books-table`, `return-book-button-{id}`, `confirm-return-dialog`

**Overdue / History**
`overdue-table`, `overdue-severity-{id}`, `contact-member-{id}`, `issue-history-table`, `history-from-date`, `history-to-date`, `history-book-filter`, `history-member-filter`, `history-status-filter`

**Categories**
`add-category-button`, `category-search`, `categories-table`, `edit-category-{id}`, `delete-category-{id}`, `category-name`, `save-category-button`

**Profile**
`edit-profile-button`, `profile-form`, `change-password-button`, `change-password-form`, `password-rules`, `reset-demo-data-button`, `reset-demo-data-dialog`

**My Account (Member role)**
`my-account-page`, `stat-current-loans`, `stat-overdue-loans`, `stat-outstanding-fine`, `stat-membership-type`, `my-account-profile`, `my-account-name`, `my-account-status`, `current-loans-table`, `current-loan-row-{id}`, `past-loans-table`, `past-loan-row-{id}`, `nav-my-account`

**Errors / Empty / 404**
`*-error` (per-field validation messages), `*-empty-state`, `not-found-page`

---

## 8. Notes for Automation

- Every interactive element uses a stable, hand-written `data-testid` — none are randomly generated.
- Reduced-motion is respected; no animation blocks interaction.
- Row-level actions are scoped with the record's own ID (e.g. `edit-book-BK-001`) for reliable targeting in list views.
- LocalStorage keys: `library_books`, `library_members`, `library_issues`, `library_categories`, `library_user`, `library_activity`.
