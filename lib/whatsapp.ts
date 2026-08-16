/**
 * WhatsApp Message Generator for BERAKIT SERIES
 * BUMDes Berakit Maju - Teluk Sebong, Bintan
 */

export interface WhatsAppOrderItem {
  name: string;
  quantity: number;
  price: number;
  size?: string;
  customLength?: number;
}

export interface WhatsAppOrderPayload {
  orderId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: WhatsAppOrderItem[];
  paymentMethod: string;
  shippingRate?: number;
  totalAmount?: number;
  adminPhone?: string;
}

const DEFAULT_ADMIN_PHONE = "62895603567192";

/**
 * Get active Admin WhatsApp Phone from localStorage settings, env variable, or default
 */
export function getAdminPhoneNumber(): string {
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem("berakit_settings");
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.phone) {
          return formatPhoneNumber(parsed.phone);
        }
      }
    } catch (e) {
      console.warn("Failed reading phone from settings:", e);
    }
  }
  return formatPhoneNumber(process.env.NEXT_PUBLIC_ADMIN_PHONE || DEFAULT_ADMIN_PHONE);
}

/**
 * Sanitize phone number to standard international format (e.g. 62812...)
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }
  return cleaned || DEFAULT_ADMIN_PHONE;
}

/**
 * Generate formatted WhatsApp message for Buyer -> Admin order confirmation
 */
export function createOrderWhatsAppMessage(payload: WhatsAppOrderPayload): string {
  const {
    orderId = `BRK-${Date.now().toString().slice(-6)}`,
    customerName,
    customerPhone,
    customerAddress,
    items,
    paymentMethod,
    shippingRate = 0,
  } = payload;

  const currentDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const finalTotal = subtotal + shippingRate;

  const itemsList = items
    .map((item, idx) => {
      const sizeTag = item.size ? ` [Size ${item.size}]` : item.customLength ? ` [${item.customLength} cm]` : "";
      return `${idx + 1}. *${item.name}*${sizeTag}\n   • Jumlah: ${item.quantity} pcs x Rp ${(item.price || 0).toLocaleString("id-ID")}\n   • Subtotal: Rp ${((item.price || 0) * (item.quantity || 1)).toLocaleString("id-ID")}`;
    })
    .join("\n\n");

  return `🏛️ *KONFIRMASI PESANAN - BERAKIT SERIES*
_BUMDes Berakit Maju // Sentra Batik Tulis Pesisir Bintan_
━━━━━━━━━━━━━━━━━━━━━
📋 *INFORMASI TRANSAKSI*
• *No. Pesanan* : #${orderId}
• *Tanggal*     : ${currentDate}
• *Status*      : Menunggu Konfirmasi Admin

👤 *DATA PENERIMA*
• *Nama*        : *${customerName}*
• *No. WhatsApp*: ${customerPhone}
• *Alamat Kirim*: ${customerAddress}

🛍️ *PRODUK YANG DIPESAN*
${itemsList}

━━━━━━━━━━━━━━━━━━━━━
💳 *RINGKASAN PEMBAYARAN*
• *Subtotal Produk* : Rp ${subtotal.toLocaleString("id-ID")}
• *Ongkos Kirim*    : ${shippingRate === 0 ? "Gratis Ongkir / COD" : `Rp ${shippingRate.toLocaleString("id-ID")}`}
• *Total Akhir*     : *Rp ${finalTotal.toLocaleString("id-ID")}*
• *Metode Bayar*    : *${paymentMethod}*

Halo Admin BUMDes Berakit, saya baru saja melakukan checkout melalui website resmi Berakit Series. Mohon pesanan saya segera dicek & diproses ya. Terima kasih! 🙏`;
}

/**
 * Generate direct WhatsApp URL for Order Confirmation
 */
export function getWhatsAppOrderUrl(payload: WhatsAppOrderPayload): string {
  const phone = payload.adminPhone ? formatPhoneNumber(payload.adminPhone) : getAdminPhoneNumber();
  const message = createOrderWhatsAppMessage(payload);
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}

/**
 * Generate WhatsApp message for Admin -> Buyer dispatch confirmation (resi update)
 */
export function createAdminDispatchWhatsAppMessage({
  buyerName,
  orderId,
  trackingNumber,
  courierName = "J&T Express",
  totalAmount,
}: {
  buyerName: string;
  orderId: string;
  trackingNumber: string;
  courierName?: string;
  totalAmount?: number;
}): string {
  return `Halo Kak *${buyerName}*,

Salam hangat dari *BUMDes Berakit Maju (Berakit Series)*! 🌴✨

Kami ingin menginformasikan bahwa pesanan Anda dengan rincian berikut telah resmi kami serahkan ke pihak ekspedisi untuk dikirimkan:

━━━━━━━━━━━━━━━━━━━━━
📦 *INFORMASI PENGIRIMAN*
• *No. Pesanan* : #${orderId}
• *Ekspedisi*   : *${courierName}*
• *Nomor Resi*  : *${trackingNumber}*
${totalAmount ? `• *Total Nilai* : Rp ${totalAmount.toLocaleString("id-ID")}\n` : ""}━━━━━━━━━━━━━━━━━━━━━

Anda dapat melacak perjalanan paket Anda secara berkala melalui website resmi kurir terkait.

Terima kasih atas kepercayaannya mendukung karya perajin lokal Desa Berakit, Bintan. Jika paket sudah tiba, mohon kesediaannya untuk mengonfirmasi penerimaan ya! 🙏😊`;
}

/**
 * Generate WhatsApp message for General Inquiries / Custom Orders
 */
export function createInquiryWhatsAppMessage({
  productName,
  category,
}: {
  productName?: string;
  category?: string;
} = {}): string {
  if (productName) {
    return `Halo Admin BUMDes Berakit, saya tertarik dengan produk *${productName}*${category ? ` (Kategori: ${category})` : ""} di website Berakit Series. Bisakah saya berkonsultasi mengenai ketersediaan motif/ukuran dan estimasi pengirimannya? Terima kasih!`;
  }
  return `Halo Admin BUMDes Berakit, saya ingin berkonsultasi mengenai pemesanan kain batik tulis motif pesisir khas Desa Berakit. Terima kasih!`;
}
