"use client";

import { useEffect, useState, useCallback } from "react";
import { Package, MapPin, CreditCard, User, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

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

interface Profile {
  full_name: string | null;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  shipping_address: string;
  customer_id: string;
  profiles: Profile | null;
  order_items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAllOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        profiles (full_name),
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
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAllOrders();
  }, [fetchAllOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      alert(`Gagal mengubah status: ${error.message}`);
    } else {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order,
        ),
      );
    }
    setUpdatingId(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Memuat semua pesanan masuk...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Pesanan</h1>
          <p className="text-xs text-gray-500 mt-1">
            Daftar seluruh transaksi customer yang perlu diproses
          </p>
        </div>
        <button
          onClick={fetchAllOrders}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700"
        >
          <RefreshCw className="size-3.5" /> Refresh Data
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100">
          <Package className="size-10 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 font-medium text-sm">
            Belum ada pesanan yang masuk.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            // Cek apakah transaksi sudah final (Selesai/Batal)
            const isFinalStatus =
              order.status === "completed" || order.status === "cancelled";

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden p-5 space-y-4"
              >
                {/* Header Card & Dropdown Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                        #{order.id.slice(0, 8)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 mt-1 flex items-center gap-1.5">
                      <User className="size-3.5 text-gray-400" />
                      {order.profiles?.full_name || "Customer Unregistered"}
                    </p>
                  </div>

                  {/* Status Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500">
                      Status:
                    </span>
                    <select
                      value={order.status}
                      disabled={updatingId === order.id || isFinalStatus}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value)
                      }
                      className="text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="pending">🟡 Menunggu Diproses</option>
                      <option value="processing">🔵 Sedang Dikemas</option>
                      <option value="shipping">🟣 Dalam Pengiriman</option>
                      <option value="completed">🟢 Pesanan Selesai</option>
                      <option value="cancelled">🔴 Dibatalkan</option>
                    </select>
                  </div>
                </div>

                {/* List Barang */}
                <div className="divide-y divide-gray-50">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="py-2 flex items-center gap-3">
                      <div className="size-12 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                        {item.products?.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.products.image_url}
                            alt={item.products.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Package className="size-5 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-xs truncate">
                          {item.products?.name || "Produk Pakaian"}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {item.quantity} pcs x Rp{" "}
                          {item.price_at_purchase?.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Alamat & Metode Bayar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50/70 p-3 rounded-xl text-xs border border-gray-100">
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="size-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-700 block">
                        Alamat Kirim:
                      </span>
                      <span>
                        {order.shipping_address || "Tidak dicantumkan"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-gray-600">
                    <CreditCard className="size-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-700 block">
                        Pembayaran:
                      </span>
                      <span>{order.payment_method}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-gray-500 font-medium">
                    Total Nilai Transaksi
                  </span>
                  <span className="text-base font-extrabold text-indigo-600">
                    Rp {order.total_amount?.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
