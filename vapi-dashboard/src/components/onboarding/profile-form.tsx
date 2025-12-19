'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { Loader2, Upload, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfileFormProps {
    user: User;
    initialData?: {
        full_name: string | null;
        company_name: string | null;
        use_case: string | null;
        avatar_url: string | null;
        vapi_api_key?: string | null;
        client_id?: string | null;
        role?: string | null;
    };
    onSave?: () => void;
}

export default function ProfileForm({ user, initialData, onSave }: ProfileFormProps) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState(initialData?.full_name || user.user_metadata?.full_name || '');
    const [companyName, setCompanyName] = useState(initialData?.company_name || '');
    const [useCase, setUseCase] = useState(initialData?.use_case || '');
    const [vapiKey, setVapiKey] = useState(initialData?.vapi_api_key || '');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData?.avatar_url || user.user_metadata?.avatar_url || null);
    const [uploading, setUploading] = useState(false);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Error uploading avatar');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let currentClientId = initialData?.client_id;

            // 1. Create a Client if one doesn't exist
            if (!currentClientId) {
                // Generate a slug from company name
                const slug = companyName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');

                const { data: newClient, error: clientError } = await supabase.from('clients').insert({
                    name: companyName,
                    slug: `${slug}-${Math.random().toString(36).substring(2, 7)}`,
                }).select().single();

                if (clientError) {
                    console.error('Detailed Client Creation Error:', clientError);
                    // Fallback: If 'slug' column is missing, try inserting without it
                    if (clientError.code === '42703' || clientError.message.includes('slug')) {
                        console.warn('Slug column missing or error, retrying without it...');
                        const { data: retryClient, error: retryError } = await supabase.from('clients').insert({
                            name: companyName,
                        }).select().single();

                        if (retryError) {
                            console.error('Retry Client Creation Error:', retryError);
                            throw retryError;
                        }
                        currentClientId = retryClient.id;
                    } else {
                        throw clientError;
                    }
                } else {
                    currentClientId = newClient.id;
                }
            }

            // 2. Save/Update Profile
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: user.id,
                full_name: fullName,
                company_name: companyName,
                use_case: useCase,
                avatar_url: avatarUrl,
                client_id: currentClientId,
                role: 'Owner', // First user is the owner
                updated_at: new Date().toISOString(),
            });

            if (profileError) {
                console.error('Profile Update Error:', profileError);
                throw new Error(`Failed to update profile: ${profileError.message}`);
            }

            // 3. Save NextEra Key
            if (vapiKey) {
                try {
                    const { error: settingsError } = await supabase.from('user_settings').upsert({
                        user_id: user.id,
                        vapi_api_key: vapiKey,
                        updated_at: new Date().toISOString(),
                    });

                    if (settingsError) {
                        console.error('Settings Update Error:', settingsError);
                        // We don't throw here to allow the profile to be saved even if settings fail
                    }
                } catch (err) {
                    console.error('Unexpected settings error:', err);
                }
            }

            if (onSave) {
                onSave();
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch (error: any) {
            console.error('Detailed Error updating profile:', error);
            alert(error.message || 'Error updating profile. Please check the console for details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Complete Your Profile</CardTitle>
                <CardDescription>
                    Tell us a bit about yourself and your company to get started.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                    <div className="flex flex-col items-center space-y-4">
                        <Avatar className="w-24 h-24">
                            <AvatarImage src={avatarUrl || ''} />
                            <AvatarFallback>
                                <UserIcon className="w-12 h-12" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center space-x-2">
                            <Input
                                type="file"
                                id="avatar"
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                disabled={uploading}
                            />
                            <Label
                                htmlFor="avatar"
                                className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                            >
                                {uploading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="mr-2 h-4 w-4" />
                                )}
                                Change Avatar
                            </Label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="full-name">Full Name</Label>
                        <Input
                            id="full-name"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="company-name">Company Name</Label>
                        <Input
                            id="company-name"
                            placeholder="Acme Inc."
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="use-case">Primary Use Case</Label>
                        <select
                            id="use-case"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={useCase}
                            onChange={(e) => setUseCase(e.target.value)}
                            required
                        >
                            <option value="" disabled>Select a use case</option>
                            <option value="Support">Customer Support</option>
                            <option value="Sales">Sales & Outreach</option>
                            <option value="Booking">Appointment Booking</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vapi-key">NextEra Private API Key</Label>
                        <Input
                            id="vapi-key"
                            type="password"
                            placeholder="vapi-xxx-xxx"
                            value={vapiKey}
                            onChange={(e) => setVapiKey(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            You can find your private key in your Vapi dashboard under Settings &rarr; API Keys.
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Configuration
                    </Button>
                </CardFooter>
            </form>
        </Card >
    );
}
