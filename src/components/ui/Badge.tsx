interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info';
  size?: 'sm' | 'md';
}

const variants = {
  primary: 'bg-sky-100 text-sky-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  neutral: 'bg-slate-100 text-slate-600',
  info: 'bg-blue-100 text-blue-700',
};

export function Badge({ children, variant = 'neutral', size = 'sm' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1'}`}>
      {children}
    </span>
  );
}
