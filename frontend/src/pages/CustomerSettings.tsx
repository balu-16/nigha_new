import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshTimer } from '@/contexts/RefreshTimerContext';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut, Timer, RefreshCw, Play, Pause } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const CustomerSettings = () => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { 
    refreshInterval, 
    setRefreshInterval, 
    isAutoRefreshEnabled, 
    setAutoRefreshEnabled,
    triggerRefresh 
  } = useRefreshTimer();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
    navigate('/');
  };

  const handleRefreshIntervalChange = (value: string) => {
    const interval = parseInt(value, 10);
    setRefreshInterval(interval);
    toast({
      title: "Refresh Interval Updated",
      description: `Charts will now refresh every ${interval} seconds`,
    });
  };

  const handleAutoRefreshToggle = (enabled: boolean) => {
    setAutoRefreshEnabled(enabled);
    toast({
      title: enabled ? "Auto-refresh Enabled" : "Auto-refresh Disabled",
      description: enabled 
        ? `Charts will automatically refresh every ${refreshInterval} seconds`
        : "Charts will only refresh manually",
    });
  };

  const handleManualRefresh = () => {
    triggerRefresh();
    toast({
      title: "Charts Refreshed",
      description: "All chart data has been updated",
    });
  };

  const refreshIntervalOptions = [
    { value: "5", label: "5 seconds" },
    { value: "10", label: "10 seconds" },
    { value: "15", label: "15 seconds" },
    { value: "30", label: "30 seconds" },
    { value: "60", label: "1 minute" },
    { value: "120", label: "2 minutes" },
    { value: "300", label: "5 minutes" },
  ];

  return (
    <div className="min-h-screen overflow-y-auto custom-scrollbar p-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Customer Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your dashboard preferences and chart refresh settings</p>

        <Card className="p-6">
          <div className="space-y-6">
            {/* Chart Refresh Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Timer className="w-5 h-5 text-primary" />
                Chart Refresh Settings
              </h3>
              
              <div className="space-y-4">
                {/* Auto-refresh toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isAutoRefreshEnabled ? (
                      <Play className="w-5 h-5 text-green-500" />
                    ) : (
                      <Pause className="w-5 h-5 text-orange-500" />
                    )}
                    <div>
                      <Label htmlFor="auto-refresh-toggle" className="text-base">
                        Auto-refresh Charts
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically refresh chart data at set intervals
                      </p>
                    </div>
                  </div>
                  <Switch 
                    id="auto-refresh-toggle" 
                    checked={isAutoRefreshEnabled} 
                    onCheckedChange={handleAutoRefreshToggle} 
                  />
                </div>

                {/* Refresh interval selector */}
                <div className="space-y-2">
                  <Label htmlFor="refresh-interval" className="text-base">
                    Refresh Interval
                  </Label>
                  <Select 
                    value={refreshInterval.toString()} 
                    onValueChange={handleRefreshIntervalChange}
                    disabled={!isAutoRefreshEnabled}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select refresh interval" />
                    </SelectTrigger>
                    <SelectContent>
                      {refreshIntervalOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {isAutoRefreshEnabled 
                      ? `Charts will refresh every ${refreshInterval} seconds`
                      : "Enable auto-refresh to set interval"
                    }
                  </p>
                </div>

                {/* Manual refresh button */}
                <div className="pt-2">
                  <Button
                    onClick={handleManualRefresh}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Charts Now
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Theme Toggle */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Appearance</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-primary" />
                  ) : (
                    <Sun className="w-5 h-5 text-primary" />
                  )}
                  <div>
                    <Label htmlFor="theme-toggle" className="text-base">
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Toggle between light and dark theme
                    </p>
                  </div>
                </div>
                <Switch id="theme-toggle" checked={theme === 'dark'} onCheckedChange={toggleTheme} />
              </div>
            </div>

            <Separator />

            {/* Logout */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Session</h3>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Sign out of your account and return to the home page.
                </p>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>

            <Separator />

            {/* Account Management */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Account</h3>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be
                  undone.
                </p>
                <DeleteAccountDialog />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CustomerSettings;