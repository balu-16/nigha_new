import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen overflow-y-auto custom-scrollbar p-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your dashboard preferences</p>

        <Card className="p-6">
          <div className="space-y-6">
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

export default Settings;
