import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Shield, Clock, CheckCircle, XCircle, AlertTriangle, Users, Settings } from "lucide-react";

interface AdminConfig {
  key: string;
  value: any;
  description: string;
}

interface ValidationStats {
  total_pending: number;
  total_approved: number;
  total_rejected: number;
  avg_validation_time: number;
  top_validators: Array<{
    username: string;
    validation_count: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function AdminDashboard() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<AdminConfig[]>([]);
  const [stats, setStats] = useState<ValidationStats | null>(null);
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch admin configurations
      const { data: configData, error: configError } = await supabase
        .from('admin_config')
        .select('*')
        .order('key');

      if (configError) throw configError;

      // Fetch validation statistics
      const { data: statsData, error: statsError } = await supabase
        .from('user_challenges')
        .select(`
          validation_status,
          validated_at,
          completed_at,
          profiles!user_challenges_validated_by_fkey (
            username
          )
        `)
        .not('validation_status', 'is', null);

      if (statsError) throw statsError;

      // Fetch pending reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('submission_reports')
        .select(`
          *,
          user_challenges!submission_reports_user_challenge_id_fkey (
            challenges!user_challenges_challenge_id_fkey (
              title
            ),
            profiles!user_challenges_user_id_fkey (
              username
            )
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      // Process statistics
      const validationStats = processValidationStats(statsData || []);

      setConfigs(configData || []);
      setStats(validationStats);
      setPendingReports(reportsData || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin dashboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processValidationStats = (data: any[]): ValidationStats => {
    const pending = data.filter(d => d.validation_status === 'pending').length;
    const approved = data.filter(d => d.validation_status === 'approved').length;
    const rejected = data.filter(d => d.validation_status === 'rejected').length;

    // Calculate average validation time
    const validatedSubmissions = data.filter(d => 
      d.validation_status !== 'pending' && d.validated_at && d.completed_at
    );

    const avgTime = validatedSubmissions.length > 0 
      ? validatedSubmissions.reduce((sum, item) => {
          const completedAt = new Date(item.completed_at);
          const validatedAt = new Date(item.validated_at);
          return sum + (validatedAt.getTime() - completedAt.getTime());
        }, 0) / validatedSubmissions.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Count top validators
    const validatorCounts: Record<string, number> = {};
    data.forEach(item => {
      if (item.profiles?.username) {
        validatorCounts[item.profiles.username] = (validatorCounts[item.profiles.username] || 0) + 1;
      }
    });

    const topValidators = Object.entries(validatorCounts)
      .map(([username, count]) => ({ username, validation_count: count }))
      .sort((a, b) => b.validation_count - a.validation_count)
      .slice(0, 5);

    return {
      total_pending: pending,
      total_approved: approved,
      total_rejected: rejected,
      avg_validation_time: avgTime,
      top_validators: topValidators
    };
  };

  const updateConfig = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('admin_config')
        .update({ value })
        .eq('key', key);

      if (error) throw error;

      toast({
        title: "Configuration updated",
        description: `${key} has been updated successfully.`,
      });

      fetchAdminData();
    } catch (error) {
      console.error('Error updating config:', error);
      toast({
        title: "Error",
        description: "Failed to update configuration.",
        variant: "destructive",
      });
    }
  };

  const resolveReport = async (reportId: string, action: 'reviewed' | 'dismissed') => {
    try {
      const { error } = await supabase
        .from('submission_reports')
        .update({ 
          status: action,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Report resolved",
        description: `Report has been marked as ${action}.`,
      });

      fetchAdminData();
    } catch (error) {
      console.error('Error resolving report:', error);
      toast({
        title: "Error",
        description: "Failed to resolve report.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading admin dashboard...</div>;
  }

  const chartData = stats ? [
    { name: 'Pending', value: stats.total_pending },
    { name: 'Approved', value: stats.total_approved },
    { name: 'Rejected', value: stats.total_rejected }
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6" />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Validations</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_pending || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.total_approved || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.total_rejected || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Validation Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avg_validation_time.toFixed(1) || 0}h</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">
            Reports
            {pendingReports.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingReports.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Validation Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Validators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.top_validators.map((validator, index) => (
                    <div key={validator.username} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                          {index + 1}
                        </div>
                        <span className="font-medium">{validator.username}</span>
                      </div>
                      <Badge variant="outline">
                        {validator.validation_count} validations
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {pendingReports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">No pending reports</h3>
                <p className="text-muted-foreground">All reports have been resolved.</p>
              </CardContent>
            </Card>
          ) : (
            pendingReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Report: {report.user_challenges?.challenges?.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Reported by user • {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {report.reason}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {report.description && (
                    <p className="text-sm mb-4">{report.description}</p>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => resolveReport(report.id, 'reviewed')}
                    >
                      Mark as Reviewed
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => resolveReport(report.id, 'dismissed')}
                    >
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {configs.map((config) => (
                <div key={config.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <Label className="font-medium">{config.key.replace(/_/g, ' ').toUpperCase()}</Label>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                  <Input
                    type="number"
                    defaultValue={config.value}
                    onBlur={(e) => {
                      if (e.target.value !== config.value) {
                        updateConfig(config.key, e.target.value);
                      }
                    }}
                  />
                  <div className="text-sm text-muted-foreground">
                    Current: {config.value}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}