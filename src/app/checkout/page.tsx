"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Package,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  price: number;
  buy_price: number;
  stock: number;
  image_url: string | null;
}

interface CartItem {
  id: string;
  customer_id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  products: Product;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Input Checkout
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Transfer Bank (BCA)");

  const fetchCheckoutData = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Ambil data keranjang beserta detail produk (termasuk buy_price)
    const { data, error } = await supabase
      .from("cart_items")
      .select(
        `
        *,
        products (
          id,
          name,
          price,
          buy_price,
          stock,
          image_url
        )
      `,
      )
      .eq("customer_id", user.id);

    if (!error && data && data.length > 0) {
      setCartItems(data as unknown as CartItem[]);
    } else {
      router.push("/cart"); // Kembalikan ke keranjang jika kosong
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCheckoutData();
  }, [fetchCheckoutData]);

  const totalAmount = cartItems.reduce(
    (acc, item) => acc + (item.products?.price || 0) * item.quantity,
    0,
  );

  // PROSES CHECKOUT KETIKA KLIK BAYAR
  const handleProcessOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      alert("Harap isi alamat pengiriman!");
      return;
    }

    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    try {
      // 1. Buat data di tabel orders
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            customer_id: user.id,
            total_amount: totalAmount,
            status: "pending",
            payment_method: paymentMethod,
            payment_status: "unpaid",
            shipping_address: address,
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Buat rincian item di order_items & simpan harga modal + kurangi stok
      for (const item of cartItems) {
        const productSellPrice = item.products?.price || 0;
        const productBuyPrice = item.products?.buy_price || 0;

        // Insert ke order_items
        const { error: itemError } = await supabase.from("order_items").insert([
          {
            order_id: orderData.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price_at_purchase: productSellPrice,
            buy_price_at_purchase: productBuyPrice, // Simpan Modal
          },
        ]);

        if (itemError) throw itemError;

        // Kurangi stok produk
        const currentStock = item.products?.stock || 0;
        const newStock = Math.max(0, currentStock - item.quantity);
        await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("id", item.product_id);
      }

      // 3. Bersihkan keranjang belanja customer
      await supabase.from("cart_items").delete().eq("customer_id", user.id);

      alert("Pesanan berhasil dibuat! 🎉");
      router.push("/orders"); // Pindah ke halaman pesanan customer
    } catch (error: unknown) {
      const err = error as Error;
      alert(`Gagal membuat pesanan: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 font-medium text-sm">
          Memuat halaman checkout...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/cart")}
            className="rounded-xl border-gray-200 bg-white"
          >
            <ArrowLeft className="size-5 text-gray-700" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Checkout Pesanan
          </h1>
        </div>

        <form
          onSubmit={handleProcessOrder}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
        >
          {/* Form Alamat & Metode Pembayaran */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
              <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <MapPin className="size-4 text-indigo-600" /> Alamat Pengiriman
              </h2>
              <textarea
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Tuliskan alamat lengkap pengiriman (Jalan, No. Rumah, Kecamatan, Kota/Kabupaten, Kode Pos)..."
                className="w-full text-xs md:text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 bg-gray-50/50"
              />
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
              <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <CreditCard className="size-4 text-indigo-600" /> Metode
                Pembayaran
              </h2>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs md:text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 bg-gray-50/50 cursor-pointer"
              >
                <option value="Transfer Bank (BCA)">
                  Transfer Bank (BCA - 1234567890)
                </option>
                <option value="Transfer Bank (Mandiri)">
                  Transfer Bank (Mandiri - 0987654321)
                </option>
                <option value="QRIS / E-Wallet">
                  QRIS / Gopay / OVO / ShopeePay
                </option>
                <option value="COD (Bayar di Tempat)">
                  COD (Bayar di Tempat)
                </option>
              </select>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
              <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Package className="size-4 text-indigo-600" /> Barang yang
                Dibeli ({cartItems.length})
              </h2>
              <div className="divide-y divide-gray-100">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <div className="truncate max-w-50 md:max-w-75">
                      <p className="font-semibold text-gray-800 truncate">
                        {item.products?.name}
                      </p>
                      <p className="text-gray-400 text-[10px]">
                        {item.quantity} pcs{" "}
                        {item.size ? `| Ukuran: ${item.size}` : ""}
                      </p>
                    </div>
                    <span className="font-bold text-gray-900">
                      Rp{" "}
                      {(
                        (item.products?.price || 0) * item.quantity
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Ringkasan Total & Tombol Buat Pesanan */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
            <h2 className="font-bold text-gray-900 text-sm border-b pb-3">
              Ringkasan Pembayaran
            </h2>

            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Total Harga Barang</span>
                <span className="font-semibold text-gray-900">
                  Rp {totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Ongkos Kirim</span>
                <span className="font-semibold text-green-600">
                  Gratis (Promo)
                </span>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-gray-900">Total Tagihan</span>
              <span className="font-extrabold text-indigo-600 text-base">
                Rp {totalAmount.toLocaleString("id-ID")}
              </span>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-xs text-xs flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="size-4" />
              {submitting ? "Memproses Pesanan..." : "Buat Pesanan Sekarang"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
