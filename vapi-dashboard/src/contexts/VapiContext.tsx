"use client";

import { createContext, useContext, useEffect, useState } from "react";
// import Vapi from "@vapi-ai/web"; // Uncomment if Vapi SDK is installed

interface VapiContextType {
    isReady: boolean;
    isMissingKey: boolean;
    isLoading: boolean;
    vapi: any | null; // Replace any with Vapi type if available
}

const VapiContext = createContext<VapiContextType>({
    isReady: false,
    isMissingKey: false,
    isLoading: true,
    vapi: null,
});

export const useVapi = () => useContext(VapiContext);

export const VapiProvider = ({ children }: { children: React.ReactNode }) => {
    const [isReady, setIsReady] = useState(false);
    const [isMissingKey, setIsMissingKey] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [vapi, setVapi] = useState<any | null>(null);

    useEffect(() => {
        const initVapi = async () => {
            try {
                // Fetch settings to get the key
                const res = await fetch("/api/vapi/settings");
                if (!res.ok) throw new Error("Failed to fetch settings");

                const data = await res.json();

                if (data.vapiKey) {
                    console.log("Initializing Vapi with user key...");
                    // const vapiInstance = new Vapi(data.vapiKey);
                    // setVapi(vapiInstance);

                    // For now, we just simulate initialization since we don't have the SDK installed
                    // or are just handling the state as requested.
                    setIsReady(true);
                    setIsMissingKey(false);
                } else {
                    console.warn("Vapi API Key missing for user.");
                    setIsMissingKey(true);
                    setIsReady(false);
                }
            } catch (error) {
                console.error("Vapi Init Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initVapi();
    }, []);

    return (
        <VapiContext.Provider value={{ isReady, isMissingKey, isLoading, vapi }}>
            {children}
        </VapiContext.Provider>
    );
};
