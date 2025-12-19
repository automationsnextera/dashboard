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
}

export default function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState(user.user_metadata?.full_name || '');
    const [companyName, setCompanyName] = useState('');
    const [useCase, setUseCase] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(user.user_metadata?.avatar_url || null);
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
            const { error } = await supabase.from('profiles').upsert({
                id: user.id,
                full_name: fullName,
                company_name: companyName,
                use_case: useCase,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            });

            if (error) throw error;

            router.push('/dashboard');
            router.refresh();
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error updating profile');
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
                        {/* Note: If Select component is not available or has issues, we can fallback to native select, 
                but based on file list, `select.tsx` was NOT in the list, so I will check if I can use standard select or simpler dropdown. 
                Wait, I listed dir `components/ui` and `dropdown-menu.tsx` was there, but `select.tsx` was NOT.
                I will use standard HTML select to avoid compilation errors if Select component is missing.
                Actually, `dropdown-menu` is for actions. 
                I will use strict HTML <select> for safety or just a text input for now, 
                OR I should check if I missed `select.tsx`.
                Let me quickly double check the list_dir output from Step 32.
                Files: avatar, badge, button, card, dropdown-menu, input, label, separator, sheet, skeleton, switch, table.
                NO select.tsx.
                So I will use a standard HTML select with Shadcn-like styling.
            */}
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
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Profile
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
