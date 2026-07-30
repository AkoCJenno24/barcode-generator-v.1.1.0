import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BarcodePreview } from './components/BarcodePreview';
import { BarcodeControls } from './components/BarcodeControls';
import { PrintSheetModal } from './components/PrintSheetModal';
import { BatchModal } from './components/BatchModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { CatalogModal } from './components/CatalogModal';
import { ToastNotification, ToastData } from './components/ToastNotification';
import { DEFAULT_CATALOG_ITEMS } from './data/catalog';
import { formatPriceWithDecimals } from './utils/barcodeUtils';
import { detectLocalPrinter, applyPrinterPreset } from './utils/printerUtils';
import { BarcodeOptions, BarcodeHistoryItem, CatalogItem } from './types';

const CATALOG_STORAGE_KEY = 'barcode_studio_catalog_v1';
const HISTORY_STORAGE_KEY = 'barcode_studio_history_v1';

const INITIAL_ITEM = DEFAULT_CATALOG_ITEMS[0]; // Ball point pen (11002546, 5 SAR)
const INITIAL_BATCH = 'R1456';

const DEFAULT_OPTIONS: BarcodeOptions = {
  text: `${INITIAL_ITEM.itemCode}.${INITIAL_BATCH}`,
  format: 'CODE128',
  lineColor: '#000000',
  background: '#ffffff',
  width: 1.6,
  height: 100,
  displayValue: false,
  font: 'serif',
  fontSize: 26,
  fontPosition: 'bottom',
  textAlign: 'center',
  textMargin: 4,
  margin: 12,
  flat: false,
  labelMode: 'retailFrame',
  itemCode: INITIAL_ITEM.itemCode,
  itemName: INITIAL_ITEM.itemName,
  price: INITIAL_ITEM.price,
  batch: INITIAL_BATCH,
  showBorder: true,
  borderWidth: 3,
  borderTextGap: 8,
  barcodePriceGap: 6,
  activeFrameWidthInches: 1.90,
  activeFrameHeightInches: 0.90,
  wasfatyType: 'Non-Wasfaty',
};

export default function App() {
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(DEFAULT_CATALOG_ITEMS);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(INITIAL_ITEM);
  const [itemBatch, setItemBatch] = useState<string>(INITIAL_BATCH);
  const [options, setOptions] = useState<BarcodeOptions>(DEFAULT_OPTIONS);
  const [history, setHistory] = useState<BarcodeHistoryItem[]>([]);
  const [toast, setToast] = useState<ToastData | null>(null);

  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  // Auto-detect local default printer on mount
  useEffect(() => {
    detectLocalPrinter()
      .then((res) => {
        setOptions((prev) => applyPrinterPreset(prev, res.preset));
      })
      .catch(() => {});
  }, []);

  // Load catalog items from localStorage
  useEffect(() => {
    try {
      const savedCatalog = localStorage.getItem(CATALOG_STORAGE_KEY);
      if (savedCatalog) {
        const parsed = JSON.parse(savedCatalog);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCatalogItems(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load catalog items from localStorage', e);
    }
  }, []);

  // Save catalog items to localStorage
  const saveCatalogToStorage = (items: CatalogItem[]) => {
    setCatalogItems(items);
    try {
      localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save catalog items to localStorage', e);
    }
  };

  const handleAddCatalogItem = (newItemData: Omit<CatalogItem, 'id' | 'createdAt'>) => {
    const formattedPrice = formatPriceWithDecimals(newItemData.price);
    const newItem: CatalogItem = {
      ...newItemData,
      price: formattedPrice,
      id: `item-${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
    };
    const updated = [newItem, ...catalogItems];
    saveCatalogToStorage(updated);
    setSelectedItem(newItem);

    // Update barcode text and retail options
    const cleanBatch = itemBatch.trim();
    setOptions((prev) => ({
      ...prev,
      text: cleanBatch ? `${newItem.itemCode}.${cleanBatch}` : newItem.itemCode,
      itemCode: newItem.itemCode,
      itemName: newItem.itemName,
      price: formattedPrice,
      batch: cleanBatch,
    }));

    // Trigger instant toast notification when adding a new item
    setToast({
      id: Date.now(),
      title: 'Item Added Successfully',
      message: `"${newItem.itemName}" has been saved to your catalog and set as active item.`,
      type: 'success',
      itemInfo: {
        itemCode: newItem.itemCode,
        itemName: newItem.itemName,
        price: formattedPrice,
      },
    });
  };

  const handleUpdateCatalogItem = (id: string, updatedData: Partial<CatalogItem>) => {
    const dataToSave = { ...updatedData };
    if (dataToSave.price) {
      dataToSave.price = formatPriceWithDecimals(dataToSave.price);
    }
    const updated = catalogItems.map((item) =>
      item.id === id ? { ...item, ...dataToSave } : item
    );
    saveCatalogToStorage(updated);
    if (selectedItem && selectedItem.id === id) {
      const updatedSelected = { ...selectedItem, ...dataToSave };
      setSelectedItem(updatedSelected);

      const cleanBatch = itemBatch.trim();
      setOptions((prev) => ({
        ...prev,
        text: cleanBatch ? `${updatedSelected.itemCode}.${cleanBatch}` : updatedSelected.itemCode,
        itemCode: updatedSelected.itemCode,
        itemName: updatedSelected.itemName,
        price: formatPriceWithDecimals(updatedSelected.price),
        batch: cleanBatch,
      }));
    }

    setToast({
      id: Date.now(),
      title: 'Catalog Item Updated',
      message: `Item code ${dataToSave.itemCode || 'details'} saved.`,
      type: 'info',
    });
  };

  const handleDeleteCatalogItem = (id: string) => {
    const updated = catalogItems.filter((item) => item.id !== id);
    saveCatalogToStorage(updated);
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem(null);
    }

    setToast({
      id: Date.now(),
      title: 'Item Removed',
      message: 'Item deleted from saved catalog.',
      type: 'warning',
    });
  };

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage', e);
    }
  }, []);

  // Save to history automatically when valid barcode changes
  useEffect(() => {
    if (!options.text || options.text.trim().length === 0) return;

    const timer = setTimeout(() => {
      setHistory((prev) => {
        // Prevent duplicate consecutive entries
        if (prev.length > 0 && prev[0].text === options.text && prev[0].format === options.format) {
          return prev;
        }

        const titleText = selectedItem
          ? `${selectedItem.itemName} (${options.text})`
          : options.text;

        const newItem: BarcodeHistoryItem = {
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: titleText,
          text: options.text,
          format: options.format,
          createdAt: Date.now(),
          options: { ...options },
        };

        const updated = [newItem, ...prev.slice(0, 19)]; // Keep max 20
        try {
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.warn('Failed to save history', e);
        }
        return updated;
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [options, selectedItem]);

  const handleResetDefaults = () => {
    setSelectedItem(INITIAL_ITEM);
    setItemBatch(INITIAL_BATCH);
    setOptions(DEFAULT_OPTIONS);
  };

  const handleSelectHistoryItem = (item: BarcodeHistoryItem) => {
    setOptions(item.options);
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear history', e);
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save history after deletion', e);
      }
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-slate-100/60 font-sans text-slate-900 flex flex-col selection:bg-slate-900 selection:text-white">
      {/* Top Header */}
      <Header
        onOpenPrintSheet={() => setIsPrintSheetOpen(true)}
        onOpenBatch={() => setIsBatchOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenCatalog={() => setIsCatalogOpen(true)}
        historyCount={history.length}
        catalogCount={catalogItems.length}
      />

      {/* Main Single-View Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Live Preview Card: Shown first on mobile, sticky top on desktop */}
          <div className="order-1 lg:order-2 lg:col-span-7 lg:sticky lg:top-20">
            <BarcodePreview
              options={options}
              onChangeOptions={setOptions}
              onQuickPrint={() => setIsPrintSheetOpen(true)}
            />
          </div>

          {/* Barcode Controls Column */}
          <div className="order-2 lg:order-1 lg:col-span-5">
            <BarcodeControls
              options={options}
              onChangeOptions={setOptions}
              onReset={handleResetDefaults}
              catalogItems={catalogItems}
              selectedItem={selectedItem}
              onSelectItem={setSelectedItem}
              itemBatch={itemBatch}
              onChangeBatch={setItemBatch}
              onOpenCatalogModal={() => setIsCatalogOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Modals & Drawers */}
      <PrintSheetModal
        isOpen={isPrintSheetOpen}
        onClose={() => setIsPrintSheetOpen(false)}
        options={options}
        selectedItem={selectedItem}
      />

      <BatchModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        defaultFormat={options.format}
      />

      <CatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        items={catalogItems}
        onAddItem={handleAddCatalogItem}
        onUpdateItem={handleUpdateCatalogItem}
        onDeleteItem={handleDeleteCatalogItem}
        onSelectItem={(item) => {
          setSelectedItem(item);
          const cleanBatch = itemBatch.trim();
          setOptions((prev) => ({
            ...prev,
            text: cleanBatch ? `${item.itemCode}.${cleanBatch}` : item.itemCode,
            itemCode: item.itemCode,
            itemName: item.itemName,
            price: item.price,
            batch: cleanBatch,
          }));
        }}
        selectedItemId={selectedItem?.id}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistoryItem={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
        onDeleteItem={handleDeleteHistoryItem}
      />

      {/* Floating Notification Toast */}
      <ToastNotification
        toast={toast}
        onDismiss={() => setToast(null)}
        duration={2500}
      />
    </div>
  );
}
