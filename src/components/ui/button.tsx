import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'whatsapp';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 select-none';

    const variants = {
      default: 'bg-zinc-900 text-zinc-50 shadow-sm hover:bg-zinc-850 hover:bg-zinc-800',
      destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
      outline: 'border border-zinc-200 bg-white shadow-sm hover:bg-zinc-50 text-zinc-900',
      secondary: 'bg-zinc-100 text-zinc-900 shadow-sm hover:bg-zinc-200',
      ghost: 'hover:bg-zinc-100 hover:text-zinc-900 text-zinc-700',
      link: 'text-zinc-900 underline-offset-4 hover:underline',
      whatsapp: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 font-semibold',
    };

    const sizes = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-10 rounded-md px-8 text-sm',
      icon: 'h-9 w-9',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
