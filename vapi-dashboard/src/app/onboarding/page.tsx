import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ProfileForm from '@/components/onboarding/profile-form';

export default async function OnboardingPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Check if profile already exists
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profile?.full_name && profile?.company_name && profile?.use_case) {
        redirect('/dashboard');
    }

    return (
        <div className="container max-w-2xl mx-auto flex flex-col items-center justify-center min-h-screen py-10">
            <div className="w-full">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold">Welcome to Vapi Dashboard</h1>
                    <p className="text-muted-foreground mt-2">Let's get to know you better to personalize your experience.</p>
                </div>
                <ProfileForm user={user} />
            </div>
        </div>
    );
}
