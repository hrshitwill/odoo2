'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CalibratedMeterProps {
  percentage: number;
  totalBars?: number;
  className?: string;
}

export const CalibratedMeter: React.FC<CalibratedMeterProps> = ({
  percentage,
  totalBars = 10,
  className,
}) => {
  const activeBars = Math.round((percentage / 100) * totalBars);

  return (
    <div className={cn('flex flex-col-reverse gap-[2px] w-5 h-10', className)} title={`${percentage}% Capacity`}>
      {Array.from({ length: totalBars }).map((_, i) => {
        const isFilled = i < activeBars;
        let barColor = 'bg-slate-200';

        if (isFilled) {
          if (i < 3) barColor = 'bg-rose-500';
          else if (i < 5) barColor = 'bg-amber-500';
          else if (i < 8) barColor = 'bg-teal-500';
          else barColor = 'bg-emerald-600';
        }

        return (
          <div
            key={i}
            className={cn('w-full h-[2.5px] rounded-xs transition-colors duration-300', barColor)}
          />
        );
      })}
    </div>
  );
};

export const OperationalHeatmap: React.FC<{
  title?: string;
  className?: string;
}> = ({ title = 'Facility Capacity & Supplier Load Matrix', className }) => {
  const rows = [
    {
      name: 'Main Central Hub',
      code: 'WH-MAIN',
      cells: [
        { status: 'optimal', note: '88% Racking capacity utilized. Optimal throughput.' },
        { status: 'optimal', note: 'All intake bays operational.' },
        { status: 'critical', note: 'Dock A experiencing heavy congestion.' },
        { status: 'optimal', note: 'Fast turn-around on raw steel.' },
        { status: 'critical', note: 'Approaching maximum safety threshold.' },
        { status: 'critical', note: 'Overflow routed to East Buffer.' },
        { status: 'warning', note: 'Staging bay at 74% capacity.' },
        { status: 'optimal', note: 'All outbound orders cleared on time.' },
        { status: 'neutral', note: 'Scheduled quarterly preventive maintenance.' },
        { status: 'optimal', note: 'Fully operational.' },
      ],
    },
    {
      name: 'Production Facility',
      code: 'WH-PROD',
      cells: [
        { status: 'optimal', note: 'Fabrication floor receiving regular batches.' },
        { status: 'warning', note: 'Assembly line buffer requires M8 bolts replenish.' },
        { status: 'critical', note: 'Halt on subassembly line 2 awaiting parts.' },
        { status: 'warning', note: 'Single shift operating at 60%.' },
        { status: 'optimal', note: 'Servo motors arrived.' },
        { status: 'optimal', note: 'Capacity balanced.' },
        { status: 'optimal', note: 'Finished goods ready for packaging.' },
        { status: 'neutral', note: 'Low weekend intake.' },
        { status: 'warning', note: 'Capacity fluctuation.' },
        { status: 'optimal', note: 'Stable state.' },
      ],
    },
    {
      name: 'East Buffer Warehouse',
      code: 'WH-EAST',
      cells: [
        { status: 'neutral', note: '32% utilization. Generous buffer.' },
        { status: 'neutral', note: 'Pallet storage racks available.' },
        { status: 'optimal', note: 'Heavy aluminum sheets securely stored.' },
        { status: 'warning', note: 'High seasonal stock expected.' },
        { status: 'critical', note: 'Transfer shuttle truck #04 delayed by 2h.' },
        { status: 'neutral', note: 'Normal intake processing.' },
        { status: 'optimal', note: 'Stock count verified.' },
        { status: 'optimal', note: 'Ready for transfer dispatches.' },
        { status: 'critical', note: 'Overnight temperature control alert resolved.' },
        { status: 'neutral', note: 'Standby mode.' },
      ],
    },
  ];

  const [activeTooltip, setActiveTooltip] = React.useState<{ text: string; row: string; idx: number } | null>(null);

  const getCellColor = (status: string) => {
    switch (status) {
      case 'optimal':
        return 'bg-emerald-600 hover:bg-emerald-700';
      case 'warning':
        return 'bg-amber-400 hover:bg-amber-500';
      case 'critical':
        return 'bg-rose-500 hover:bg-rose-600';
      case 'neutral':
      default:
        return 'bg-teal-200 hover:bg-teal-300';
    }
  };

  return (
    <div className={cn('p-5 bg-white border border-slate-200 rounded-xl shadow-xs', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-slate-400">Telemetry</div>
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" /> Optimal
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 inline-block" /> Moderate
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" /> Alert / Heavy
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-teal-200 inline-block" /> Buffer
          </span>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        {activeTooltip && (
          <div className="absolute z-30 bg-slate-900 text-white text-[11px] font-mono px-3 py-1.5 rounded shadow-lg max-w-xs pointer-events-none transform -translate-y-9">
            {activeTooltip.text}
          </div>
        )}

        <div className="space-y-2 min-w-[500px]">
          {rows.map((row) => (
            <div key={row.code} className="flex items-center gap-3">
              <div className="w-36 text-xs font-medium text-slate-700 truncate" title={row.name}>
                {row.name}
              </div>
              <div className="flex-1 grid grid-cols-10 gap-1.5">
                {row.cells.map((cell, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onMouseEnter={() => setActiveTooltip({ text: cell.note, row: row.name, idx })}
                    onMouseLeave={() => setActiveTooltip(null)}
                    className={cn(
                      'h-7 rounded-xs transition-all duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-900',
                      getCellColor(cell.status)
                    )}
                    aria-label={`${row.name} cell ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Month Scale */}
          <div className="flex items-center gap-3 pt-2 text-[10px] font-mono text-slate-400">
            <div className="w-36" />
            <div className="flex-1 grid grid-cols-4 text-center">
              <span>WEEK 01</span>
              <span>WEEK 02</span>
              <span>WEEK 03</span>
              <span>WEEK 04</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
