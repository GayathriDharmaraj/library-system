import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper-100 px-4" data-testid="not-found-page">
      <div className="text-center max-w-md">
        <div className="stamp text-ink-700 text-3xl mb-4 inline-block">404</div>
        <h1 className="font-display font-bold text-2xl text-ink-900 mb-2" data-testid="page-heading">
          This page has been checked out
        </h1>
        <p className="text-sm text-ink-600 mb-6">
          We couldn't find the shelf you're looking for. The page may have moved or the URL may be incorrect.
        </p>
        <Link
          to="/dashboard"
          data-testid="not-found-home-link"
          className="inline-block bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg px-5 py-2.5"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
