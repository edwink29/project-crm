/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  Wallet,
  Users,
  TrendingUp,
  Search,
  Package,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { supabase } from "@/lib/supabase";

interface ProductSell {
  id: string;
  name: string;
  description: string | null;
  stock: number;
  price: number;
  image_url: string | null;
  total_sold: number;
}

interface MonthlyData {
  month: string;
  Omzet: number;
}

export default function AdminDashboardPage() {
  const [userName, setUserName] = useState("Admin");
  const [totalEarning, setTotalEarning] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [newCustomerPercentage, setNewCustomerPercentage] = useState(0);
  const [monthlyChartData, setMonthlyChartData] = useState<MonthlyData[]>([]);
  const [productsSell, setProductsSell] = useState<ProductSell[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);

    // 1. Ambil Nama Admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (profile?.full_name) {
        setUserName(profile.full_name.split(" ")[0]);
      }
    }

    // 2. Hitung Total Pelanggan & Persentase User Baru (30 Hari)
    const { data: allCustomers } = await supabase
      .from("profiles")
      .select("id, created_at")
      .neq("role", "admin");

    if (allCustomers) {
      const totalCount = allCustomers.length;
      setTotalCustomers(totalCount);

      if (totalCount > 0) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newCount = allCustomers.filter(
          (c) => new Date(c.created_at) >= thirtyDaysAgo,
        ).length;

        setNewCustomerPercentage(Math.round((newCount / totalCount) * 100));
      }
    }

    // 3. Data Transaksi & Akumulasi Omzet Bulanan untuk Recharts
    const { data: orderItems } = await supabase
      .from("order_items")
      .select(
        `
        quantity,
        price_at_purchase,
        buy_price_at_purchase,
        created_at,
        orders!inner (status)
      `,
      )
      .neq("orders.status", "cancelled");

    if (orderItems) {
      let earning = 0;
      let capital = 0;
      const monthTotals = new Array(12).fill(0);

      orderItems.forEach((item: any) => {
        const qty = item.quantity || 0;
        const sellPrice = item.price_at_purchase || 0;
        const buyPrice = item.buy_price_at_purchase || 0;

        const itemRevenue = sellPrice * qty;
        const itemCapital = buyPrice * qty;

        earning += itemRevenue;
        capital += itemCapital;

        if (item.created_at) {
          const itemMonth = new Date(item.created_at).getMonth();
          monthTotals[itemMonth] += itemRevenue;
        }
      });

      setTotalEarning(earning);
      setTotalBalance(earning - capital);

      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Agu",
        "Sep",
        "Okt",
        "Nov",
        "Des",
      ];

      // Format Data Sesuai Kebutuhan Recharts
      const chartFormatted = monthTotals.map((amount, index) => ({
        month: monthNames[index],
        Omzet: amount,
      }));

      setMonthlyChartData(chartFormatted);
    }

    // 4. Data Produk Terlaris
    const { data: productsData } = await supabase.from("products").select(`
        id,
        name,
        description,
        stock,
        price,
        image_url,
        order_items (
          quantity
        )
      `);

    if (productsData) {
      const formattedProducts: ProductSell[] = productsData.map((prod: any) => {
        const soldQty =
          prod.order_items?.reduce(
            (sum: number, item: any) => sum + (item.quantity || 0),
            0,
          ) || 0;

        return {
          id: prod.id,
          name: prod.name,
          description: prod.description || "Tidak ada deskripsi singkat",
          stock: prod.stock,
          price: prod.price,
          image_url: prod.image_url,
          total_sold: soldQty,
        };
      });

      formattedProducts.sort((a, b) => b.total_sold - a.total_sold);
      setProductsSell(formattedProducts);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();
  }, [fetchDashboardData]);

  const filteredProducts = productsSell.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Data Warna Donut Chart Recharts
  const pieData = [
    { name: "Pelanggan Baru", value: newCustomerPercentage || 1 },
    { name: "Pelanggan Lama", value: Math.max(0, 100 - newCustomerPercentage) },
  ];
  const PIE_COLORS = ["#4F46E5", "#F3F4F6"];

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-gray-500 font-medium">
          Memuat ringkasan dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-[#F9FAFB] min-h-screen space-y-7 text-gray-800 mx-auto">
      {/* HEADER ATAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
          Halo {userName} <span className="text-2xl">👋</span>,
        </h1>
      </div>

      {/* 3 KARTU STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs">
        <div className="flex items-center gap-4 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
          <div className="size-16 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <DollarSign className="size-8 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Total Omzet</p>
            <h3 className="text-2xl font-black text-gray-900">
              Rp {totalEarning.toLocaleString("id-ID")}
            </h3>
            <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
              <TrendingUp className="size-3" /> Aktif
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
          <div className="size-16 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
            <Wallet className="size-8 text-sky-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">
              Laba Bersih (Profit)
            </p>
            <h3 className="text-2xl font-black text-emerald-600">
              Rp {totalBalance.toLocaleString("id-ID")}
            </h3>
            <p className="text-[11px] text-gray-400 font-normal mt-0.5">
              Setelah dipotong modal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="size-16 rounded-full bg-pink-50 flex items-center justify-center shrink-0">
            <Users className="size-8 text-pink-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Total Pelanggan</p>
            <h3 className="text-2xl font-black text-gray-900">
              {totalCustomers} Akun
            </h3>
            <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
              <TrendingUp className="size-3" /> {newCustomerPercentage}%
              pelanggan baru
            </p>
          </div>
        </div>
      </div>

      {/* SECTION GRAFIK MENGGUNAKAN RECHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRAFIK BATANG RECHARTS */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Ringkasan Penjualan
              </h2>
              <p className="text-xs text-gray-400">
                Grafik omzet bulanan tahun ini
              </p>
            </div>
            <span className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 font-bold text-gray-600">
              Tahun Ini
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(value: unknown) => [
                    `Rp ${Number(value ?? 0).toLocaleString("id-ID")}`,
                    "Omzet",
                  ]}
                  contentStyle={{
                    backgroundColor: "#111827",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#818CF8" }}
                />
                <Bar dataKey="Omzet" fill="#4F46E5" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DONUT CHART RECHARTS */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Pelanggan</h2>
            <p className="text-xs text-gray-400">
              Rasio akun baru dalam 30 hari
            </p>
          </div>

          <div className="h-48 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-gray-900">
                {newCustomerPercentage}%
              </span>
              <span className="text-[10px] text-gray-400 font-bold">
                Pelanggan Baru
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TABEL PRODUK TERLARIS */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Penjualan Produk
            </h2>
            <p className="text-xs text-gray-400">
              Daftar produk dengan penjualan tertinggi
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-50 pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-medium">
                <th className="pb-3 font-normal">Nama Produk</th>
                <th className="pb-3 text-center font-normal">Sisa Stok</th>
                <th className="pb-3 text-center font-normal">Harga Jual</th>
                <th className="pb-3 text-center font-normal">Total Terjual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">
                    Tidak ada data produk ditemukan.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => (
                  <tr key={prod.id} className="group hover:bg-gray-50/50">
                    <td className="py-3.5 flex items-center gap-3">
                      <div className="size-12 rounded-xl bg-gray-100 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {prod.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="size-5 text-gray-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {prod.name}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate max-w-xs">
                          {prod.description}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 text-center font-medium text-gray-600">
                      {prod.stock} pcs
                    </td>

                    <td className="py-3.5 text-center font-bold text-indigo-600">
                      Rp {prod.price?.toLocaleString("id-ID")}
                    </td>

                    <td className="py-3.5 text-center font-bold text-gray-900">
                      {prod.total_sold} pcs
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
