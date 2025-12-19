import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    console.log("----------------------------------------");
    console.log("1. API Route /api/vapi/stats hit");

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error("❌ Unauthorized access attempt");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // CHECK 1: Is the API Key in user_settings?
    const { data: settings } = await supabase
        .from('user_settings')
        .select('vapi_api_key')
        .eq('user_id', user.id)
        .single();

    const apiKey = settings?.vapi_api_key;

    if (!apiKey) {
        console.error("❌ ERROR: No NextEra Key found for user", user.id);
        return NextResponse.json({
            error: "Configuration Required",
            message: "Please add your NextEra Key in Settings or Onboarding."
        }, { status: 400 });
    }

    console.log("2. API Key found for user.");

    try {
        console.log("3. Sending request to Vapi...");
        const response = await fetch('https://api.vapi.ai/call', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        console.log("4. Vapi Response Status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ NextEra returned error:", errorText);
            return NextResponse.json({ error: `Vapi Error: ${errorText}` }, { status: response.status });
        }

        const data = await response.json();
        console.log(`5. Success! Fetched ${data.length} calls.`);
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("❌ CRASH inside route.ts:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}