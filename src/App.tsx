import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ToastStack from './components/ToastStack';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Books from './pages/Books';
import BookDetails from './pages/BookDetails';
import Categories from './pages/Categories';
import Dashboard from './pages/Dashboard';
import IssueBook from './pages/IssueBook';
import IssueHistory from './pages/IssueHistory';
import Login from './pages/Login';
import MemberDetails from './pages/MemberDetails';
import Members from './pages/Members';
import MyAccount from './pages/MyAccount';
import NotFound from './pages/NotFound';
import OverdueBooks from './pages/OverdueBooks';
import Profile from './pages/Profile';
import ReturnBooks from './pages/ReturnBooks';
import { ensureSeeded } from './services/storage';

ensureSeeded();

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute staffOnly />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/books" element={<Books />} />
              <Route path="/books/:id" element={<BookDetails />} />
              <Route path="/members" element={<Members />} />
              <Route path="/members/:id" element={<MemberDetails />} />
              <Route path="/issue-book" element={<IssueBook />} />
              <Route path="/return-books" element={<ReturnBooks />} />
              <Route path="/overdue-books" element={<OverdueBooks />} />
              <Route path="/issue-history" element={<IssueHistory />} />
              <Route path="/categories" element={<Categories />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/my-account" element={<MyAccount />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          <ToastStack />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
