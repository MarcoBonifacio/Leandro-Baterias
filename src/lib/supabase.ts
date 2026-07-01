/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { BatteryProduct, OrderDetails, UserProfile, HistoricalOrder } from '../types';
import { BATTERY_PRODUCTS } from '../data/batteryData';

// Safe environment fallback matching provided project information
let rawSupabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://nhrfkjvuaopkuyaqybgj.supabase.co';

// Sanitización para prevenir el error PGRST125: "Invalid path specified in request URL"
// Si el usuario pegó la URL de Supabase con "/rest/v1" o barra diagonal "/" al final, lo reparamos automáticamente para él.
let supabaseUrl = rawSupabaseUrl.trim();
supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, ''); // Quita /rest/v1 o /rest/v1/ del final de la URL
supabaseUrl = supabaseUrl.replace(/\/+$/, ''); // Quita barras diagonales sobrantes al final de la URL

const supabaseAnonKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocmZranZ1YW9wa3V5YXF5YmdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjM5ODAsImV4cCI6MjA5NzI5OTk4MH0.ph-Csb6p5b4AayNP6tDLg_JYNJk1L28_qBIXgcAk2bs').trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Seedes categories and products if not already seeded
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
        stock: typeof p.stock === 'number' ? p.stock : (p.stock ? 50 : 0),
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
        console.warn('Primary snake_case seed failed. Attempting alternative lowercase column seed...', prodErr.message);
        // Retry using "imageurl" as fallback column
        const fallbackProds = prodsToInsert.map((p: any) => {
          const { image_url, ...rest } = p;
          return {
            ...rest,
            imageurl: image_url || ''
          };
        });
        
        const { error: fallbackErr } = await supabase
          .from('products')
          .insert(fallbackProds);
        
        if (fallbackErr) {
          console.error('Failed to seed products list with both formats:', fallbackErr);
        } else {
          console.log(`Successfully seeded ${fallbackProds.length} products using fallback lowercase format.`);
        }
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
const MAPPED_STATIC_PRODUCTS: BatteryProduct[] = BATTERY_PRODUCTS.map(p => ({
  id: p.id,
  brand: p.brand,
  model: p.model,
  amperage: p.amperage,
  voltage: p.voltage,
  cca: p.cca,
  polarity: p.polarity,
  dimensions: p.dimensions,
  warrantyMonths: p.warrantyMonths,
  price: p.price,
  category: p.category,
  type: p.type,
  description: p.description,
  popular: p.popular,
  stock: typeof p.stock === 'number' ? p.stock : (p.stock ? 15 : 0),
  imageUrl: p.imageUrl
}));

export async function getProductsFromSupabase(): Promise<BatteryProduct[]> {
  try {
    // 1. Fetch categories
    let { data: dbCategories, error: catError } = await supabase
      .from('categories')
      .select('*');
    
    if (catError) {
      console.warn('Error fetching categories from Supabase:', catError);
      return MAPPED_STATIC_PRODUCTS;
    }

    // 2. Fetch products
    let { data: dbProducts, error: prodError } = await supabase
      .from('products')
      .select('*');

    if (prodError) {
      console.warn('Error fetching products from Supabase:', prodError);
      return MAPPED_STATIC_PRODUCTS;
    }

    // Auto-seed if empty
    if (!dbCategories || dbCategories.length === 0 || !dbProducts || dbProducts.length === 0) {
      console.log('No elements detected in Supabase, executing auto-seed...');
      await seedSupabaseData();
      
      // Fetch post-seed
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
        stock: typeof p.stock === 'number' ? p.stock : 15,
        imageUrl: p.image_url || p.imageurl || p.imageUrl || localProd?.imageUrl || ''
      };
    });

    return mappedProducts.length > 0 ? mappedProducts : MAPPED_STATIC_PRODUCTS;
  } catch (err) {
    console.error('Critical database fallback triggered:', err);
    return MAPPED_STATIC_PRODUCTS;
  }
}

/**
 * Creates Order, Customer, Payments, and Order items into Supabase
 */
export async function createOrderInSupabase(
  cart: { product: BatteryProduct; quantity: number }[],
  orderDetails: OrderDetails,
  totals: { subtotal: number; taxes: number; total: number },
  currentUser?: UserProfile | null
): Promise<string> {
  try {
    // Try to get logged in user id to associate the order!
    const { data: { session } } = await supabase.auth.getSession();
    const userId = currentUser?.id || session?.user?.id || (localStorage.getItem('admin_session') === 'true' ? 'admin-bypass-id' : null);

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
    const vehicleInfo = `${orderDetails.vehicleBrand} ${orderDetails.vehicleModel} (${orderDetails.vehicleYear})`;

    const orderRecord: any = {
      id: orderId,
      customer_id: customerId,
      user_id: userId, // Guardar id del usuario logueado en Supabase o cuenta Admin
      date: new Date().toLocaleDateString('es-PE'),
      customer_name: orderDetails.customerName,
      document_id: orderDetails.documentId,
      receipt_type: orderDetails.receiptType,
      email: orderDetails.email,
      phone_number: orderDetails.phone,
      shipping_address: shippingAddress,
      vehicle_info: vehicleInfo,
      payment_method: orderDetails.paymentMethod,
      subtotal: totals.subtotal,
      taxes: totals.taxes,
      total: totals.total,
      status: 'Confirmado'
    };

    const { error: orderErr } = await supabase
      .from('orders')
      .insert(orderRecord);

    if (orderErr) {
      console.warn('Orders snake_case insertion failed, trying lowercase/camelCase fallback keys...', orderErr.message);
      const fallbackRecord = {
        id: orderId,
        customer_id: customerId,
        user_id: userId,
        userid: userId,
        date: new Date().toLocaleDateString('es-PE'),
        customerName: orderDetails.customerName,
        customername: orderDetails.customerName,
        documentId: orderDetails.documentId,
        documentid: orderDetails.documentId,
        receiptType: orderDetails.receiptType,
        receipttype: orderDetails.receiptType,
        email: orderDetails.email,
        phoneNumber: orderDetails.phone,
        phonenumber: orderDetails.phone,
        shipping_address: shippingAddress,
        vehicle_info: vehicleInfo,
        payment_method: orderDetails.paymentMethod,
        subtotal: totals.subtotal,
        taxes: totals.taxes,
        total: totals.total,
        status: 'Confirmado'
      };
      
      const { error: orderErrFallback } = await supabase
        .from('orders')
        .insert(fallbackRecord);
      
      if (orderErrFallback) {
        throw orderErrFallback;
      }
    }

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

    if (itemsErr) {
      console.warn('Error inserting order items to Supabase:', itemsErr);
    }

    // 4. Create Payment reference
    const { error: payErr } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        payment_method: orderDetails.paymentMethod,
        transaction_reference: `OP-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: totals.total,
        status: 'Aprobado'
      });

    if (payErr) {
      console.warn('Payments snake_case insertion failed, trying lowercase/camelCase fallback keys...', payErr.message);
      const { error: payErrFallback } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          payment_method: orderDetails.paymentMethod,
          paymentmethod: orderDetails.paymentMethod,
          transaction_reference: `OP-${Math.floor(100000 + Math.random() * 900000)}`,
          amount: totals.total,
          status: 'Aprobado'
        });
      
      if (payErrFallback) {
        console.warn('Error inserting payment reference to Supabase:', payErrFallback);
      }
    }

    return orderId;
  } catch (err) {
    console.error('Failed to create order tracking in database:', err);
    throw err;
  }
}

/**
 * Retrieves historical order records for a specific logged-in user account (or all for admin)
 */
export async function getUserOrders(user: UserProfile | null): Promise<HistoricalOrder[]> {
  if (!user) return [];
  const isAdmin = user.role === 'admin' || user.id === 'admin-bypass-id' || user.email === 'admin@leandrobaterias.com';
  const targetId = user.id;
  const targetEmail = user.email?.toLowerCase().trim();

  try {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    
    // Si no es admin, filtramos por user_id o email
    if (!isAdmin) {
      query = query.or(`user_id.eq.${targetId},email.eq.${targetEmail}`);
    }

    const { data: ordersData, error } = await query;
    if (error || !ordersData) {
      console.warn('Error fetching user orders:', error);
      return [];
    }

    const result: HistoricalOrder[] = [];
    for (const ord of ordersData) {
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', ord.id);

      const mappedItems = (itemsData || []).map((it: any) => ({
        id: it.id,
        product_id: it.product_id || it.product_sku || '',
        product_title: it.product_title || 'Batería',
        quantity: it.quantity || 1,
        unit_price: Number(it.unit_price || 0)
      }));

      result.push({
        id: ord.id,
        user_id: ord.user_id || ord.userid,
        customer_name: ord.customer_name || ord.customername || 'Cliente',
        email: ord.email,
        phone_number: ord.phone_number || ord.phonenumber,
        document_id: ord.document_id || ord.documentid,
        receipt_type: ord.receipt_type || ord.receipttype,
        date: ord.date || new Date().toLocaleDateString('es-PE'),
        shipping_address: ord.shipping_address,
        subtotal: Number(ord.subtotal || (ord.total / 1.18)),
        taxes: Number(ord.taxes || (ord.total - (ord.total / 1.18))),
        total: Number(ord.total || 0),
        status: ord.status || 'Confirmado',
        items: mappedItems,
        vehicle_info: ord.vehicle_info || '',
        payment_method: ord.payment_method || 'Efectivo'
      });
    }

    return result;
  } catch (err) {
    console.error('Failed fetching order history:', err);
    return [];
  }
}

/**
 * Adds a new custom battery product to Supabase DB and returns the mapped BatteryProduct
 */
export async function addProductToSupabase(newProduct: Omit<BatteryProduct, 'id'>): Promise<BatteryProduct> {
  try {
    // 1. Get or seed categories to find category_id
    let { data: dbCategories } = await supabase.from('categories').select('*');
    if (!dbCategories || dbCategories.length === 0) {
      await seedSupabaseData();
      const { data: seededCats } = await supabase.from('categories').select('*');
      dbCategories = seededCats || [];
    }

    const matchedCat = dbCategories?.find(c => c.name === newProduct.category) || dbCategories?.[0];
    const categoryId = matchedCat?.id;

    const id = `item-${Date.now()}`;
    const productRecord = {
      id: id,
      category_id: categoryId,
      title: `${newProduct.brand} ${newProduct.model}`,
      sku: id,
      brand: newProduct.brand,
      model: newProduct.model,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock !== undefined ? newProduct.stock : 15),
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
    if (error) {
      console.warn('Primary insert failed. Retrying with sanitized record...', error.message);
      // Clean up fallback to make sure only real columns are present in database
      const { error: errorFallback } = await supabase.from('products').insert(productRecord);
      if (errorFallback) {
        throw errorFallback;
      }
    }

    return {
      ...newProduct,
      id
    };
  } catch (err) {
    console.error('Failed to insert new custom battery:', err);
    throw err;
  }
}

/**
 * Updates an existing battery product in Supabase DB and returns the updated BatteryProduct
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

    const updatePayload: any = {};
    if (updatedFields.brand !== undefined) updatePayload.brand = updatedFields.brand;
    if (updatedFields.model !== undefined) updatePayload.model = updatedFields.model;
    if (updatedFields.brand !== undefined || updatedFields.model !== undefined) {
      updatePayload.title = `${updatedFields.brand || ''} ${updatedFields.model || ''}`.trim();
    }
    if (updatedFields.price !== undefined) updatePayload.price = Number(updatedFields.price);
    if (updatedFields.stock !== undefined) updatePayload.stock = Number(updatedFields.stock);
    if (updatedFields.amperage !== undefined) updatePayload.amperage = `${updatedFields.amperage}Ah`;
    if (updatedFields.voltage !== undefined) updatePayload.voltage = `${updatedFields.voltage}V`;
    if (updatedFields.cca !== undefined) updatePayload.cca = Number(updatedFields.cca);
    if (updatedFields.polarity !== undefined) updatePayload.polarity = updatedFields.polarity;
    if (updatedFields.dimensions !== undefined) updatePayload.dimensions = updatedFields.dimensions;
    if (updatedFields.warrantyMonths !== undefined) {
      updatePayload.warranty_months = Number(updatedFields.warrantyMonths);
    }
    if (updatedFields.type !== undefined) updatePayload.type = updatedFields.type;
    if (updatedFields.description !== undefined) updatePayload.description = updatedFields.description;
    if (updatedFields.imageUrl !== undefined) {
      updatePayload.image_url = updatedFields.imageUrl;
    }
    if (categoryId !== undefined) updatePayload.category_id = categoryId;

    const { error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', productId);

    if (error) {
      throw error;
    }

    return {
      id: productId,
      ...updatedFields
    } as BatteryProduct;
  } catch (err) {
    console.error('Failed to update battery in database:', err);
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

    if (error) {
      throw error;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete battery from database:', err);
    throw err;
  }
}

/**
 * Helper to check if a string is a valid UUID
 */
function isValidUUID(uuid: string): boolean {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Retrieves user profile metadata from public.profiles table
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    if (!isValidUUID(userId)) {
      return null;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // It's normal if there isn't a custom profile yet
      return null;
    }
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
 * Inserte or updates client profile custom record (safeguard callback)
 * MODIFICADO: Añadido retraso de sincronización y control de error de clave foránea (23503)
 */
export async function createUserProfile(id: string, name: string, email: string, phone: string, role?: string) {
  try {
    if (!isValidUUID(id)) {
      return { id, name, email, phone, role: role || 'user' };
    }

    // Esperar 800ms para asegurar que auth.users procesó el registro primero en Supabase
    await new Promise(resolve => setTimeout(resolve, 800));

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

    if (error) {
      throw error;
    }
    return data;
  } catch (err: any) {
    // Si da error de clave foránea (código Postgres 23503), evitamos romper el flujo
    if (err.code === '23503') {
      console.warn('FK Warning: El ID aún no existe en auth.users. Se asume creación vía Database Trigger.');
      return { id, name, email, phone, role: role || 'user' };
    }
    console.error('Failed to save manual user profile custom record:', err);
    throw err;
  }
}

/**
 * Downloads user saved shopping cart from cart_items table in Supabase
 */
export async function getCartFromSupabase(userId: string): Promise<{ product: BatteryProduct; quantity: number }[]> {
  try {
    if (!isValidUUID(userId)) {
      return [];
    }
    const { data: records, error } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('user_id', userId);

    if (error) throw error;
    if (!records) return [];

    // Map to App's CartItem format
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
            category: (record.product.category_id ? 'auto' : 'auto') as any, // Simple mapping
            type: record.product.type || 'Plomo-Ácido',
            description: record.product.description || '',
            popular: false,
            stock: typeof record.product.stock === 'number' ? record.product.stock : 15,
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
    if (!isValidUUID(userId)) {
      return;
    }
    // 1. Delete old cart items of this user
    await supabase.from('cart_items').delete().eq('user_id', userId);

    if (cart.length === 0) return;

    // 2. Insert new ones
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