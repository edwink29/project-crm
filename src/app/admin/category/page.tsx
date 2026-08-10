"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "./data-tables";
import { getColumns, Category } from "./columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk Dialog Modal
  const [isOpen, setIsOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchCategories();
  }, []);

  // 1. Ambil Data (READ)
  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setCategories(data);
    setLoading(false);
  };

  // 2. Buka Modal untuk Tambah Baru
  const handleOpenAdd = () => {
    setSelectedCategory(null);
    setCategoryName("");
    setIsOpen(true);
  };

  // 3. Buka Modal untuk Edit
  const handleOpenEdit = (category: Category) => {
    setSelectedCategory(category);
    setCategoryName(category.name);
    setIsOpen(true);
  };

  // 4. Simpan Data (CREATE / UPDATE)
  const handleSave = async () => {
    if (!categoryName.trim()) return;

    if (selectedCategory) {
      // Logic UPDATE
      const { error } = await supabase
        .from("categories")
        .update({ name: categoryName })
        .eq("id", selectedCategory.id);

      if (error) alert(`Gagal memperbarui: ${error.message}`);
    } else {
      // Logic CREATE
      const { error } = await supabase
        .from("categories")
        .insert([{ name: categoryName }]);

      if (error) alert(`Gagal menambah: ${error.message}`);
    }

    setIsOpen(false);
    fetchCategories();
  };

  // 5. Hapus Data (DELETE)
  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus kategori ini?")) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      alert(`Gagal menghapus: ${error.message}`);
    } else {
      fetchCategories();
    }
  };

  const columns = getColumns({
    onEdit: handleOpenEdit,
    onDelete: handleDelete,
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kelola Kategori</h1>
          <p className="text-sm text-gray-500">
            Daftar seluruh kategori produk toko kamu
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Tambah Kategori
        </Button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">
          Memuat data tabel...
        </div>
      ) : (
        <DataTable columns={columns} data={categories} />
      )}

      {/* Modal Dialog untuk Add & Edit */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="text"
              placeholder="Masukkan nama kategori (contoh: Baju Pria)"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSave}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
