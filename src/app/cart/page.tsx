"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  ShoppingCart,
  ArrowLeft,
  Package,
  Plus,
  Minus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  price: number;
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

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Ambil data keranjang milik user yang sedang login
  const fetchCart = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("cart_items")
      .select("*, products(*)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCartItems(data as CartItem[]);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCart();
  }, [fetchCart]);

  // 2. Ubah Jumlah Kuantitas ( + / - )
  const handleUpdateQuantity = async (
    id: string,
    currentQty: number,
    change: number,
    stock: number,
  ) => {
    const newQty = currentQty + change;
    if (newQty < 1 || newQty > stock) return;

    // Update lokal state langsung agar responsif
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQty } : item,
      ),
    );

    // Update ke Supabase
    await supabase.from("cart_items").update({ quantity: newQty }).eq("id", id);
  };

  // 3. Hapus Item dari Keranjang
  const handleDeleteItem = async (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    await supabase.from("cart_items").delete().eq("id", id);
  };

  // 4. Hitung Subtotal Harga
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.products?.price || 0) * item.quantity,
    0,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 font-medium">Memuat keranjang...</p>
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
            onClick={() => router.push("/")}
            className="rounded-xl border-gray-200 bg-white"
          >
            <ArrowLeft className="size-5 text-gray-700" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="size-6 text-indigo-600" /> Keranjang
              Belanja
            </h1>
            <p className="text-xs text-gray-500">
              {cartItems.length} barang di dalam keranjang kamu
            </p>
          </div>
        </div>

        {cartItems.length === 0 ? (
          /* Keranjang Kosong */
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <ShoppingCart className="size-12 mx-auto text-gray-300" />
            <div>
              <p className="text-gray-800 font-bold text-base">
                Keranjang Belanjaanmu Masih Kosong
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Yuk cari pakaian impianmu di katalog produk!
              </p>
            </div>
            <Button
              onClick={() => router.push("/")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6 py-2.5 rounded-xl"
            >
              Mulai Belanja
            </Button>
          </div>
        ) : (
          /* Daftar Item & Ringkasan Belanja */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* List Barang (2 Kolom) */}
            <div className="md:col-span-2 space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex gap-4 items-center"
                >
                  {/* Foto Produk */}
                  <div className="size-20 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                    {item.products?.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.products.image_url}
                        alt={item.products.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Package className="size-8 text-gray-300" />
                    )}
                  </div>

                  {/* Informasi Produk */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {item.products?.name}
                    </h3>

                    {item.size && (
                      <span className="inline-block text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        Ukuran: {item.size}
                      </span>
                    )}

                    <p className="text-sm font-extrabold text-indigo-600">
                      Rp {item.products?.price?.toLocaleString("id-ID")}
                    </p>

                    {/* Pengatur Kuantitas & Tombol Hapus */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-0.5 bg-gray-50">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateQuantity(
                              item.id,
                              item.quantity,
                              -1,
                              item.products?.stock,
                            )
                          }
                          className="size-6 rounded-md bg-white flex items-center justify-center text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-100"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="text-xs font-bold px-2">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateQuantity(
                              item.id,
                              item.quantity,
                              1,
                              item.products?.stock,
                            )
                          }
                          className="size-6 rounded-md bg-white flex items-center justify-center text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-100"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        title="Hapus Barang"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Ringkasan Belanja (1 Kolom) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
              <h2 className="font-bold text-gray-900 text-sm border-b pb-3">
                Ringkasan Belanja
              </h2>

              <div className="flex justify-between items-center text-xs text-gray-600">
                <span>Total Harga ({cartItems.length} barang)</span>
                <span className="font-semibold text-gray-900">
                  Rp {subtotal.toLocaleString("id-ID")}
                </span>
              </div>

              <hr className="border-gray-100" />

              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-gray-900">
                  Total Pembayaran
                </span>
                <span className="font-extrabold text-indigo-600 text-base">
                  Rp {subtotal.toLocaleString("id-ID")}
                </span>
              </div>

              <Button
                onClick={() => router.push("/checkout")}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-xs text-xs"
              >
                Lanjut ke Checkout
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
