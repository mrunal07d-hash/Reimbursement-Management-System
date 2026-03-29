import { format, formatDistanceToNow } from 'date-fns';

export const formatCurrency = (amount, currency = 'USD', symbol = '$') => {
  if (amount == null) return '—';
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(amount);
  return `${symbol}${formatted}`;
};

export const formatDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy h:mm a');
};

export const timeAgo = (date) => {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getAvatarColor = (name) => {
  const colors = [
    '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981',
    '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'
  ];
  if (!name) return colors[0];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
};

export const CATEGORIES = [
  { value: 'travel', label: '✈️ Travel', icon: '✈️' },
  { value: 'meals', label: '🍽️ Meals & Food', icon: '🍽️' },
  { value: 'accommodation', label: '🏨 Accommodation', icon: '🏨' },
  { value: 'office_supplies', label: '📎 Office Supplies', icon: '📎' },
  { value: 'software', label: '💻 Software', icon: '💻' },
  { value: 'training', label: '📚 Training', icon: '📚' },
  { value: 'medical', label: '🏥 Medical', icon: '🏥' },
  { value: 'entertainment', label: '🎭 Entertainment', icon: '🎭' },
  { value: 'utilities', label: '⚡ Utilities', icon: '⚡' },
  { value: 'other', label: '📦 Other', icon: '📦' },
];

export const getCategoryLabel = (value) => CATEGORIES.find(c => c.value === value)?.label || value;

export const STATUS_COLORS = {
  draft: 'draft', submitted: 'submitted', in_review: 'in_review',
  approved: 'approved', rejected: 'rejected', cancelled: 'cancelled',
  pending: 'pending', skipped: 'skipped'
};

export const getStatusLabel = (status) => {
  const labels = {
    draft: 'Draft', submitted: 'Submitted', in_review: 'In Review',
    approved: 'Approved', rejected: 'Rejected', cancelled: 'Cancelled',
    pending: 'Pending', skipped: 'Skipped'
  };
  return labels[status] || status;
};

export const debounce = (fn, delay) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
};
