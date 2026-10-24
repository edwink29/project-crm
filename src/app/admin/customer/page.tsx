"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "./data-tables";
import { getColumns, CustomerProfile } from "./columns";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // State Modal Ubah Role
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerProfile | null>(null);
  const [newRole, setNewRole] = useState("customer");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchCustomers();
  }, []);

  // 1. Ambil seluruh data dari tabel profiles
  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCustomers(data);
    }
    setLoading(false);
  };

  // 2. Buka Modal Ubah Role
  const handleOpenChangeRole = (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    setNewRole(customer.role || "customer");
    setIsOpen(true);
  };

  // 3. Simpan Perubahan Role ke Supabase
  const handleSaveRole = async () => {
    if (!selectedCustomer) return;

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", selectedCustomer.id);

    if (error) {
      alert(`Gagal mengubah role: ${error.message}`);
    } else {
      setIsOpen(false);
      fetchCustomers();
    }
  };

  const columns = getColumns({
    onChangeRole: handleOpenChangeRole,
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Kelola Pelanggan
          </h1>
          <p className="text-sm text-gray-500">
            Daftar pelanggan toko
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-8">
          Memuat data pelanggan...
        </p>
      ) : (
        <DataTable columns={columns} data={customers} />
      )}

      {/* Modal Dialog Ubah Role */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Role Pengguna</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-gray-600">
              Ubah akses untuk pelanggan:{" "}
              <strong className="text-gray-800">
                {selectedCustomer?.full_name}
              </strong>
            </p>
            <select
              className="w-full border rounded-md p-2 text-sm bg-white"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              <option value="customer">Customer (Pelanggan Biasa)</option>
              <option value="admin">Admin (Akses Penuh Panel)</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSaveRole}
            >
              Simpan Akses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
