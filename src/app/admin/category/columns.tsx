"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Category {
  id: string;
  name: string;
  created_at?: string;
}

interface ColumnsProps {
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

export const getColumns = ({
  onEdit,
  onDelete,
}: ColumnsProps): ColumnDef<Category>[] => [
  {
    accessorKey: "name",
    header: "Nama Kategori",
    cell: ({ row }) => (
      <span className="font-medium text-gray-800">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Tanggal Dibuat",
    cell: ({ row }) => {
      const value = row.getValue("created_at") as string | undefined;
      const date = value
        ? new Date(value).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "-";
      return <span className="text-gray-500">{date}</span>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => {
      const category = row.original;

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger className="p-2 outline-none hover:bg-gray-100 rounded-md transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Mengganti DropdownMenuLabel dengan div biasa */}
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                Pilihan Aksi
              </div>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onEdit(category)}
              >
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 cursor-pointer"
                onClick={() => onDelete(category.id)}
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
