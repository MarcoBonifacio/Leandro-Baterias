/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { BatteryProduct, OrderDetails, UserProfile } from '../types';
import { BATTERY_PRODUCTS } from '../data/batteryData';

// Safe environment fallback matching provided project information
let rawSupabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://nhrfkjvuaopkuyaqybgj.supabase.co';

// Sanitización para prevenir el error PGRST125: "Invalid path specified in request URL"
let supabaseUrl = rawSupabaseUrl.trim();
supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, ''); 
supabaseUrl = supabaseUrl.replace(/\/+$/, ''); 

const supabaseAnonKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocmZranZ1YW9wa3V5YXF5YmdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjM5ODAsImV4cCI6MjA5NzI5OTk4MH0.ph-Csb6p5b4AayNP6tDLg_JYNJk1L28_qBIXgcAk2bs').trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Seeds categories and products if not already seeded
 */
export async function seedSupabaseData() {
  try {
    // 1. Check or seed Categories
    let { data: existingCats } = await supabase.from('categories').select('*');
    if (!existingCats || existingCats.length === 0) {
      const { data: insertedCats, error: catErr } = await supabase
        .from('categories')
        .insert([
          { name: 'auto', description: 'Baterías para autos y pequeños utilitarios' },
          { name: 'pesado', description: 'Baterías para camiones, buses y maquinaria pesada' }
        ])
        .select();
      
      if (catErr) {
        console.error('Failed to seed categories:', catErr);
        return;
      }
      existingCats = insertedCats;
    }

    const autoCat = existingCats?.find(c => c.name === 'auto');
    const pesadoCat = existingCats?.find(c => c.name === 'pesado');

    if (!autoCat || !pesadoCat) return;

    // 2. Check and Seed Products
    const { data: existingProds } = await supabase.from('products').select('id');
    const existingIds = new Set((existingProds || []).map(p => p.id));

    const prodsToInsert = BATTERY_PRODUCTS
      .filter(p => !existingIds.has(p.id))
      .map(p => ({
        id: p.id,
        category_id: p.category === 'pesado' ? pesadoCat.id : autoCat.id,
        title: `${p.brand} ${p.model}`,
        sku: p.id,
        brand: p.brand,
        model: p.model,
        price: p.price,
        stock: p.stock ? 50 : 0,
        amperage: `${p.amperage}Ah`,
        voltage: `${p.voltage}V`,
        image_url: p.imageUrl || '',
        is_active: true
      }));

    if (prodsToInsert.length > 0) {
      const { error: prodErr } = await supabase
        .from('products')
        .insert(prodsToInsert);
      
      if (prodErr) {
        console.error('Failed to seed products list:', prodErr.message);
      } else {
        console.log(`Successfully seeded ${prodsToInsert.length} products to Supabase.`);
      }
    }
  } catch (err) {
    console.error('Error during Supabase auto-seed:', err);
  }
}

/**
 * Fetches products from Supabase products catalog and merges with frontend configurations
 */
export async function getProductsFromSupabase(): Promise<BatteryProduct[]> {
  try {
    // 1. Fetch categories
    let { data: dbCategories, error: catError } = await supabase
      .from('categories')
      .select('*');
    
    if (catError) {
      console.warn('Error fetching categories from Supabase:', catError);
      return BATTERY_PRODUCTS;
    }

    // 2. Fetch products
    let { data: dbProducts, error: prodError } = await supabase
      .from('products')
      .select('*');

    if (prodError) {
      console.warn('Error fetching products from Supabase:', prodError);
      return BATTERY_PRODUCTS;
    }

    // Auto-seed if empty
    if (!dbCategories || dbCategories.length === 0 || !dbProducts || dbProducts.length === 0) {
      console.log('No elements detected in Supabase, executing auto-seed...');
      await seedSupabaseData();
      
      const { data: seededCats } = await supabase.from('categories').select('*');
      const { data: seededProds } = await supabase.from('products').select('*');
      
      dbCategories = seededCats || [];
      dbProducts = seededProds || [];
    }

    // 3. Map dbProducts with additional details from local BATTERY_PRODUCTS
    const mappedProducts: BatteryProduct[] = (dbProducts || []).map(p => {
      const localProd = BATTERY_PRODUCTS.find(l => l.id === p.id);
      const matchedCat = dbCategories?.find(c => c.id === p.category_id);
      const catName = (matchedCat?.name === 'pesado' || localProd?.category === 'pesado' ? 'pesado' : 'auto') as 'auto' | 'pesado';

      return {
        id: p.id,
        brand: p.brand || localProd?.brand || 'Batería',
        model: p.model || localProd?.model || 'Estándar',
        amperage: parseInt(p.amperage) || localProd?.amperage || 60,
        voltage: parseInt(p.voltage) || localProd?.voltage || 12,
        cca: p.cca || localProd?.cca || 500,
        polarity: (p.polarity || localProd?.polarity || 'Derecha') as 'Derecha' | 'Izquierda',
        dimensions: p.dimensions || localProd?.dimensions || 'Estándar',
        warrantyMonths: p.warranty_months || localProd?.warrantyMonths || 12,
        price: Number(p.price) || localProd?.price || 100,
        category: catName,
        type: (p.type || localProd?.type || 'Plomo-Ácido') as any,
        description: p.description || localProd?.description || p.title || 'Batería automotriz de alta gama',
        popular: localProd?.popular || false,
        stock: p.stock > 0,
        imageUrl: p.image_url || localProd?.imageUrl || ''
      };
    });

    return mappedProducts.length > 0 ? mappedProducts : BATTERY_PRODUCTS;
  } catch (err) {
    console.error('Critical database fallback triggered:', err);
    return BATTERY_PRODUCTS;
  }
}

/**
 * Creates Order, Customer, Payments, and Order items into Supabase
 */
export async function createOrderInSupabase(
  cart: { product: BatteryProduct; quantity: number }[],
  orderDetails: OrderDetails,
  totals: { subtotal: number; taxes: number; total: number }
): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || null;

    // 1. Try to find or insert customer
    let customerId: string | null = null;
    const nameParts = orderDetails.customerName.trim().split(' ');
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || 'Invitado';

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', orderDetails.email.toLowerCase().trim())
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCust, error: custErr } = await supabase
        .from('customers')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: orderDetails.email.toLowerCase().trim(),
          phone: orderDetails.phone,
          document_type: orderDetails.receiptType === 'factura' ? 'RUC' : 'DNI',
          document_id: orderDetails.documentId
        })
        .select()
        .single();
      
      if (!custErr && newCust) {
        customerId = newCust.id;
      }
    }

    // 2. Insert Order Header
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const shippingAddress = orderDetails.deliveryMethod === 'envio_colocacion'
      ? orderDetails.address || 'Envío solicitado'
      : 'Retiro en Local';

    const orderRecord: any = {
      id: orderId,
      customer_id: customerId,
      user_id: userId,
      date: new Date().toLocaleDateString('es-PE'),
      customer_name: orderDetails.customerName,
      document_id: orderDetails.documentId,
      receipt_type: orderDetails.receiptType,
      email: orderDetails.email,
      phone_number: orderDetails.phone,
      shipping_address: shippingAddress,
      subtotal: totals.subtotal,
      taxes: totals.taxes,
      total: totals.total,
      status: 'Pendiente'
    };

    const { error: orderErr } = await supabase
      .from('orders')
      .insert(orderRecord);

    if (orderErr) throw orderErr;

    // 3. Insert Order Items
    const itemsToInsert = cart.map(item => ({
      order_id: orderId,
      product_id: item.product.id,
      product_title: `${item.product.brand} ${item.product.model}`,
      product_sku: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price
    }));

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsErr) console.warn('Error inserting order items:', itemsErr);

    // 4. Create Payment reference
    const { error: payErr } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        payment_method: orderDetails.paymentMethod,
        transaction_reference: `OP-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: totals.total,
        status: 'Pendiente'
      });

    if (payErr) console.warn('Error inserting payment reference:', payErr);

    return orderId;
  } catch (err) {
    console.error('Failed to create order tracking in database:', err);
    throw err;
  }
}

/**
 * Adds a new custom battery product to Supabase DB
 */
export async function addProductToSupabase(newProduct: Omit<BatteryProduct, 'id'>): Promise<BatteryProduct> {
  try {
    let { data: dbCategories } = await supabase.from('categories').select('*');
    const matchedCat = dbCategories?.find(c => c.name === newProduct.category) || dbCategories?.[0];
    const categoryId = matchedCat?.id;

    const id = `item-${Date.now()}`;
    
    // Mapeo unificado estricto a snake_case sin campos duplicados inválidos
    const productRecord = {
      id: id,
      category_id: categoryId,
      title: `${newProduct.brand} ${newProduct.model}`,
      sku: id,
      brand: newProduct.brand,
      model: newProduct.model,
      price: Number(newProduct.price),
      stock: newProduct.stock ? 50 : 0, 
      amperage: `${newProduct.amperage}Ah`,
      voltage: `${newProduct.voltage}V`,
      cca: Number(newProduct.cca || 500),
      polarity: newProduct.polarity || 'Derecha',
      dimensions: newProduct.dimensions || 'Estándar',
      warranty_months: Number(newProduct.warrantyMonths || 12),
      type: newProduct.type || 'Plomo-Ácido',
      description: newProduct.description || `${newProduct.brand} ${newProduct.model}`,
      image_url: newProduct.imageUrl || ''
    };

    const { error } = await supabase.from('products').insert(productRecord);
    if (error) throw error;

    return {
      ...newProduct,
      id
    };
  } catch (err: any) {
    console.error('Failed to insert new custom battery:', err.message || err);
    throw err;
  }
}

/**
 * Updates an existing battery product in Supabase DB
 */
export async function updateProductInSupabase(productId: string, updatedFields: Partial<BatteryProduct>): Promise<BatteryProduct> {
  try {
    let categoryId: string | undefined;
    if (updatedFields.category) {
      const { data: dbCategories } = await supabase.from('categories').select('*');
      const matchedCat = dbCategories?.find(c => c.name === updatedFields.category);
      if (matchedCat) {
        categoryId = matchedCat.id;
      }
    }

    // Construcción limpia del Payload: Se remueven propiedades mixedCase/camelCase que rompen Postgres
    const updatePayload: any = {};
    if (updatedFields.brand !== undefined) updatePayload.brand = updatedFields.brand;
    if (updatedFields.model !== undefined) updatePayload.model = updatedFields.model;
    if (updatedFields.brand !== undefined || updatedFields.model !== undefined) {
      updatePayload.title = `${updatedFields.brand || ''} ${updatedFields.model || ''}`.trim();
    }
    if (updatedFields.price !== undefined) updatePayload.price = Number(updatedFields.price);
    if (updatedFields.stock !== undefined) updatePayload.stock = updatedFields.stock ? 50 : 0;
    if (updatedFields.amperage !== undefined) updatePayload.amperage = `${updatedFields.amperage}Ah`;
    if (updatedFields.voltage !== undefined) updatePayload.voltage = `${updatedFields.voltage}V`;
    if (updatedFields.cca !== undefined) updatePayload.cca = Number(updatedFields.cca);
    if (updatedFields.polarity !== undefined) updatePayload.polarity = updatedFields.polarity;
    if (updatedFields.dimensions !== undefined) updatePayload.dimensions = updatedFields.dimensions;
    if (updatedFields.warrantyMonths !== undefined) updatePayload.warranty_months = Number(updatedFields.warrantyMonths);
    if (updatedFields.type !== undefined) updatePayload.type = updatedFields.type;
    if (updatedFields.description !== undefined) updatePayload.description = updatedFields.description;
    if (updatedFields.imageUrl !== undefined) updatePayload.image_url = updatedFields.imageUrl;
    if (categoryId !== undefined) updatePayload.category_id = categoryId;

    const { error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', productId);

    if (error) throw error;

    return {
      id: productId,
      ...updatedFields
    } as BatteryProduct;
  } catch (err: any) {
    console.error('Failed to update battery in database:', err.message || err);
    throw err;
  }
}

/**
 * Deletes an existing battery product from Supabase DB
 */
export async function deleteProductFromSupabase(productId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error('Failed to delete battery from database:', err.message || err);
    throw err;
  }
}

/**
 * Retrieves user profile metadata from public.profiles table
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;
    
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      role: data.role || 'user',
      createdAt: data.created_at
    };
  } catch (err) {
    console.error('Failed to load user profile:', err);
    return null;
  }
}

/**
 * Inserts or updates client profile custom record
 */
export async function createUserProfile(id: string, name: string, email: string, phone: string, role?: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id,
        name,
        email,
        phone,
        role: role || (email === 'admin@leandrobaterias.com' ? 'admin' : 'user'),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to save manual user profile:', err);
    throw err;
  }
}

/**
 * Downloads user saved shopping cart from cart_items table in Supabase
 */
export async function getCartFromSupabase(userId: string): Promise<{ product: BatteryProduct; quantity: number }[]> {
  try {
    const { data: records, error } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('user_id', userId);

    if (error) throw error;
    if (!records) return [];

    const cartItems: { product: BatteryProduct; quantity: number }[] = [];
    for (const record of records) {
      if (record.product) {
        cartItems.push({
          product: {
            id: record.product.id,
            brand: record.product.brand,
            model: record.product.model,
            amperage: parseInt(record.product.amperage) || 60,
            voltage: parseInt(record.product.voltage) || 12,
            cca: record.product.cca || 500,
            polarity: (record.product.polarity || 'Derecha') as any,
            dimensions: record.product.dimensions || 'Estándar',
            warrantyMonths: record.product.warranty_months || 12,
            price: Number(record.product.price) || 100,
            category: 'auto', 
            type: record.product.type || 'Plomo-Ácido',
            description: record.product.description || '',
            popular: false,
            stock: record.product.stock > 0,
            imageUrl: record.product.image_url || ''
          },
          quantity: record.quantity
        });
      }
    }
    return cartItems;
  } catch (err) {
    console.error('Error loading cart from Supabase:', err);
    return [];
  }
}

/**
 * Uploads/synchronizes user local shopping cart to cart_items table in Supabase
 */
export async function saveCartToSupabase(userId: string, cart: { product: BatteryProduct; quantity: number }[]) {
  try {
    await supabase.from('cart_items').delete().eq('user_id', userId);
    if (cart.length === 0) return;

    const payload = cart.map(item => ({
      user_id: userId,
      product_id: item.product.id,
      quantity: item.quantity
    }));

    const { error } = await supabase.from('cart_items').insert(payload);
    if (error) throw error;
  } catch (err) {
    console.error('Error saving cart to Supabase:', err);
  }
}
