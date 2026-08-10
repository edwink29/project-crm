/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Package, ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  description?: string | null;
  sizes?: string | null;
}

export default function HomePage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [cartCount, setCartCount] = useState<number>(0);

  // Handler saat kartu produk diklik
  const handleOpenDetail = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);

    // Ambil ukuran pertama jika produk memiliki list ukuran
    if (product.sizes) {
      const sizeList = product.sizes.split(",").map((s) => s.trim());
      setSelectedSize(sizeList[0] || "");
    } else {
      setSelectedSize("");
    }

    setIsDetailOpen(true);
  };

  // Handler Tambah ke Keranjang Belanja
  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    if (!selectedProduct) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Simpan ke database Supabase (tabel cart_items)
    const { error } = await supabase.from("cart_items").insert([
      {
        customer_id: user.id,
        product_id: selectedProduct.id,
        quantity: quantity,
        size: selectedSize || null,
      },
    ]);

    if (error) {
      alert(`Gagal menambah ke keranjang: ${error.message}`);
    } else {
      alert("Produk berhasil masuk ke keranjang! 🛒");
      setIsDetailOpen(false);
    }
  };

  const fetchData = useCallback(async () => {
    // 1. Cek User Logged In
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setIsLoggedIn(true);

      // --- TAMBAHAN: CEK APAKAH USER ADALAH ADMIN ---
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserName(profile.full_name || "");

        // JIKA ADMIN MENCOBA AKSES HALAMAN CUSTOMER -> LEMPAR KE DASHBOARD ADMIN
        if (profile.role === "admin") {
          router.replace("/admin/dashboard");
          return;
        }
      }

      // Ambil total item keranjang
      const { count } = await supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", user.id);

      if (count !== null) setCartCount(count);
    }

    // 2. Ambil List Produk
    const { data: productData } = await supabase.from("products").select("*");
    if (productData) setProducts(productData);

    setLoading(false);
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/";
  };

  const handleBuyClick = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    alert("Lanjut ke proses pembelian (checkout belum dibuat).");
  };

  // Filter produk secara otomatis sesuai dengan input pencarian
  const filteredProducts = products.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6 space-y-6 pt-24">
          <div className="h-24 rounded-2xl bg-white border animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl bg-white border animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        isLoggedIn={isLoggedIn}
        cartCount={cartCount}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="max-w-6xl mx-auto p-6 space-y-8 pt-28">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {isLoggedIn
              ? `Selamat Datang, ${userName || "Customer"}! 👋`
              : "Selamat Datang di Toko Online 👋"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Temukan produk impianmu di sini
          </p>
        </div>

        <main>
          <div className="flex items-center gap-2 mb-4">
            <Package className="size-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-800">
              Katalog Produk
            </h2>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-2xl border">
              <ShoppingBag className="size-8 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 font-medium text-sm">
                {searchQuery
                  ? `Produk "${searchQuery}" tidak ditemukan`
                  : "Belum ada produk yang tersedia saat ini"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {searchQuery
                  ? "Coba ketik kata kunci lain"
                  : "Coba cek lagi beberapa saat lagi ya"}
              </p>
            </div>
          ) : (
            /* GRID 6 KOLOM DI LAYAR LEBAR (xl:grid-cols-6) */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {filteredProducts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item)}
                  className="group bg-white rounded-xl border overflow-hidden shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  {/* GAMBAR PRODUK LEBIH RINGKAS */}
                  <div className="aspect-square bg-gray-50 overflow-hidden flex items-center justify-center p-2">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Package className="size-8 text-gray-300" />
                    )}
                  </div>

                  {/* KONTEN DETAIL CARD */}
                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h3
                        className="font-semibold text-gray-900 text-xs md:text-sm truncate"
                        title={item.name}
                      >
                        {item.name}
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Stok: {item.stock}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm md:text-base font-extrabold text-indigo-600">
                        Rp {item.price?.toLocaleString("id-ID")}
                      </p>

                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1.5 h-auto rounded-lg font-medium cursor-pointer">
                        Lihat Detail
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODAL DETAIL PRODUK SIMPEL & BERSIH */}
          <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogContent className="sm:max-w-3xl w-[95vw] p-6 rounded-2xl overflow-hidden bg-white max-h-[90vh] overflow-y-auto">
              {selectedProduct && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* GAMBAR: Menggunakan object-contain agar baju utuh & tidak terpotong */}
                  <div className="bg-gray-50 border rounded-xl p-4 flex items-center justify-center h-70 md:h-87.5">
                    {selectedProduct.image_url ? (
                      <img
                        src={selectedProduct.image_url}
                        alt={selectedProduct.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <Package className="size-16 text-gray-300" />
                    )}
                  </div>

                  {/* DETAIL PRODUK & AKSI */}
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                        {selectedProduct.name}
                      </h2>
                      <p className="text-2xl font-black text-indigo-600 mt-1">
                        Rp {selectedProduct.price?.toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Stok Tersedia:{" "}
                        <span className="font-semibold">
                          {selectedProduct.stock} pcs
                        </span>
                      </p>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Deskripsi */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-700 uppercase mb-1">
                        Deskripsi
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed max-h-28 overflow-y-auto pr-1">
                        {selectedProduct.description || "Tidak ada deskripsi."}
                      </p>
                    </div>

                    {/* Pilihan Ukuran */}
                    {selectedProduct.sizes && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">
                          Pilih Ukuran
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.sizes.split(",").map((sizeStr) => {
                            const cleanSize = sizeStr.trim();
                            const isSelected = selectedSize === cleanSize;
                            return (
                              <button
                                key={cleanSize}
                                type="button"
                                onClick={() => setSelectedSize(cleanSize)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-all ${
                                  isSelected
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                {cleanSize}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Jumlah & Tombol Beli */}
                    <div className="pt-2 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-700 uppercase">
                          Jumlah:
                        </span>
                        <div className="flex items-center border rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity((prev) => Math.max(1, prev - 1))
                            }
                            className="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold"
                          >
                            -
                          </button>
                          <span className="px-4 text-sm font-semibold">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity((prev) =>
                                Math.min(selectedProduct.stock, prev + 1),
                              )
                            }
                            className="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <Button
                        onClick={handleAddToCart}
                        disabled={selectedProduct.stock <= 0}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="size-4" />
                        {selectedProduct.stock > 0
                          ? "Tambah ke Keranjang"
                          : "Stok Habis"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
