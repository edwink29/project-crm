"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ShieldCheck, UserCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface CustomerProfile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface ColumnsProps {
  onChangeRole: (customer: CustomerProfile) => void;
}

export const getColumns = ({
  onChangeRole,
}: ColumnsProps): ColumnDef<CustomerProfile>[] => [
  {
    accessorKey: "full_name",
    header: "Nama Pelanggan",
    cell: ({ row }) => (
      <div className="font-semibold text-gray-800">
        {row.getValue("full_name") || "Tanpa Nama"}
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Role / Akses",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      const isAdmin = role === "admin";
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isAdmin
              ? "bg-purple-100 text-purple-700 border border-purple-200"
              : "bg-blue-100 text-blue-700 border border-blue-200"
          }`}
        >
          {isAdmin ? (
            <ShieldCheck className="w-3 h-3" />
          ) : (
            <UserCheck className="w-3 h-3" />
          )}
          {role?.toUpperCase() || "CUSTOMER"}
        </span>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Tanggal Bergabung",
    cell: ({ row }) => {
      const value = row.getValue("created_at") as string;
      const date = value
        ? new Date(value).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "-";
      return <span className="text-gray-500 text-sm">{date}</span>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger className="p-2 outline-none hover:bg-gray-100 rounded-md transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                Opsi Manajemen
              </div>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onChangeRole(customer)}
              >
                Ubah Role (Admin / Customer)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
