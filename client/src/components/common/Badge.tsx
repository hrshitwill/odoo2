import React from 'react';
import { cn } from '@/lib/utils';
import { OperationStatus, StockStatus, DeliveryStage } from '@/types/inventory';

interface BadgeProps {
  children?: React.ReactNode;
  variant?:
    | 'neutral'
    | 'success'
    | 'warning'
    | 'danger'
    | 'accent'
    | 'blue'
    | 'outline';
  status?: OperationStatus | StockStatus | DeliveryStage | string;
  className?: string;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  status,
  className,
  size = 'md',
  dot = true,
}) => {
  let resolvedVariant = variant || 'neutral';
  let label = children;

  if (status) {
    switch (status) {
      case 'done':
      case 'in_stock':
      case 'Completed':
        resolvedVariant = 'success';
        label = label || (status === 'done' ? 'DONE' : status === 'in_stock' ? 'IN STOCK' : 'COMPLETED');
        break;
      case 'waiting':
      case 'low_stock':
      case 'Pending':
        resolvedVariant = 'warning';
        label = label || (status === 'waiting' ? 'WAITING' : status === 'low_stock' ? 'LOW STOCK' : 'PENDING');
        break;
      case 'ready':
      case 'pick':
      case 'pack':
      case 'validate':
        resolvedVariant = 'accent';
        label = label || status.toUpperCase();
        break;
      case 'out_of_stock':
      case 'cancelled':
      case 'Reversed':
        resolvedVariant = 'danger';
        label = label || (status === 'out_of_stock' ? 'OUT OF STOCK' : status.toUpperCase());
        break;
      case 'draft':
      default:
        resolvedVariant = 'neutral';
        label = label || (typeof status === 'string' ? status.toUpperCase() : 'DRAFT');
        break;
    }
  }

  const variantStyles = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200/80',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/90',
    danger: 'bg-rose-50 text-rose-800 border-rose-200/90',
    accent: 'bg-orange-50 text-orange-800 border-orange-200/90',
    blue: 'bg-sky-50 text-sky-800 border-sky-200/90',
    outline: 'bg-transparent text-slate-700 border-slate-300',
  };

  const dotColors = {
    neutral: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    accent: 'bg-orange-500',
    blue: 'bg-sky-500',
    outline: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-sans text-xs font-medium px-2 py-0.5 rounded border transition-colors',
        size === 'sm' && 'text-[11px] px-1.5 py-0.2',
        variantStyles[resolvedVariant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotColors[resolvedVariant]
          )}
        />
      )}
      <span className="leading-tight">{label}</span>
    </span>
  );
};
