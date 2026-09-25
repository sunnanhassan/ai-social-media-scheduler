import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeSegmented } from "@/components/dark-mode-toggle";
import AppSidebar from "./_common/app-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-sidebar! border-none min-h-screen flex flex-col">
        <header className="h-12 border-b border-border bg-background/80 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">Workspace</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSegmented />
          </div>
        </header>
        <main className="px-5 py-3 bg-background flex-1 flex flex-col min-h-0 overflow-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}