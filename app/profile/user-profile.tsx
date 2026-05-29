'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { authClient } from '@/lib/auth-client';
import { 
  User, Mail, Phone, MapPin, Calendar, Edit2, LogOut, 
  TrendingUp, Building2, Briefcase, Globe, ArrowRight 
} from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
  name: string;
  email: string;
  phone: string;
  bio: string;
  role: string;
  location: string;
  joinedDate: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    role: 'user',
    location: '',
    joinedDate: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    location: '',
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const session = await authClient.getSession();
      if (session.data?.user) {
        const u = session.data.user;
        const userData = {
          name: u.name || '',
          email: u.email || '',
          phone: u.phone_number || '',
          bio: u.bio || '',
          role: u.role || 'user',
          location: (u as any).location || 'Addis Ababa, Ethiopia',
          joinedDate: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
        };
        setUser(userData);
        setFormData({
          name: userData.name,
          phone: userData.phone,
          bio: userData.bio,
          location: userData.location,
        });
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // TODO: Implement API call to update user
      setUser(prev => ({ ...prev, ...formData }));
      toast.success('Profile updated');
      setIsEditing(false);
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      investor: 'bg-forest/10 text-forest border-forest/20',
      admin: 'bg-red-100 text-red-700 border-red-200',
      startup: 'bg-blue-100 text-blue-700 border-blue-200',
      user: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return styles[role] || styles.user;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <main className="flex items-center justify-center h-[60vh]">
          <div className="animate-pulse text-ink-muted">Loading profile...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="w-24 h-24 border-4 border-paper shadow-lg">
              <AvatarFallback className="bg-forest text-paper text-2xl font-bold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-ink">{user.name || 'User'}</h1>
                <Badge className={`${getRoleBadge(user.role)} capitalize w-fit mx-auto sm:mx-0`}>
                  {user.role}
                </Badge>
              </div>
              <p className="text-ink-muted flex items-center justify-center sm:justify-start gap-2 mb-1">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
              <p className="text-ink-muted flex items-center justify-center sm:justify-start gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                Member since {new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
              <Button variant="ghost" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Investor Quick Links */}
        {user.role === 'investor' && (
          <Card className="mb-6 bg-forest/5 border-forest/20">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-forest flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-paper" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink">Investor Dashboard</p>
                    <p className="text-sm text-ink-muted">View deal flow and analytics</p>
                  </div>
                </div>
                <Button asChild className="bg-forest hover:bg-forest-soft gap-2">
                  <a href="/investor/analytics">
                    View Analytics
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Info */}
        <div className="grid gap-6">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-forest" />
                About
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              ) : (
                <p className="text-ink-muted">
                  {user.bio || 'No bio yet. Click Edit to add one.'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-forest" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-ink-faint" />
                    Email
                  </Label>
                  <Input value={user.email} disabled className="bg-paper-deep" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-ink-faint" />
                    Phone
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+251..."
                    />
                  ) : (
                    <p className="text-ink py-2">{user.phone || 'Not provided'}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-ink-faint" />
                  Location
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, Country"
                  />
                ) : (
                  <p className="text-ink flex items-center gap-2">
                    <Globe className="w-4 h-4 text-forest" />
                    {user.location}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          {isEditing && (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-forest hover:bg-forest-soft">
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
