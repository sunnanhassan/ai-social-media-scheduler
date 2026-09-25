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
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30 m-1 rounded-t-lg">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Workspace</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSegmented />
          </div>
        </header>
        <div className="m-1 mt-0 px-4 rounded-b-lg border border-t-0 border-border shadow-xs bg-background flex-1">
          <div className="py-3 px-2">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}