'use client';

import { useState, useMemo, useEffect } from 'react';
import { BarChart3, Building2, CheckCircle, Clock, DollarSign, FileText, Home, MapPin, Settings, TrendingUp, Users, Verified, Eye, Download, Bell, X, Filter, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

// Types
interface IUser {
  _id: string;
  name?: string;
  email: string;
  // Add other user properties if they are populated and used
}

interface Startup {
  _id: string;
  name: string;
  founders: IUser[]; // Changed to IUser[] as per API response
  sector: string;
  createdAt: string; // Will store formatted date string
  employees: string;
  revenue: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  // Removed fayda_verified as it's not in the API response
}

interface Activity {
  action: string;
  entity: string;
  time: string;
  type: string; // Added type based on mock data, though not explicitly from API
}

interface Sector {
  name: string;
  percentage: number;
  count: number;
}

interface Region { // This type is for mock data, not directly from API, but kept for analytics section
  region: string;
  count: number;
  percentage: number;
}

interface DashboardStats {
  totalStartups: number;
  verifiedStartups: number;
  pendingVerifications: number;
  totalInvestment: number;
  activeInvestors: number;
  jobsCreated: number;
  monthlyGrowth: number;
  successRate: number;
  regionsActive: number;
}

// Sidebar Component
interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  data: Startup[] | null; // `data` here refers to the startups for the badge count
}

// delete
const handleRejection = async (startupId: string, fetchData: () => void) => {
  try {
    const res = await fetch('/api/startups', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ startupId }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to reject startup');
    }
    console.log('Startup rejected successfully:', data);
    fetchData(); // Re-fetch data after successful rejection
  } catch (error) {
    console.error('Error rejecting startup:', error);
  }
};

const handleApprove = async ({
  startupId,
  fetchData,
}: {
  startupId: string;
  fetchData: () => void;
}) => {
  try {
    const res = await fetch('/api/startups', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ startupId }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to approve startup');
    }
    fetchData();
    console.log('Approved:', data);
  } catch (error) {
    console.error('Approval error:', error);
  }
};

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, data }) => {
  return (
    <div className="w-64 bg-white shadow-lg border-r">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">Green Circle</h1>
            <p className="text-sm text-gray-500">Admin Portal</p>
          </div>
        </div>
      </div>
      <nav className="p-4">
        <div className="space-y-2">
          {[
            { tab: 'overview', icon: Home, label: 'Overview' },
            {
              tab: 'verification',
              icon: CheckCircle,
              label: 'Verification Queue',
              badge: data?.filter(s => s.status === 'pending').length || 0, // Only count pending for badge
            },
            { tab: 'startups', icon: Building2, label: 'Startups' },
            { tab: 'analytics', icon: BarChart3, label: 'Analytics' },
          ].map(({ tab, icon: Icon, label, badge }) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab(tab)}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
              {badge ? (
                <Badge variant="secondary" className="ml-auto">
                  {badge}
                </Badge>
              ) : null}
            </Button>
          ))}
        </div>
      </nav>
    </div>
  );
};

// Overview Component
interface OverviewContentProps {
  stats: DashboardStats | null;
  sectors: Sector[] | null;
  activities: Activity[] | null;
  regionalData: Region[]; // Added regionalData prop
}

const OverviewContent: React.FC<OverviewContentProps> = ({
  stats,
  sectors,
  activities,
  regionalData, // Destructure regionalData
}) => {
  if (!stats || !sectors || !activities) {
    return <div>Loading overview data...</div>; // Or a skeleton loader
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: 'Total Startups',
            value: stats.totalStartups.toLocaleString(),
            icon: Building2,
            subtext: `+${stats.monthlyGrowth}% from last month`,
          },
          {
            title: 'Verified Startups',
            value: stats.verifiedStartups,
            icon: Verified,
            subtext: `${Math.round(
              (stats.verifiedStartups / stats.totalStartups) * 100
            )}% of total`,
            iconClass: 'text-primary',
          },
          {
            title: 'Pending Verifications',
            value: stats.pendingVerifications,
            icon: Clock,
            subtext: 'Requires review',
            iconClass: 'text-orange-600',
          },
          {
            title: 'Total Investment',
            value: `$${(stats.totalInvestment / 1000000).toFixed(1)}M`,
            icon: DollarSign,
            subtext: '+23% from last quarter', // This subtext is still hardcoded
          },
          {
            title: 'Active Investors',
            value: stats.activeInvestors,
            icon: TrendingUp,
            subtext: '+8 new this month', // This subtext is still hardcoded
          },
          {
            title: 'Jobs Created',
            value: stats.jobsCreated.toLocaleString(),
            icon: Users,
            subtext: 'Direct employment', // This subtext is still hardcoded
          },
        ].map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon
                className={`h-4 w-4 ${
                  stat.iconClass || 'text-muted-foreground'
                }`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sector Distribution</CardTitle>
            <CardDescription>Startups by industry sector</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sectors.map((sector, idx) => (
                <div key={`${sector.name}-${idx}`} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{sector.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {sector.count} ({sector.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${sector.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-sm text-gray-600 truncate">
                      {activity.entity}
                    </p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Verification Component
interface VerificationContentProps {
  startups: Startup[] | null;
  fetchData: () => void;
}

const VerificationContent: React.FC<VerificationContentProps> = ({
  startups,
  fetchData,
}) => {
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<keyof Startup>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredStartups = useMemo(() => {
    if (!startups) return [];
    let result = startups;

    if (selectedSector !== 'all') {
      result = result.filter(
        (startup) => startup.sector.toLowerCase() === selectedSector
      );
    }

    if (searchTerm) {
      result = result.filter(
        (startup) =>
          startup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          startup.founders.some((founder) =>
            (founder.name || founder.email).toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    return result.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      // For founders, compare by the first founder's name/email
      if (sortField === 'founders') {
        const aFounderName = a.founders[0]?.name || a.founders[0]?.email || '';
        const bFounderName = b.founders[0]?.name || b.founders[0]?.email || '';
        return sortOrder === 'asc'
          ? aFounderName.localeCompare(bFounderName)
          : bFounderName.localeCompare(aFounderName);
      }
      // For createdAt, compare as dates
      if (sortField === 'createdAt') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      // Fallback for other types or if values are not comparable
      return 0;
    });
  }, [startups, selectedSector, searchTerm, sortField, sortOrder]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge
            variant="outline"
            className="text-orange-600 border-orange-600"
          >
            Pending
          </Badge>
        );
      case 'under_review':
        return (
          <Badge variant="outline" className="text-primary border-blue-600">
            Under Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="bg-primary">
            Approved
          </Badge>
        );
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleSort = (field: keyof Startup) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pending Verifications</h3>
          <p className="text-gray-600">
            Review and approve startup verification requests
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search startups or founders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={selectedSector} onValueChange={setSelectedSector}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sectors</SelectItem>
              <SelectItem value="fintech">FinTech</SelectItem>
              <SelectItem value="agtech">AgTech</SelectItem>
              <SelectItem value="edtech">EdTech</SelectItem>
              <SelectItem value="healthtech">HealthTech</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {[
                { label: 'Startup Name', field: 'name' },
                { label: 'Founders', field: 'founders' },
                { label: 'Sector', field: 'sector' },
                { label: 'Status', field: 'status' },
                { label: 'Location', field: 'location' },
                { label: 'Employees', field: 'employees' },
                { label: 'Revenue', field: 'revenue' },
                { label: 'Submitted', field: 'createdAt' },
                { label: 'Actions' },
              ].map((header, index) => (
                <TableHead
                  key={index}
                  className={header.field ? 'cursor-pointer' : ''}
                  onClick={
                    header.field
                      ? () => handleSort(header.field as keyof Startup)
                      : undefined
                  }
                >
                  {header.label}
                  {header.field && sortField === header.field && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStartups.length > 0 ? (
              filteredStartups.map((startup, idx) => (
                <TableRow key={`${startup._id}-${idx}`}>
                  <TableCell className="font-medium">{startup.name}</TableCell>
                  <TableCell>
                    {Array.isArray(startup.founders) &&
                    startup.founders.length > 0
                      ? startup.founders.map(f => f.name || f.email).join(', ')
                      : ''}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{startup.sector}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(startup.status)}</TableCell>
                  <TableCell>{startup.location}</TableCell>
                  <TableCell>{startup.employees}</TableCell>
                  <TableCell>{startup.revenue}</TableCell>
                  <TableCell>{startup.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                      {startup.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              const startupId = startup._id;
                              handleApprove({ startupId, fetchData });
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejection(startup._id, fetchData)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center"> {/* Adjusted colspan */}
                  No startups available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

// Main Dashboard Component
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [startupsData, setStartupsData] = useState<Startup[] | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [sectorData, setSectorData] = useState<Sector[] | null>(null);
  const [recentActivity, setRecentActivity] = useState<Activity[] | null>(null);

  async function fetchData() {
    try {
      const response = await fetch('/api/startups');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server responded with non-OK status:', response.status, errorText);
        setStartupsData(null);
        setDashboardStats(null);
        setSectorData(null);
        setRecentActivity(null);
        throw new Error(`Failed to fetch data: ${response.statusText || 'Unknown error'}. Server response: ${errorText.substring(0, 200)}...`);
      }

      const result = await response.json();
      console.log('admin fetch', result);
      setStartupsData(
        result.startups.map((item: any) => ({
          _id: item._id,
          name: item.name,
          founders: item.founders,
          sector: item.sector,
          createdAt: new Date(item.createdAt).toLocaleString(),
          employees: item.employees,
          revenue: item.revenue,
          location: item.location,
          status: item.status,
        }))
      );
      setDashboardStats(result.stats);
      setSectorData(result.sectors);
      setRecentActivity(result.activities);
    } catch (error) {
      console.error('Error fetching data:', error);
      setStartupsData(null);
      setDashboardStats(null);
      setSectorData(null);
      setRecentActivity(null);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Derive regionalData here, accessible to both OverviewContent and Analytics
  const regionalData: Region[] = useMemo(() => {
    if (!dashboardStats) return [];
    return [
      { region: 'Addis Ababa', count: Math.round(dashboardStats.totalStartups * 0.45), percentage: 45 },
      { region: 'Oromia', count: Math.round(dashboardStats.totalStartups * 0.18), percentage: 18 },
      { region: 'Amhara', count: Math.round(dashboardStats.totalStartups * 0.12), percentage: 12 },
      { region: 'Tigray', count: Math.round(dashboardStats.totalStartups * 0.08), percentage: 8 },
      { region: 'SNNP', count: Math.round(dashboardStats.totalStartups * 0.10), percentage: 10 },
      { region: 'Other Regions', count: Math.round(dashboardStats.totalStartups * 0.07), percentage: 7 },
    ];
  }, [dashboardStats]);


  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} data={startupsData} />
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'verification' && 'Startup Verification'}
                {activeTab === 'startups' && 'Startup Management'}
                {activeTab === 'analytics' && 'Platform Analytics'}
              </h2>
              <p className="text-gray-600">
                Green Circle · Editors&apos; Room
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" />
                      <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="p-6">
          {activeTab === 'overview' && (
            dashboardStats && sectorData && recentActivity ? (
              <OverviewContent
                stats={dashboardStats}
                sectors={sectorData}
                activities={recentActivity}
                regionalData={regionalData} // Pass regionalData to OverviewContent
              />
            ) : (
              <div>Loading dashboard overview...</div> // Loading state for overview
            )
          )}
          {activeTab === 'verification' && (
            <VerificationContent startups={startupsData} fetchData={fetchData} />
          )}
          {activeTab === 'analytics' && (
            dashboardStats && sectorData && recentActivity ? ( // Re-using fetched data for analytics
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      title: 'Monthly Growth',
                      value: `+${dashboardStats.monthlyGrowth}%`,
                      subtext: 'New startups this month',
                      className: 'text-primary',
                    },
                    {
                      title: 'Investment Flow',
                      value: `$${(dashboardStats.totalInvestment / 1000000).toFixed(1)}M`, // Using totalInvestment from fetched stats
                      subtext: 'Total investment recorded', // Updated subtext
                      className: 'text-primary',
                    },
                    {
                      title: 'Success Rate',
                      value: `${dashboardStats.successRate}%`,
                      subtext: 'Verification approval',
                      className: 'text-purple-600',
                    },
                    {
                      title: 'Regional Spread',
                      value: dashboardStats.regionsActive,
                      subtext: 'Regions covered',
                      className: 'text-orange-600',
                    },
                  ].map((stat, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          {stat.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${stat.className}`}>
                          {stat.value}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {stat.subtext}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Geographic Distribution</CardTitle>
                    <CardDescription>
                      Startups by region in Ethiopia
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Using the derived regionalData */}
                      {regionalData.map((region) => (
                        <div key={region.region} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {region.region}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {region.count} ({region.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${region.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div>Loading analytics data...</div> // Loading state for analytics
            )
          )}
          {(activeTab === 'startups' ||
            activeTab === 'users' ||
            activeTab === 'settings') && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === 'startups' && 'Startup Management'}
                  {activeTab === 'users' && 'User Management'}
                  {activeTab === 'settings' && 'Platform Settings'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'startups' &&
                    'Manage all registered startups on the platform'}
                  {activeTab === 'users' &&
                    'Manage platform users and permissions'}
                  {activeTab === 'settings' &&
                    'Configure platform settings and preferences'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">
                      This section is under development
                    </p>
                    <p className="text-sm">More features coming soon</p>
                    <Button className="mt-4 bg-transparent" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Request Feature
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
