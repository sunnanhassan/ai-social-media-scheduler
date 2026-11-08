"use client"
import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Suppress benign browser AbortErrors caused by page navigation & background auth polling
        const handleRejection = (event: PromiseRejectionEvent) => {
            const reason = event?.reason;
            if (
                reason?.name === "AbortError" ||
                (typeof reason?.message === "string" && (
                    reason.message.includes("aborted") ||
                    reason.message.includes("signal is aborted")
                ))
            ) {
                event.preventDefault();
            }
        };

        window.addEventListener("unhandledrejection", handleRejection);
        return () => window.removeEventListener("unhandledrejection", handleRejection);
    }, []);

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