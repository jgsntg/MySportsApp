import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'live' | 'final' | 'upcoming' | 'green' | 'red';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        {
          default: 'bg-slate-700 text-slate-300',
          live: 'bg-red-900 text-red-400 animate-pulse',
          final: 'bg-slate-700 text-slate-400',
          upcoming: 'bg-blue-900 text-blue-400',
          green: 'bg-green-900 text-green-400',
          red: 'bg-red-900 text-red-400',
        }[variant],
        className
      )}
      {...props}
    />
  );
}
