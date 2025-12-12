import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";   // <--- Using @ is safer
import { processVapiEvent } from "@/inngest/functions"; // <--- Using @ is safer

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        processVapiEvent,
    ],
});