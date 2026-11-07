"use client"
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60 * 5, // 5 minutes cache validity
                gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
                refetchOnWindowFocus: false, 
                refetchOnMount: false,        
                refetchOnReconnect: true,    
                retry: 0,                    
            }
        }
    }));

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}