import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ProfileForm from '@/components/onboarding/profile-form';

export default async function ProfilePage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
                <p className="text-muted-foreground">Manage your personal information and preferences.</p>
            </div>
            <div className="max-w-2xl">
                <ProfileForm
                    user={user}
                    initialData={profile}
                />
            </div>
        </div>
    );
}
