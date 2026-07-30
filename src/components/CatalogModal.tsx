import React, { useState } from 'react';
import { CatalogItem } from '../types';
import {
  Package,
  X,
  Plus,
  Trash2,
  Edit2,
  Search,
  Check,
  Tag,
  Hash,
  DollarSign,
  Barcode,
} from 'lucide-react';

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CatalogItem[];
  onAddItem: (item: Omit<CatalogItem, 'id' | 'createdAt'>) => void;
  onUpdateItem: (id: string, updated: Partial<CatalogItem>) => void;
  onDeleteItem: (id: string) => void;
  onSelectItem: (item: CatalogItem) => void;
  selectedItemId?: string;
}

export const CatalogModal: React.FC<CatalogModalProps> = ({
  isOpen,
  onClose,
  items,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onSelectItem,
  selectedItemId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [isVatted, setIsVatted] = useState(false);
  const [category, setCategory] = useState('');

  if (!isOpen) return null;

  const calculateVatPrice = (mrpVal: string): string => {
    if (!mrpVal.trim()) return '';
    const match = mrpVal.match(/(\d+(?:\.\d+)?)/);
    if (!match) return mrpVal;
    const num = parseFloat(match[1]);
    if (isNaN(num)) return mrpVal;
    const vatted = (num * 1.15).toFixed(2);
    return mrpVal.replace(match[1], vatted);
  };

  const handleOpenAdd = () => {
    setItemCode('');
    setItemName('');
    const defaultMrp = '5.00 SAR';
    setMrp(defaultMrp);
    setIsVatted(false);
    setPrice(defaultMrp);
    setCategory('General');
    setEditingId(null);
    setIsAdding(true);
  };

  const handleStartEdit = (item: CatalogItem) => {
    setItemCode(item.itemCode);
    setItemName(item.itemName);
    setPrice(item.price);
    setMrp(item.mrp || item.price);
    setIsVatted(item.isVatted ?? false);
    setCategory(item.category || '');
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleMrpChange = (newMrp: string) => {
    setMrp(newMrp);
    if (isVatted) {
      setPrice(calculateVatPrice(newMrp));
    } else {
      setPrice(newMrp);
    }
  };

  const handleToggleVatted = (vatted: boolean) => {
    setIsVatted(vatted);
    if (vatted) {
      const calcPrice = calculateVatPrice(mrp || price);
      if (calcPrice) setPrice(calcPrice);
    } else {
      if (mrp) setPrice(mrp);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemCode.trim() || !itemName.trim()) return;

    const itemData = {
      itemCode: itemCode.trim(),
      itemName: itemName.trim(),
      price: price.trim() || '0 SAR',
      mrp: mrp.trim() || price.trim() || '0 SAR',
      isVatted,
      category: category.trim() || 'General',
    };

    if (editingId) {
      onUpdateItem(editingId, itemData);
    } else {
      onAddItem(itemData);
    }

    setIsAdding(false);
    setEditingId(null);
  };

  const filteredItems = items.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.itemName.toLowerCase().includes(q) ||
      item.itemCode.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Saved Item Catalog
              </h2>
              <p className="text-xs text-slate-500">
                Manage your master inventory items, codes, and prices
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {isAdding ? (
            /* Form view */
            <form onSubmit={handleSave} className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingId ? 'Edit Catalog Item' : 'Add New Item to Catalog'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label htmlFor="modal-item-code" className="font-semibold text-slate-700 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-slate-400" /> Item Code (SKU) *
                  </label>
                  <input
                    id="modal-item-code"
                    type="text"
                    required
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    placeholder="e.g. 11002546"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono text-slate-900 focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-item-name" className="font-semibold text-slate-700 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400" /> Item Name *
                  </label>
                  <input
                    id="modal-item-name"
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Ball point pen"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-item-mrp" className="font-semibold text-slate-700 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" /> MRP (Non-vatted)
                  </label>
                  <input
                    id="modal-item-mrp"
                    type="text"
                    value={mrp}
                    onChange={(e) => handleMrpChange(e.target.value)}
                    placeholder="e.g. 5.00 SAR"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-item-price" className="font-semibold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Price
                    </span>
                    {isVatted && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        Includes 15% VAT
                      </span>
                    )}
                  </label>
                  <input
                    id="modal-item-price"
                    type="text"
                    value={price}
                    readOnly
                    placeholder="Calculated price"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-700 font-medium cursor-default focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">
                    (Is item vatted?)
                  </label>
                  <div className="flex items-center gap-2 p-1 bg-slate-200/70 rounded-lg">
                    <button
                      type="button"
                      onClick={() => handleToggleVatted(false)}
                      className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${
                        !isVatted
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleVatted(true)}
                      className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${
                        isVatted
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Yes (+15% VAT)
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-item-category" className="font-semibold text-slate-700">
                    Category (Optional)
                  </label>
                  <input
                    id="modal-item-category"
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Stationery"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-xs"
                >
                  {editingId ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Search bar & Add button */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search item code, name or category..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-500">No items match your search.</p>
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const isSelected = selectedItemId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white hover:border-slate-300 border-slate-200/80'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold truncate ${
                                isSelected ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              {item.itemName}
                            </span>
                            {item.category && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                  isSelected
                                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200/80'
                                }`}
                              >
                                {item.category}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px]">
                            <span
                              className={`font-mono font-medium ${
                                isSelected ? 'text-slate-300' : 'text-slate-500'
                              }`}
                            >
                              Code: <strong className="font-bold">{item.itemCode}</strong>
                            </span>
                            {item.mrp && (
                              <span
                                className={`font-mono ${
                                  isSelected ? 'text-slate-400' : 'text-slate-500'
                                }`}
                              >
                                MRP: <span className="font-semibold">{item.mrp}</span>
                              </span>
                            )}
                            <span
                              className={`font-semibold ${
                                isSelected ? 'text-emerald-300' : 'text-emerald-700'
                              }`}
                            >
                              Price: {item.price}
                            </span>
                            {item.isVatted && (
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                  isSelected
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                +15% VAT
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectItem(item);
                              onClose();
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 ${
                              isSelected
                                ? 'bg-white text-slate-900 hover:bg-slate-100'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            }`}
                          >
                            <Barcode className="w-3.5 h-3.5" />
                            <span>{isSelected ? 'Active' : 'Select'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSelected
                                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteItem(item.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSelected
                                ? 'text-rose-300 hover:text-rose-100 hover:bg-rose-950/40'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Total items: <strong className="text-slate-900">{items.length}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
