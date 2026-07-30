import { supabase, isSupabaseConfigured } from './supabase';
import { CatalogItem, BarcodeHistoryItem, BarcodeOptions } from '../types';

export interface SupabaseResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface SupabaseCatalogItemRow {
  id: string;
  item_code: string;
  item_name: string;
  price: string;
  mrp?: string;
  is_vatted?: boolean;
  category?: string;
  format?: string;
  created_at?: string;
  user_id?: string;
}

export interface SupabaseSavedBarcodeRow {
  id: string;
  title: string;
  text: string;
  format: string;
  options: BarcodeOptions;
  created_at?: string;
  user_id?: string;
}

/**
 * Tests database connectivity by making a lightweight query.
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: unknown;
}> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: 'Supabase credentials are missing or unconfigured in environment variables.',
    };
  }

  try {
    // Attempt a light query on catalog_items or auth
    const { error } = await supabase.from('catalog_items').select('id', { count: 'exact', head: true });

    if (error) {
      // If table does not exist yet (PGRST204 or 42P01), connection to Supabase itself succeeded
      if (error.code === '42P01' || error.message.includes('relation "public.catalog_items" does not exist')) {
        return {
          success: true,
          message: 'Connected to Supabase! Tables need initialization (SQL schema generator available below).',
          details: error,
        };
      }
      return {
        success: false,
        message: `Supabase Error (${error.code || 'Query Error'}): ${error.message}`,
        details: error,
      };
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase database!',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Network or Connection Error: ${errorMsg}`,
      details: err,
    };
  }
}

/**
 * Catalog Items CRUD Operations
 */

export async function fetchCatalogItemsFromSupabase(): Promise<{
  data: CatalogItem[] | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('catalog_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    const items: CatalogItem[] = (data || []).map((row: SupabaseCatalogItemRow) => ({
      id: row.id,
      itemCode: row.item_code,
      itemName: row.item_name,
      price: row.price,
      mrp: row.mrp,
      isVatted: row.is_vatted,
      category: row.category,
      format: row.format as CatalogItem['format'],
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    }));

    return { data: items, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { data: null, error: msg };
  }
}

export async function insertCatalogItemToSupabase(
  item: Omit<CatalogItem, 'id'> & { id?: string }
): Promise<{ data: CatalogItem | null; error: string | null }> {
  try {
    const id = item.id || `sup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const row = {
      id,
      item_code: item.itemCode,
      item_name: item.itemName,
      price: item.price,
      mrp: item.mrp || '',
      is_vatted: Boolean(item.isVatted),
      category: item.category || 'General',
      format: item.format || 'CODE128',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('catalog_items')
      .insert([row])
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    const createdItem: CatalogItem = {
      id: data.id,
      itemCode: data.item_code,
      itemName: data.item_name,
      price: data.price,
      mrp: data.mrp,
      isVatted: data.is_vatted,
      category: data.category,
      format: data.format,
      createdAt: new Date(data.created_at).getTime(),
    };

    return { data: createdItem, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { data: null, error: msg };
  }
}

export async function updateCatalogItemInSupabase(
  id: string,
  updates: Partial<CatalogItem>
): Promise<{ data: CatalogItem | null; error: string | null }> {
  try {
    const dbUpdates: Partial<SupabaseCatalogItemRow> = {};
    if (updates.itemCode !== undefined) dbUpdates.item_code = updates.itemCode;
    if (updates.itemName !== undefined) dbUpdates.item_name = updates.itemName;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.mrp !== undefined) dbUpdates.mrp = updates.mrp;
    if (updates.isVatted !== undefined) dbUpdates.is_vatted = updates.isVatted;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.format !== undefined) dbUpdates.format = updates.format;

    const { data, error } = await supabase
      .from('catalog_items')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    const updatedItem: CatalogItem = {
      id: data.id,
      itemCode: data.item_code,
      itemName: data.item_name,
      price: data.price,
      mrp: data.mrp,
      isVatted: data.is_vatted,
      category: data.category,
      format: data.format,
      createdAt: new Date(data.created_at).getTime(),
    };

    return { data: updatedItem, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { data: null, error: msg };
  }
}

export async function deleteCatalogItemFromSupabase(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from('catalog_items').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Saved Barcodes / Designs CRUD Operations
 */

export async function fetchSavedBarcodesFromSupabase(): Promise<{
  data: BarcodeHistoryItem[] | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('saved_barcodes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    const items: BarcodeHistoryItem[] = (data || []).map((row: SupabaseSavedBarcodeRow) => ({
      id: row.id,
      title: row.title,
      text: row.text,
      format: row.format as BarcodeHistoryItem['format'],
      options: row.options,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    }));

    return { data: items, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { data: null, error: msg };
  }
}

export async function insertSavedBarcodeToSupabase(
  barcode: Omit<BarcodeHistoryItem, 'id'> & { id?: string }
): Promise<{ data: BarcodeHistoryItem | null; error: string | null }> {
  try {
    const id = barcode.id || `bc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const row = {
      id,
      title: barcode.title,
      text: barcode.text,
      format: barcode.format,
      options: barcode.options,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('saved_barcodes')
      .insert([row])
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    const createdBarcode: BarcodeHistoryItem = {
      id: data.id,
      title: data.title,
      text: data.text,
      format: data.format,
      options: data.options,
      createdAt: new Date(data.created_at).getTime(),
    };

    return { data: createdBarcode, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { data: null, error: msg };
  }
}

export async function deleteSavedBarcodeFromSupabase(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from('saved_barcodes').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Authentication Helpers
 */

export async function getCurrentSupabaseUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  } catch {
    return null;
  }
}

export async function signInSupabaseAnonymously() {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return { user: data.user, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { user: null, error: msg };
  }
}

export async function signOutSupabaseUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
