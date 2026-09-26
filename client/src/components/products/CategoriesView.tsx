'use client';

import React, { useState } from 'react';
import { Tags, Plus, Boxes, ArrowRight } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { Modal } from '@/components/common/Modal';
import { NavigationTab } from '@/components/layout/AppSidebar';

interface CategoriesViewProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ onNavigate }) => {
  const { categories, products } = useInventory();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catDesc, setCatDesc] = useState('');

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-[11px] font-sans uppercase tracking-wider text-slate-500 font-semibold mb-1">
            Master Data Classification
          </div>
          <h1 className="text-page-title text-slate-950">
            Product Categories
          </h1>
          <p className="text-sm text-slate-600 font-sans mt-0.5">
            Hierarchical indexing and taxonomic grouping for automated accounting &amp; replenishment
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-sans font-medium hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-orange-400" strokeWidth={1.75} />
          <span>New Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const matchingProds = products.filter((p) => p.category === cat.name);
          const totalUnits = matchingProds.reduce(
            (sum, p) => sum + (p.locationStock || []).reduce((acc, l) => acc + l.quantity, 0),
            0
          );

          return (
            <div
              key={cat.id}
              className="p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-slate-900 font-sans">{cat.name}</h3>
                  </div>
                  <span className="text-[11px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    Code: {cat.code}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <Tags className="w-4 h-4" strokeWidth={1.75} />
                </div>
              </div>

              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-sans">
                {cat.description || 'General industrial taxonomy category.'}
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-sans text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                  <strong className="font-medium text-slate-900">{matchingProds.length}</strong> Articles
                </span>
                <span className="font-mono text-slate-800">{totalUnits} Units on Hand</span>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('products')}
                className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-sans font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Filter Products</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              </button>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Define Category"
        subtitle="Taxonomy Setup"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Pneumatic Valves & Pumps"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Taxonomy Code *
            </label>
            <input
              type="text"
              value={catCode}
              onChange={(e) => setCatCode(e.target.value.toUpperCase())}
              placeholder="e.g. PNM"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              placeholder="Provide definition and storage handling requirements..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-sans font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (catName && catCode) {
                  categories.push({
                    id: `cat-${Date.now().toString().slice(-4)}`,
                    name: catName,
                    code: catCode,
                    description: catDesc,
                    productCount: 0,
                  });
                  setIsAddOpen(false);
                  setCatName('');
                  setCatCode('');
                  setCatDesc('');
                }
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-sans font-medium hover:bg-slate-800 cursor-pointer"
            >
              Save Category
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
