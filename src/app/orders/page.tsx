"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  MapPin,
  CreditCard,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface Product {
  name: string;
  image_url: string | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  price_at_purchase: number;
  products: Product | null;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  shipping_address: string;
  order_items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Ambil data orders beserta relasi order_items dan products
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          id,
          quantity,
          price_at_purchase,
          products (
            name,
            image_url
          )
        )
      `,
      )
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  // Helper Warna & Badge Status Pesanan
  const renderStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="size-3.5" /> Menunggu Diproses
          </span>
        );
      case "processing":
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <Package className="size-3.5" /> Sedang Dikemas
          </span>
        );
      case "shipping":
      case "shipped":
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            <Truck className="size-3.5" /> Dalam Pengiriman
          </span>
        );
      case "completed":
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="size-3.5" /> Pesanan Selesai
          </span>
        );
      case "cancelled":
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="size-3.5" /> Dibatalkan
          </span>
        );
      default:
        return (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 font-medium text-sm">
          Memuat riwayat pesanan...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/")}
            className="rounded-xl border-gray-200 bg-white"
          >
            <ArrowLeft className="size-5 text-gray-700" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="size-6 text-indigo-600" /> Pesanan Saya
            </h1>
            <p className="text-xs text-gray-500">
              Pantau dan kelola riwayat belanjaanmu di sini
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          /* Tampilan Jika Belum Ada Pesanan */
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <Package className="size-12 mx-auto text-gray-300" />
            <div>
              <p className="text-gray-800 font-bold text-base">
                Belum Ada Pesanan
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Kamu belum pernah melakukan transaksi pembelian apapun.
              </p>
            </div>
            <Button
              onClick={() => router.push("/")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6 py-2.5 rounded-xl"
            >
              Belanja Sekarang
            </Button>
          </div>
        ) : (
          /* List Kartu Pesanan */
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden space-y-4 p-5"
              >
                {/* Header Kartu: Tanggal & Badge Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      ID Transaksi: #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      {new Date(order.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {renderStatusBadge(order.status)}
                </div>

                {/* List Barang di Dalam Pesanan Ini */}
                <div className="divide-y divide-gray-50">
                  {order.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="py-2.5 flex items-center gap-3"
                    >
                      <div className="size-14 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                        {item.products?.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.products.image_url}
                            alt={item.products.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Package className="size-6 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-xs md:text-sm truncate">
                          {item.products?.name || "Produk Pakaian"}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {item.quantity} pcs x Rp{" "}
                          {item.price_at_purchase?.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ringkasan Alamat & Total Pembayaran */}
                <div className="bg-gray-50/70 p-3.5 rounded-xl text-xs space-y-2 border border-gray-100">
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="size-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span className="truncate">
                      {order.shipping_address || "Alamat tidak dicantumkan"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CreditCard className="size-3.5 text-gray-400 shrink-0" />
                    <span>{order.payment_method || "Metode Pembayaran"}</span>
                  </div>
                </div>

                {/* Total Akhir */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">
                    Total Tagihan
                  </span>
                  <span className="text-base font-extrabold text-indigo-600">
                    Rp {order.total_amount?.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
