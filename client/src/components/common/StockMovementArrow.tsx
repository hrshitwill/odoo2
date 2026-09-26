'use client';

import React from 'react';
import { ArrowRight, MoveRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StockMovementArrowProps {
  source: string;
  destination: string;
  quantity?: number | string;
  unit?: string;
  operation?: string;
  className?: string;
  compact?: boolean;
}

export const StockMovementArrow: React.FC<StockMovementArrowProps> = ({
  source,
  destination,
  quantity,
  unit,
  operation,
  className,
  compact = false,
}) => {
  if (compact) {
    return (
      <div className={cn('inline-flex items-center gap-1.5 text-xs text-slate-600 font-mono', className)}>
        <span className="font-semibold text-slate-900 truncate max-w-[130px]">{source}</span>
        <MoveRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="font-semibold text-slate-900 truncate max-w-[130px]">{destination}</span>
        {quantity !== undefined && (
          <span className="ml-1 text-[11px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200">
            {quantity} {unit}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-all shadow-xs',
        className
      )}
    >
      {/* Source Node */}
      <div className="flex-1 min-w-0 pr-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-0.5">Origin</div>
        <div className="font-semibold text-sm text-slate-900 truncate" title={source}>
          {source}
        </div>
      </div>

      {/* Movement Vector */}
      <div className="flex flex-col items-center justify-center px-4 shrink-0">
        {quantity !== undefined && (
          <div className="text-[11px] font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 mb-1">
            {quantity} {unit}
          </div>
        )}
        <div className="relative flex items-center w-28 sm:w-36">
          <div className="w-full border-t-2 border-dashed border-slate-300" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-white pl-1">
            <ArrowRight className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
          </div>
        </div>
        {operation && (
          <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 mt-1">
            {operation}
          </div>
        )}
      </div>

      {/* Destination Node */}
      <div className="flex-1 min-w-0 pl-2 text-right">
        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-0.5">Target Destination</div>
        <div className="font-semibold text-sm text-slate-900 truncate" title={destination}>
          {destination}
        </div>
      </div>
    </div>
  );
};

export const MultiStageFlowVisualizer: React.FC<{
  stages: { label: string; active?: boolean; done?: boolean }[];
  className?: string;
}> = ({ stages, className }) => {
  return (
    <div className={cn('flex items-center gap-1 sm:gap-2 overflow-x-auto py-2', className)}>
      {stages.map((stage, idx) => (
        <React.Fragment key={stage.label}>
          <div
            className={cn(
              'px-3 py-1.5 rounded text-xs font-mono font-semibold uppercase tracking-wider border whitespace-nowrap transition-all',
              stage.done
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : stage.active
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            )}
          >
            <span className="opacity-60 mr-1.5">0{idx + 1}.</span>
            {stage.label}
          </div>
          {idx < stages.length - 1 && (
            <div className="text-slate-300 font-mono text-sm shrink-0">→</div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
