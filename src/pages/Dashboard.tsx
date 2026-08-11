import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import StatCard from '../components/StatCard';
import { getActivity, getBooks, getIssues, getMembers } from '../services/storage';
import { formatDate, monthLabel, todayISO } from '../utils/dateUtils';

const activityIcon: Record<string, string> = {
  issue: '↷',
  return: '↶',
  member: '◉',
  book: '▤',
};

export default function Dashboard() {
  const books = useMemo(() => getBooks(), []);
  const members = useMemo(() => getMembers(), []);
  const issues = useMemo(() => getIssues(), []);
  const activity = useMemo(() => getActivity(), []);

  const totalBooks = books.reduce((sum, b) => sum + b.totalCopies, 0);
  const availableBooks = books.reduce((sum, b) => sum + b.availableCopies, 0);
  const issuedBooks = issues.filter((i) => i.status !== 'Returned').length;
  const overdueBooks = issues.filter((i) => i.status === 'Overdue').length;
  const dueToday = issues.filter((i) => i.status !== 'Returned' && i.dueDate === todayISO()).length;

  const monthlyIssues = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (let i = 5; i >= 0; i -= 1) buckets[monthLabel(i)] = 0;
    issues.forEach((issue) => {
      const d = new Date(issue.issueDate);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      if (label in buckets) buckets[label] += 1;
    });
    return Object.entries(buckets).map(([month, count]) => ({ month, count }));
  }, [issues]);

  const categoryPopularity = useMemo(() => {
    const counts: Record<string, number> = {};
    issues.forEach((issue) => {
      const book = books.find((b) => b.id === issue.bookId);
      if (!book) return;
      counts[book.category] = (counts[book.category] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [issues, books]);

  const returnedVsIssued = [
    { name: 'Returned', value: issues.filter((i) => i.status === 'Returned').length },
    { name: 'Currently Issued', value: issues.filter((i) => i.status !== 'Returned').length },
  ];

  const pieColors = ['#4f46e5', '#c76b3f', '#3f7d58', '#d9a441', '#362da3', '#b0592f'];

  return (
    <div className="flex flex-col gap-6" data-testid="dashboard-page">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink-900" data-testid="page-heading">
          Dashboard
        </h1>
        <p className="text-sm text-ink-600">A snapshot of LibraryHub activity today, {formatDate(todayISO())}.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3" data-testid="stats-grid">
        <StatCard label="Total Books" value={totalBooks} testId="stat-total-books" accent="#4f46e5" />
        <StatCard label="Available Books" value={availableBooks} testId="stat-available-books" accent="#3f7d58" />
        <StatCard label="Issued Books" value={issuedBooks} testId="stat-issued-books" accent="#362da3" />
        <StatCard label="Total Members" value={members.length} testId="stat-total-members" accent="#c76b3f" />
        <StatCard label="Overdue Books" value={overdueBooks} testId="stat-overdue-books" accent="#c1502e" />
        <StatCard label="Books Due Today" value={dueToday} testId="stat-due-today" accent="#d9a441" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-ink-900/10 p-4 shadow-sm" data-testid="chart-monthly-issues">
          <h3 className="font-display font-semibold text-sm text-ink-900 mb-3">Books Issued Per Month</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyIssues}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e4d8" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-ink-900/10 p-4 shadow-sm" data-testid="chart-category-popularity">
          <h3 className="font-display font-semibold text-sm text-ink-900 mb-3">Most Popular Categories</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryPopularity} dataKey="value" nameKey="name" innerRadius={40} outerRadius={75}>
                {categoryPopularity.map((entry, i) => (
                  <Cell key={entry.name} fill={pieColors[i % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-ink-900/10 p-4 shadow-sm" data-testid="chart-returned-vs-issued">
          <h3 className="font-display font-semibold text-sm text-ink-900 mb-3">Returned vs Issued</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={returnedVsIssued} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e4d8" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3f7d58" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-ink-900/10 p-4 shadow-sm" data-testid="recent-activity">
        <h3 className="font-display font-semibold text-sm text-ink-900 mb-3">Recent Activity</h3>
        <ul className="flex flex-col divide-y divide-ink-900/5">
          {activity.map((item) => (
            <li key={item.id} data-testid={`activity-item-${item.id}`} className="flex items-center gap-3 py-2.5">
              <span className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-700 flex items-center justify-center text-sm" aria-hidden="true">
                {activityIcon[item.type]}
              </span>
              <div className="flex-1">
                <p className="text-sm text-ink-900">{item.message}</p>
                <p className="text-xs text-ink-600">{new Date(item.timestamp).toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
