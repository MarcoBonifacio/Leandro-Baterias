import { jsPDF } from 'jspdf';
import { HistoricalOrder } from '../types';

export function generateOrderPDF(order: HistoricalOrder): void {
  const doc = new jsPDF();
  
  // Color Palette
  const primaryColor = [79, 70, 229]; // Indigo 600
  const textColor = [30, 41, 59];     // Slate 800
  const mutedColor = [100, 116, 139]; // Slate 500
  const lineColor = [226, 232, 240];  // Slate 200

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('LEANDRO BATERÍAS', 20, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Distribuidor Oficial & Centro Técnico - Cusco, Perú', 20, 28);

  // Comprobante Title & Status
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('COMPROBANTE DE COMPRA', 20, 50);

  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`${order.id}`, 20, 57);

  doc.setFontSize(10);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text(`Fecha de Emisión: ${order.date || new Date().toLocaleDateString('es-PE')}`, 140, 50);
  doc.text(`Estado: ${order.status || 'Confirmado'}`, 140, 57);

  // Divider
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.line(20, 64, 190, 64);

  // Customer & Delivery Details
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Datos del Cliente', 20, 75);
  doc.text('Detalles del Envío / Entrega', 110, 75);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);

  // Left Column (Cliente)
  let yCust = 83;
  doc.text(`Nombre: ${order.customer_name}`, 20, yCust);
  if (order.document_id) {
    yCust += 6;
    doc.text(`Doc (${order.receipt_type?.toUpperCase() || 'DNI'}): ${order.document_id}`, 20, yCust);
  }
  if (order.email) {
    yCust += 6;
    doc.text(`Email: ${order.email}`, 20, yCust);
  }
  if (order.phone_number) {
    yCust += 6;
    doc.text(`Teléfono: ${order.phone_number}`, 20, yCust);
  }

  // Right Column (Envío)
  let yShip = 83;
  doc.text(`Modalidad: ${order.shipping_address || 'Entrega coordinada'}`, 110, yShip);
  if (order.vehicle_info) {
    yShip += 6;
    doc.text(`Vehículo: ${order.vehicle_info}`, 110, yShip);
  }
  if (order.payment_method) {
    yShip += 6;
    doc.text(`Pago: ${order.payment_method.toUpperCase()}`, 110, yShip);
  }

  const startTableY = Math.max(yCust, yShip) + 15;

  // Table Header
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(20, startTableY, 170, 10, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('Cant.', 25, startTableY + 7);
  doc.text('Descripción del Producto', 45, startTableY + 7);
  doc.text('P. Unitario', 135, startTableY + 7);
  doc.text('Importe', 165, startTableY + 7);

  // Table Rows
  doc.setFont('helvetica', 'normal');
  let currentY = startTableY + 17;
  
  order.items.forEach((item) => {
    const totalItem = (item.quantity * item.unit_price).toFixed(2);
    doc.text(`${item.quantity}`, 27, currentY);
    
    // Truncate long descriptions
    const title = item.product_title.length > 40 ? item.product_title.substring(0, 38) + '...' : item.product_title;
    doc.text(title, 45, currentY);
    
    doc.text(`S/ ${Number(item.unit_price).toFixed(2)}`, 135, currentY);
    doc.text(`S/ ${totalItem}`, 165, currentY);

    currentY += 8;
    doc.setDrawColor(241, 245, 249);
    doc.line(20, currentY - 3, 190, currentY - 3);
  });

  // Summary Totals
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 135, currentY);
  doc.text(`S/ ${Number(order.subtotal || (order.total / 1.18)).toFixed(2)}`, 165, currentY);

  currentY += 7;
  doc.text('IGV (18%):', 135, currentY);
  doc.text(`S/ ${Number(order.taxes || (order.total - (order.total / 1.18))).toFixed(2)}`, 165, currentY);

  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Total Pagado:', 135, currentY);
  doc.text(`S/ ${Number(order.total).toFixed(2)}`, 165, currentY);

  // Footer Box
  const footerY = 250;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.rect(20, footerY, 170, 25, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('Garantía Oficial Leandro Baterías - Cusco', 25, footerY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('Presente este comprobante y su documento de identidad para validaciones técnicas.', 25, footerY + 16);
  doc.text('Soporte WhatsApp: +51 912 345 678 | Av. de la Cultura 1420, Cusco', 25, footerY + 21);

  // Save PDF
  doc.save(`${order.id}_Comprobante_LeandroBaterias.pdf`);
}
