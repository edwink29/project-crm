"use client";

import { useRouter } from "next/navigation";
import { Store, LogOut, Search, ShoppingCart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  isLoggedIn?: boolean;
  cartCount?: number;
  onLogout?: () => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

export function Header({
  isLoggedIn = false,
  cartCount = 0,
  onLogout,
  searchQuery = "",
  onSearchChange,
}: HeaderProps) {
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* LOGO E-STORE */}
        <div
          onClick={() => router.push("/")}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="flex aspect-square size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 text-white shadow-xs group-hover:opacity-90 transition-opacity">
            <Store className="size-5" />
          </div>
          <span className="truncate font-bold text-2xl text-gray-900 tracking-tight hidden sm:inline">
            E-Store
          </span>
        </div>

        {/* INPUT SEARCH BAR */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex-1 max-w-md mx-2"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Cari baju, celana, pakaian..."
              className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white text-sm text-gray-900 rounded-lg pl-9 pr-4 py-2 outline-none transition-all placeholder:text-gray-400"
            />
          </div>
        </form>

        {/* IKON AKSI & AUTH */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 1. TOMBOL PESANAN SAYA (Hanya muncul jika sudah login) */}
          {isLoggedIn && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/orders")}
              className="border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-indigo-600 transition-colors cursor-pointer"
              title="Pesanan Saya"
            >
              <Package className="size-5" />
            </Button>
          )}

          {/* 2. TOMBOL KERANJANG BELANJA */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(isLoggedIn ? "/cart" : "/login")}
            className="relative border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-indigo-600 transition-colors cursor-pointer"
            title="Keranjang Belanja"
          >
            <ShoppingCart className="size-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 size-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {cartCount}
              </span>
            )}
          </Button>

          {/* 3. TOMBOL AUTHENTICATION */}
          {isLoggedIn ? (
            <Button
              variant="outline"
              onClick={onLogout}
              className="border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 gap-2 cursor-pointer"
            >
              <LogOut className="size-4" />
              <span className="hidden md:inline">Keluar</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/login")}
                className="border-gray-200 text-gray-700 hover:bg-gray-100 font-medium text-xs md:text-sm"
              >
                Masuk
              </Button>
              <Button
                onClick={() => router.push("/register")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs text-xs md:text-sm"
              >
                Daftar
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
