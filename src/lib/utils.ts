import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | any, currency = '₹'): string {
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return `${currency}${numericAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateDiscount(price: number | string, discountPrice?: number | string | null): number | null {
  const p = typeof price === 'number' ? price : parseFloat(price);
  if (!discountPrice) return null;
  const dp = typeof discountPrice === 'number' ? discountPrice : parseFloat(discountPrice);
  if (p <= 0 || dp >= p) return null;
  return Math.round(((p - dp) / p) * 100);
}

export function generateWhatsAppOrderLink(
  phone: string,
  order: {
    id: string;
    customerName: string;
    shippingAddress: string;
    totalAmount: number | string;
    paymentMethod: string;
    items?: Array<{ title: string; quantity: number; price: number | string }>;
  },
  storeName: string
): string {
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const itemsList = order.items
    ? order.items.map((i) => `• ${i.title} x ${i.quantity} (${formatCurrency(i.price)})`).join('\n')
    : '';

  const text = `🛍️ *NEW ORDER - ${storeName.toUpperCase()}*
━━━━━━━━━━━━━━━━━━
🆔 *Order ID:* #${order.id.slice(0, 8)}
👤 *Customer:* ${order.customerName}
📍 *Address:* ${order.shippingAddress}
💳 *Payment:* ${order.paymentMethod}
━━━━━━━━━━━━━━━━━━
📦 *Ordered Items:*
${itemsList}
━━━━━━━━━━━━━━━━━━
💰 *Total Amount:* ${formatCurrency(order.totalAmount)}

Hi! I just placed this order on your store. Please confirm my order!`;

  return `https://wa.me/${cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(text)}`;
}
