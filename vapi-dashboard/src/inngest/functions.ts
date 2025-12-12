import { inngest } from "@/inngest/client"; // <--- Update this line
import { createClient } from "@supabase/supabase-js";
// ... rest of the file stays the same

// Initialize Supabase with SERVICE ROLE key to bypass RLS
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const processVapiEvent = inngest.createFunction(
    { id: "process-vapi-event" },
    { event: "vapi/call.event" },
    async ({ event, step }) => {
        // 1. Safe parsing of the incoming payload
        const message = event.data.message || event.data;
        const call = message.call;

        if (!call || !call.id) {
            console.error("❌ No Call ID found in event");
            return { error: "No call ID" };
        }

        console.log(`🔄 Processing call: ${call.id}`);

        // 2. Determine the Agent ID (Check payload, otherwise default to a test string)
        // IMPORTANT: In production, Vapi always sends 'assistantId'.
        const vapiAgentId = call.assistantId || "YOUR_MANUAL_TEST_AGENT_ID";

        // 3. Find the Client in Supabase
        let clientId = null;
        let agentId = null;

        const { data: existingAgent, error: agentError } = await supabase
            .from("agents")
            .select("id, client_id")
            .eq("vapi_agent_id", vapiAgentId)
            .single();

        if (existingAgent) {
            clientId = existingAgent.client_id;
            agentId = existingAgent.id;
        } else {
            console.warn(`⚠️ Agent ${vapiAgentId} not found. Attempting fallback to first Client.`);

            // FALLBACK: Just for testing, grab the first client in the DB
            const { data: fallbackClient } = await supabase
                .from('clients')
                .select('id')
                .limit(1)
                .single();

            if (fallbackClient) {
                clientId = fallbackClient.id;
                // We leave agentId null if we can't find the specific agent
            } else {
                console.error("❌ No Clients exist in DB. Cannot insert call.");
                return { error: "No clients found" };
            }
        }

        // 4. Upsert the Call
        const { error: upsertError } = await supabase
            .from("calls")
            .upsert({
                vapi_call_id: call.id,
                client_id: clientId,
                agent_id: agentId,
                status: call.status || "started",
                cost: call.cost || 0,
                duration: (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000 || 0,
                transcript: call.transcript || "",
                recording_url: call.recordingUrl || "",
                updated_at: new Date().toISOString(),
            }, { onConflict: 'vapi_call_id' });

        if (upsertError) {
            console.error("❌ Supabase Write Failed:", upsertError);
            throw new Error(upsertError.message);
        }

        console.log(`✅ Success! Call ${call.id} saved for Client ${clientId}`);
        return { success: true, callId: call.id };
    }
);