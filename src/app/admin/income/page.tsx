"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, X, RefreshCw, PackageCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SalesItem {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  sell_price: number;
  buy_price: number;
  revenue: number;
  capital: number;
  profit: number;
  date: string;
}

export default function AdminIncomePage() {
  const [salesList, setSalesList] = useState<SalesItem[]>([]);
  const [loading, setLoading] = useState(true);

  // State Filter Tanggal
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchIncomeData = useCallback(async () => {
    setLoading(true);

    // HANYA TARIK TRANSAKSI YANG STATUSNYA 'completed'
    let query = supabase
      .from("order_items")
      .select(
        `
        id,
        order_id,
        quantity,
        price_at_purchase,
        buy_price_at_purchase,
        created_at,
        products (
          name
        ),
        orders!inner (
          status
        )
      `,
      )
      .eq("orders.status", "completed");

    if (startDate) {
      query = query.gte("created_at", `${startDate}T00:00:00`);
    }
    if (endDate) {
      query = query.lte("created_at", `${endDate}T23:59:59`);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (!error && data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedList: SalesItem[] = data.map((item: any) => {
        const qty = item.quantity || 0;
        const sellPrice = item.price_at_purchase || 0;
        const buyPrice = item.buy_price_at_purchase || 0;

        const itemRevenue = sellPrice * qty;
        const itemCapital = buyPrice * qty;
        const itemProfit = itemRevenue - itemCapital;

        return {
          id: item.id,
          order_id: item.order_id,
          product_name: item.products?.name || "Produk Pakaian",
          quantity: qty,
          sell_price: sellPrice,
          buy_price: buyPrice,
          revenue: itemRevenue,
          capital: itemCapital,
          profit: itemProfit,
          date: item.created_at,
        };
      });

      setSalesList(formattedList);
    }

    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchIncomeData();
  }, [fetchIncomeData]);

  // Total untuk tfoot
  const totalItemsSold = salesList.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );
  const totalCapital = salesList.reduce((acc, item) => acc + item.capital, 0);
  const totalRevenue = salesList.reduce((acc, item) => acc + item.revenue, 0);
  const totalNetProfit = salesList.reduce((acc, item) => acc + item.profit, 0);

  const handleResetFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto text-gray-800">
      {/* HEADER & FILTER TANGGAL RESPONSIF */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Laporan Pendapatan
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Rincian transaksi selesai dan akumulasi laba bersih toko
          </p>
        </div>

        {/* BOX FILTER TANGGAL (Rapi di Mobile & Desktop) */}
        <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
          {/* Input Tanggal Mulai s/d Sampai */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600 w-full sm:w-auto">
            <Calendar className="size-4 text-indigo-600 shrink-0 hidden sm:block" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:w-auto border border-gray-200 rounded-xl px-2.5 py-1.5 outline-none text-xs bg-gray-50 focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
            />
            <span className="text-gray-400 font-bold px-0.5 text-xs shrink-0">
              s/d
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full sm:w-auto border border-gray-200 rounded-xl px-2.5 py-1.5 outline-none text-xs bg-gray-50 focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
            />
          </div>

          {/* Tombol Aksi (Reset & Refresh) */}
          <div className="flex items-center justify-end gap-1.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-100">
            {(startDate || endDate) && (
              <button
                onClick={handleResetFilter}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-colors"
                title="Hapus Filter Tanggal"
              >
                <X className="size-3.5" />
                <span className="sm:hidden">Reset</span>
              </button>
            )}

            <button
              onClick={fetchIncomeData}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="size-3.5" />
              <span className="sm:hidden">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABEL PENJUALAN */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
        {loading ? (
          <p className="text-xs text-gray-400 text-center py-10">
            Memuat data transaksi...
          </p>
        ) : salesList.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <PackageCheck className="size-10 mx-auto text-gray-300" />
            <p className="text-xs text-gray-500 font-medium">
              Tidak ada pesanan selesai pada periode ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Nama Produk</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4">Modal (pcs)</th>
                  <th className="py-3 px-4">Harga Jual</th>
                  <th className="py-3 px-4 text-right">Laba Bersih</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {salesList.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(item.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {item.product_name}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-700">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      Rp {item.buy_price.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-indigo-600 font-semibold">
                      Rp {item.sell_price.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      +Rp {item.profit.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* FOOTER TOTAL */}
              <tfoot>
                <tr className="bg-indigo-50/60 border-t-2 border-indigo-100 font-bold text-gray-900">
                  <td
                    colSpan={2}
                    className="py-3.5 px-4 text-indigo-900 font-extrabold uppercase text-[11px]"
                  >
                    Total Akumulasi
                  </td>
                  <td className="py-3.5 px-4 text-center text-sm font-black text-indigo-900">
                    {totalItemsSold} pcs
                  </td>
                  <td className="py-3.5 px-4 text-gray-700">
                    Rp {totalCapital.toLocaleString("id-ID")}
                  </td>
                  <td className="py-3.5 px-4 text-indigo-700">
                    Rp {totalRevenue.toLocaleString("id-ID")}
                  </td>
                  <td className="py-3.5 px-4 text-right text-sm font-black text-emerald-600">
                    +Rp {totalNetProfit.toLocaleString("id-ID")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
