import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 w-full h-screen overflow-y-auto bg-gray-50 p-6">
        <div className="flex items-center gap-2 mb-6">
          <SidebarTrigger />
          <span className="text-sm font-medium text-gray-500">
            Buka / Tutup Sidebar
          </span>
        </div>
        {children}
      </main>
    </SidebarProvider>
  );
}
