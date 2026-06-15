'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  FileText,
  Globe,
  Phone,
  X,
  Edit,
} from 'lucide-react';
import { updatedUser, userStartups } from '@/lib/call-api/call-api';
import { Founder, Startup } from '@/types';
import Loading from '@/app/loading';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';
import { startupDetailHref } from '@/lib/startup-detail-href';
import * as Dialog from '@radix-ui/react-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-700';
    case 'rejected':
      return 'bg-red-100 text-red-700';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
      return <CheckCircle className="h-3 w-3" />;
    case 'rejected':
      return <XCircle className="h-3 w-3" />;
    case 'pending':
      return <Clock className="h-3 w-3" />;
    default:
      return null;
  }
};

export default function StartupProfile() {
  const [activeTab, setActiveTab] = useState('all');
  const [startups, setStartups] = useState<Startup[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<Founder>({
    _id: '',
    name: '',
    email: '',
    role: 'startup',
    bio: '',
    image: '',
    phone_number: '',
    nationality: '',
  });

  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    phone: user.phone_number,
    bio: user.bio,
  });

  const handleFetch = () => {
    try {
      const getUserfetchStartups = async () => {
        // get user info
        const session = await authClient.getSession();

        const user = session.data?.user;

        setUser({
          _id: user?.id ?? '',
          name: user?.name ?? '',
          email: user?.email ?? '',
          role: (user?.role as 'user' | 'admin' | 'startup') ?? 'startup',
          bio: user?.bio ?? '',
          image: user?.image ?? '',
          phone_number: user?.phone_number ?? '',
          nationality: user?.nationality ?? '',
        });

        // fetch startup
        const data = await userStartups();
        console.log(data, "from founder's page");
        setStartups(data);
      };
      getUserfetchStartups();
    } catch (err) {
      console.error('Failed to load user startups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetch();
  }, []);

  useEffect(() => {
    if (user.phone_number || user.bio) {
      setFormData({
        phone: user.phone_number,
        bio: user.bio,
      });
    }
  }, [user]);

  const filteredStartups = startups?.filter((startup) => {
    if (activeTab === 'all') return true;
    return startup.status === activeTab;
  });

  const counts = {
    all: startups?.length,
    approved: startups?.filter((s) => s.status === 'approved').length,
    pending: startups?.filter((s) => s.status === 'pending').length,
    rejected: startups?.filter((s) => s.status === 'rejected').length,
  };

  // loading
  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Compact Header */}
          <Card className="p-6 shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* User Info */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="text-lg font-semibold">
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-800">
                    {user.name}
                  </h1>
                  <div className="mt-1 text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{user.phone_number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{user.bio || 'No bio provided'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div>
                <div className="text-3xl font-bold text-primary text-center">
                  {startups?.length}
                </div>
                <p className="text-sm text-gray-500">Total Startups</p>
              </div>

              {/* Edit Button */}
              <Button
                className="focus:border-none border-none"
                variant="outline"
                size="sm"
                onClick={() => setOpen(true)}
              >
                <Edit />
              </Button>
            </div>
          </Card>

          {/* Tabs */}
          <Card className="p-3 border border-gray-200 shadow-sm">
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All Startups', count: counts.all },
                { key: 'approved', label: 'Approved', count: counts.approved },
                { key: 'pending', label: 'Pending', count: counts.pending },
                { key: 'rejected', label: 'Rejected', count: counts.rejected },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(tab.key)}
                  className="flex-1 text-xs sm:text-sm"
                >
                  {tab.label} ({tab.count})
                </Button>
              ))}
            </div>
          </Card>

          {/* Startup List */}
          <div className="space-y-4">
            {Array.isArray(filteredStartups) && filteredStartups.length > 0 ? (
              filteredStartups.map((startup) => {
                const profileHref = startupDetailHref(startup);
                return (
                <Card
                  key={startup._id || startup.name}
                  className="p-5 hover:shadow-md transition-shadow border border-gray-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-500" />
                          <h3 className="font-semibold text-gray-800 text-base">
                            {startup.name}
                          </h3>
                        </div>
                        <Badge
                          className={`text-xs ${getStatusColor(
                            startup.status
                          )}`}
                        >
                          {getStatusIcon(startup.status)}
                          <span className="ml-1 capitalize">
                            {startup.status}
                          </span>
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2">
                        {startup.description}
                      </p>

                      <div className="flex items-center text-xs text-gray-500 gap-2">
                        <Separator orientation="vertical" className="h-3" />
                        <span>Founded in {startup.foundedYear}</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {profileHref ? (
                        <Link href={profileHref}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs bg-white"
                          >
                            View Details
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs bg-white"
                          disabled
                          title="Missing startup id in listing data"
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
                );
              })
            ) : (
              <Card className="p-10 border border-gray-200 text-center text-gray-500">
                <Building2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No startups found for this category</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* modal */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed z-50 top-1/2 left-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 shadow-lg space-y-6">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Edit Profile
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-gray-500 hover:text-gray-700">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <Textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={async () => {
                  try {
                    const update = await updatedUser({
                    phone: (formData.phone ?? "") as string,
                    bio: (formData.bio ?? "") as string,
                    email: user.email,
                  });


                    // Update local state
                    setUser((prev) => ({
                      ...prev,
                      phone: update.phone_number,
                      bio: update.bio,
                    }));

                    handleFetch();

                    setOpen(false);
                  } catch (err) {
                    console.error('Failed to update user:', err);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white rounded"
              >
                Save Changes
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
