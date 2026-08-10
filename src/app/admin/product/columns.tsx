"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 1. Tipe data sesuai dengan tabel database `products`
export interface Product {
  id: string;
  name: string;
  price: number;
  buy_price?: number;
  stock: number;
  category_id?: string;
  description?: string;
  sizes?: string;
  image_url?: string;
  categories?: { name: string };
}

interface ColumnsProps {
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export const getColumns = ({
  onEdit,
  onDelete,
}: ColumnsProps): ColumnDef<Product>[] => [
  {
    accessorKey: "name",
    header: "Nama Produk",
    cell: ({ row }) => (
      <span className="font-semibold text-gray-800">
        {row.getValue("name")}
      </span>
    ),
  },
  {
    id: "categories_name", // <-- ID ini yang dipanggil oleh table.getColumn("categories_name")
    accessorFn: (row) => row.categories?.name,
    header: "Kategori",
    cell: ({ row }) => (
      <span className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
        {row.original.categories?.name || "Tanpa Kategori"}
      </span>
    ),
  },
  {
    accessorKey: "buy_price",
    header: "Harga Beli",
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("buy_price"));
      const formatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(price);
      return <span className="font-medium">{formatted}</span>;
    },
  },
  {
    accessorKey: "price",
    header: "Harga",
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      const formatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(price);
      return <span className="font-medium">{formatted}</span>;
    },
  },
  {
    accessorKey: "stock",
    header: "Stok",
    cell: ({ row }) => <span>{row.getValue("stock")} pcs</span>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger className="p-2 outline-none hover:bg-gray-100 rounded-md">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                Pilihan Aksi
              </div>
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => onDelete(product.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
