'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookmarkCheck, BookmarkX, ArrowLeft, Star, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface WatchlistItem {
  _id: string;
  startupId: string;
  notes?: string;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  createdAt: string;
  startup: {
    name: string;
    sector?: string;
    stage?: string;
    location?: string;
    description?: string;
    logo?: string;
  };
}

export default function WatchlistPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      const user = data?.user;
      setSession(user);

      if (!user || (user.role !== 'investor' && user.role !== 'admin')) {
        router.push('/login?callbackUrl=/investor/watchlist');
        return;
      }

      loadWatchlist();
    });
  }, [router]);

  const loadWatchlist = async () => {
    try {
      const res = await fetch('/api/investor/watchlist');
      const data = await res.json();
      if (data.watchlist) {
        setWatchlist(data.watchlist);
      }
    } catch {
      toast.error('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (startupId: string) => {
    try {
      const res = await fetch(`/api/investor/watchlist?startupId=${startupId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setWatchlist(prev => prev.filter(w => w.startupId !== startupId));
        toast.success('Removed from watchlist');
      }
    } catch {
      toast.error('Failed to remove');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <main className="flex items-center justify-center h-[60vh]">
          <div className="animate-pulse text-ink-muted">Loading watchlist...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/investor/analytics')}
            className="mb-4 -ml-2 text-ink-muted hover:text-forest"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analytics
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-forest/10 flex items-center justify-center">
              <BookmarkCheck className="w-5 h-5 text-forest" />
            </div>
            <h1 className="text-2xl font-bold text-ink">Your Watchlist</h1>
          </div>
          <p className="text-ink-muted">
            {watchlist.length} startup{watchlist.length !== 1 ? 's' : ''} saved for follow-up
          </p>
        </div>

        {watchlist.length === 0 ? (
          <div className="text-center py-16 bg-paper-deep rounded-xl border border-rule">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-ink-faint" />
            <h3 className="text-lg font-medium text-ink mb-2">No startups saved yet</h3>
            <p className="text-ink-muted mb-6 max-w-md mx-auto">
              Browse the discovery feed on your investor dashboard to find interesting opportunities
            </p>
            <Button
              asChild
              className="bg-forest hover:bg-forest-soft"
            >
              <a href="/investor/analytics">Explore Startups</a>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {watchlist.map((item) => (
              <div
                key={item._id}
                className="p-5 rounded-xl border border-rule bg-paper hover:border-forest/30 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-forest/10 flex items-center justify-center text-forest font-bold text-sm">
                      {item.startup.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink">{item.startup.name}</h3>
                      <p className="text-xs text-ink-muted">{item.startup.sector || 'Technology'}</p>
                    </div>
                  </div>
                  <Badge className={getPriorityColor(item.priority)}>
                    {item.priority}
                  </Badge>
                </div>

                <p className="text-sm text-ink-muted mb-4 line-clamp-2">
                  {item.startup.description || 'No description available'}
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 rounded bg-paper-deep border border-rule text-xs">
                    {item.startup.stage || 'Early Stage'}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {item.startup.location?.split(',')[0]}
                  </span>
                </div>

                {item.notes && (
                  <div className="mb-4 p-3 rounded-lg bg-forest/5 border border-forest/10">
                    <p className="text-xs text-ink-muted flex items-center gap-1 mb-1">
                      <Star className="w-3 h-3" />
                      Your notes
                    </p>
                    <p className="text-sm text-ink">{item.notes}</p>
                  </div>
                )}

                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {item.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full bg-paper-deep text-xs text-ink-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <a
                    href={`/startups/${item.startupId}`}
                    className="flex-1 h-9 flex items-center justify-center rounded-lg bg-paper-deep border border-rule text-sm font-medium text-ink hover:bg-paper transition-colors"
                  >
                    View Profile
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFromWatchlist(item.startupId)}
                    className="h-9 px-3 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <BookmarkX className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
