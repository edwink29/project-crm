"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tag,
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  // Megaphone,
  LogOut,
  Store,
  ChevronsUpDown,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Kategori", url: "/admin/category", icon: Tag },
  { title: "Product", url: "/admin/product", icon: Package },
  { title: "Pesanan", url: "/admin/orders", icon: ShoppingCart },
  { title: "Customer", url: "/admin/customer", icon: Users },
  { title: "Income", url: "/admin/income", icon: TrendingUp },
  // { title: "Promote", url: "/admin/promote", icon: Megaphone },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-none bg-white **:data-[sidebar=sidebar]:bg-white"
    >
      {/* Header - Brand */}
      <SidebarHeader className="px-4 pt-5 pb-2 group-data-[collapsible=icon]:px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent">
              <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 text-white shadow-sm">
                <Store className="size-6" />
              </div>
              <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold text-[20px] text-gray-900">
                  E-Store
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content - Navigasi Menu Utama */}
      <SidebarContent className="px-3 pt-2 group-data-[collapsible=icon]:px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {menuItems.map((item) => {
                const isActive = pathname?.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      onClick={() => router.push(item.url)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-5 text-[14px] font-medium transition-colors",
                        isActive
                          ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200 hover:from-indigo-600 hover:to-purple-600 hover:text-white"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer Sidebar */}
      <SidebarFooter className="px-3 pb-4 group-data-[collapsible=icon]:px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-popup-open:bg-gray-50 hover:bg-gray-50"
                  >
                    <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-700 overflow-hidden">
                      <User className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left leading-tight">
                      <span className="truncate font-semibold text-sm text-gray-900">
                        Admin Toko
                      </span>
                      <span className="truncate text-xs text-gray-400">
                        Project Manager
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 text-gray-400" />
                  </SidebarMenuButton>
                }
              />

              <DropdownMenuContent
                className="min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <div className="flex items-center gap-2 p-2 text-left text-sm">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-gray-200 text-gray-700">
                    <User className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Admin Toko</span>
                    <span className="truncate text-xs text-muted-foreground">
                      admin@toko.com
                    </span>
                  </div>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 size-4" />
                  Keluar (Logout)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
