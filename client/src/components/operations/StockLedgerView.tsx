'use client';

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Search,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  HardHat,
  Clock,
  Printer,
} from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { Badge } from '@/components/common/Badge';
import { StockMovementArrow } from '@/components/common/StockMovementArrow';
import { formatDateTime } from '@/lib/utils';

export const StockLedgerView: React.FC = () => {
  const { ledger, products, currentUser, staffActivity } = useInventory();

  const isStaff = currentUser.role === 'warehouse_staff';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOperation, setSelectedOperation] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');

  const filteredEntries = useMemo(() => {
    return ledger.filter((entry) => {
      const matchesSearch =
        !searchQuery ||
        entry.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.sourceLocationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.destinationLocationName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesOp =
        selectedOperation === 'all' || entry.operationType === selectedOperation;

      const matchesProd =
        selectedProduct === 'all' || entry.productId === selectedProduct;

      return matchesSearch && matchesOp && matchesProd;
    });
  }, [ledger, searchQuery, selectedOperation, selectedProduct]);

  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'Reference',
      'Product',
      'SKU',
      'Operation',
      'Source',
      'Destination',
      'Delta',
      'UoM',
      'Total Balance',
      'Operator',
      'Status',
    ];
    const rows = filteredEntries.map((e) => [
      e.timestamp,
      e.referenceNumber,
      `"${e.productName}"`,
      e.sku,
      e.operationType,
      `"${e.sourceLocationName}"`,
      `"${e.destinationLocationName}"`,
      e.quantityDelta,
      e.unitOfMeasure,
      e.resultingTotalStock,
      `"${e.userName}"`,
      e.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stocksense_stock_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Staff View: MY ACTIVITY (No full ledger access)
  if (isStaff) {
    return (
      <div className="space-y-6 pb-16 font-body">
        {/* Staff Activity Header */}
        <div className="border-b border-slate-200 pb-5">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-mono font-semibold mb-1">
            Personal Floor Log &bull; {currentUser.assignedWarehouseName || 'Main Central Hub'}
          </div>
          <h1 className="text-page-title text-slate-900">
            MY ACTIVITY
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Log of your submitted warehouse receipts, pick/pack deliveries, transfers, and physical counts. Official inventory updates only after Manager approval.
          </p>
        </div>

        {/* Activity Stream */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs max-w-3xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
              Today&apos;s Submitted Operations ({currentUser.name})
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {staffActivity.length} logged actions
            </span>
          </div>

          <div className="space-y-3.5">
            {staffActivity.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No activity logged yet for this shift.
              </div>
            ) : (
              staffActivity.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 shrink-0">
                      {item.time}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">
                        {item.action}
                      </div>
                      <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                        Ref #{item.reference} {item.details ? `· ${item.details}` : ''}
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded text-xs font-mono font-medium self-start sm:self-auto bg-amber-50 text-amber-800 border border-amber-200">
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Manager View: FULL STOCK LEDGER
  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-[11px] font-sans uppercase tracking-wider text-slate-500 font-semibold mb-1">
            Audit Trail &amp; Compliance Register &bull; Corporate Scope
          </div>
          <h1 className="text-page-title text-slate-950">
            Master Stock Ledger
          </h1>
          <p className="text-sm text-slate-600 font-sans mt-0.5">
            Immutable chronological register of all inward, outward, and transfer stock adjustments across all warehouses.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 rounded-lg text-xs font-sans font-medium transition-all shadow-2xs cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-600" strokeWidth={1.75} />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Control Bar: Multi-Filter Engine */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference (#REC-1042), article, or location..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm font-sans text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </div>

          <div className="w-full md:w-56">
            <select
              value={selectedOperation}
              onChange={(e) => setSelectedOperation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              <option value="all">All Operations</option>
              <option value="Receipt">Receipt (Inbound)</option>
              <option value="Delivery">Delivery (Outbound)</option>
              <option value="Internal Transfer">Internal Transfer</option>
              <option value="Adjustment">Stock Adjustment</option>
              <option value="Initial Stock">Initial Balance</option>
            </select>
          </div>

          <div className="w-full md:w-60">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              <option value="all">All Articles</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.sku}]
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Industrial Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[11px] font-sans font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Reference #</th>
                <th className="py-3 px-4">Article &amp; SKU</th>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4">Origin → Destination Flow</th>
                <th className="py-3 px-4 text-right">Delta (Δ)</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4">Warehouse Staff</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-[13px]">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500 font-sans text-sm">
                    No ledger entries matching criteria.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-xs">
                      {formatDateTime(entry.timestamp)}
                    </td>

                    {/* Reference # */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {entry.referenceNumber}
                      </span>
                    </td>

                    {/* Product & SKU */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 text-sm truncate max-w-[200px]" title={entry.productName}>
                        {entry.productName}
                      </div>
                      <div className="text-xs font-mono text-slate-500">{entry.sku}</div>
                    </td>

                    {/* Operation */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge
                        status={
                          entry.operationType === 'Receipt'
                            ? 'done'
                            : entry.operationType === 'Delivery'
                            ? 'ready'
                            : entry.operationType === 'Internal Transfer'
                            ? 'blue'
                            : 'neutral'
                        }
                      >
                        {entry.operationType}
                      </Badge>
                    </td>

                    {/* Movement Flow (Source -> Destination) */}
                    <td className="py-3 px-4">
                      <StockMovementArrow
                        source={entry.sourceLocationName}
                        destination={entry.destinationLocationName}
                        compact={true}
                        className="py-0"
                      />
                    </td>

                    {/* Delta */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-semibold font-mono text-xs ${
                          entry.quantityDelta > 0
                            ? 'text-emerald-700'
                            : entry.quantityDelta < 0
                            ? 'text-rose-700'
                            : 'text-slate-700'
                        }`}
                      >
                        {entry.quantityDelta > 0
                          ? `+${entry.quantityDelta}`
                          : entry.quantityDelta === 0
                          ? '0'
                          : entry.quantityDelta}{' '}
                        {entry.unitOfMeasure}
                      </span>
                    </td>

                    {/* Resulting Total Stock */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-medium text-slate-900 text-xs font-mono">
                      {entry.resultingTotalStock} {entry.unitOfMeasure}
                    </td>

                    {/* Operator */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 text-xs">
                      {entry.userName}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <Badge variant="success" size="sm">
                        {entry.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
