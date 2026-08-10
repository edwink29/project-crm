"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "./data-tables";
import { getColumns, Product } from "./columns";
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

interface CategoryOption {
  id: string;
  name: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  // State Form Input Modal
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [sizes, setSizes] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: prodData } = await supabase
      .from("products")
      .select("*, categories(name)")
      .order("created_at", { ascending: false });

    const { data: catData } = await supabase
      .from("categories")
      .select("id, name");

    if (prodData) setProducts(prodData);
    if (catData) setCategories(catData);
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setSelectedProduct(null);
    setName("");
    setPrice("");
    setBuyPrice("");
    setStock("");
    setCategoryId("");
    setDescription("");
    setSizes("");
    setImageUrl("");
    setIsOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setName(product.name || "");
    setPrice(
      product.price !== undefined && product.price !== null
        ? product.price.toString()
        : "",
    );
    setBuyPrice(
      product.buy_price !== undefined && product.buy_price !== null
        ? product.buy_price.toString()
        : "",
    );
    setStock(
      product.stock !== undefined && product.stock !== null
        ? product.stock.toString()
        : "",
    );
    setCategoryId(product.category_id || "");
    setDescription(product.description || "");
    setSizes(product.sizes || "");
    setImageUrl(product.image_url || "");
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !price || !stock) {
      alert("Mohon isi semua field yang wajib!");
      return;
    }

    // Pastikan buy_price dikirim sebagai angka 0 jika tidak diisi
    const payload = {
      name,
      price: parseFloat(price),
      buy_price: buyPrice ? parseFloat(buyPrice) : 0,
      stock: parseInt(stock),
      category_id: categoryId || null,
      description: description || null,
      sizes: sizes || null,
      image_url: imageUrl || null,
    };

    if (selectedProduct) {
      // UPDATE
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", selectedProduct.id);
      if (error) alert(error.message);
    } else {
      // CREATE
      const { error } = await supabase.from("products").insert([payload]);
      if (error) alert(error.message);
    }

    setIsOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchData();
  };

  const columns = getColumns({
    onEdit: handleOpenEdit,
    onDelete: handleDelete,
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kelola Produk</h1>
          <p className="text-sm text-gray-500">
            Daftar produk yang dijual di toko kamu
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" /> Tambah Produk
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-8">Memuat data produk...</p>
      ) : (
        <DataTable columns={columns} data={products} categories={categories} />
      )}

      {/* Modal Dialog Form */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? "Edit Produk" : "Tambah Produk Baru"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Input
              placeholder="Nama Produk (contoh: Kaos Oversize Cotton)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            {/* Input URL Foto Produk */}
            <Input
              placeholder="URL Gambar Produk (https://...)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Harga Modal / Beli (Rp)"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Harga Jual (Rp)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Input
                type="number"
                placeholder="Total Stok"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>

            {/* Input Ukuran Baju */}
            <Input
              placeholder="Pilihan Ukuran (Contoh: S, M, L, XL, XXL)"
              value={sizes}
              onChange={(e) => setSizes(e.target.value)}
            />

            <select
              className="w-full border rounded-md p-2 text-sm bg-white"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Input Deskripsi Pakaian */}
            <textarea
              className="w-full border rounded-md p-2 text-sm bg-white min-h-20"
              placeholder="Deskripsi Bahan, Panduan Ukuran, Perawatan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
