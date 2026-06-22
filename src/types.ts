/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BatteryProduct {
  id: string;
  brand: string;
  model: string;
  amperage: number; // e.g. 75 (Ah)
  voltage: number;  // e.g. 12 (V)
  cca: number;      // Cold Cranking Amps (e.g. 650)
  polarity: 'Derecha' | 'Izquierda';
  dimensions: string; // e.g. "278x175x190 mm"
  warrantyMonths: number;
  price: number; // in Soles (PEN)
  category: 'auto' | 'pesado';
  type: 'Plomo-Ácido' | 'EFB' | 'AGM' | 'Gel';
  description: string;
  popular?: boolean;
  stock: boolean;
  imageUrl?: string;
}

export interface VehicleRecommendation {
  id: string;
  category: 'auto' | 'pesado';
  brand: string;
  model: string;
  engine: string;
  years: string;
  recommendedAmps: number;
  recommendedPolarity: 'Derecha' | 'Izquierda';
  suitableProductIds: string[];
}

export interface DiagnosticQuestion {
  id: number;
  text: string;
  options: {
    text: string;
    score: number; // Lower score = healthier, Higher score = dead battery
    feedback: string;
  }[];
}

export interface CartItem {
  product: BatteryProduct;
  quantity: number;
}

export interface OrderDetails {
  customerName: string;
  email: string;
  phone: string;
  documentId: string;
  receiptType: 'boleta' | 'factura' | 'ticket';
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;
  deliveryMethod: 'envio_colocacion' | 'retiro_local';
  address?: string;
  paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta' | 'yape' | 'plin';
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: string;
  createdAt?: string;
}

