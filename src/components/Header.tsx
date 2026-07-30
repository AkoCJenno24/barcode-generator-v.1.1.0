import React from 'react';
import { Barcode, Printer, History, Package } from 'lucide-react';

interface HeaderProps {
  onOpenPrintSheet: () => void;
  onOpenBatch?: () => void;
  onOpenHistory: () => void;
  onOpenCatalog: () => void;
  historyCount: number;
  catalogCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPrintSheet,
  onOpenHistory,
  onOpenCatalog,
  historyCount,
  catalogCount,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <Barcode className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                Barcode Generator
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
                Studio
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5 hidden sm:block">
              v.1.1.0 by JhenX Dev
            </p>
          </div>
        </div>

        {/* Right header actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCatalog}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-400"
            title="Manage saved item catalog & presets"
          >
            <Package className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Item Catalog</span>
            <span className="sm:hidden">Items</span>
            {catalogCount > 0 && (
              <span className="ml-0.5 text-[10px] bg-slate-200 font-bold px-1.5 py-0.2 rounded-full text-slate-700">
                {catalogCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenPrintSheet}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            title="Format barcodes onto a printable label sheet"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Labels</span>
          </button>

          <button
            type="button"
            onClick={onOpenHistory}
            className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Saved barcode history"
          >
            <History className="w-4 h-4" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                {historyCount > 9 ? '9+' : historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
