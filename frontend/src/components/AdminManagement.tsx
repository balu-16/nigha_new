import React, { useState, useEffect } from 'react';
import { apiClient, User } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserPlus, Shield, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminManagementProps {
  onAddUser: () => void;
  onDeleteUser: (user: User) => void;
}

export const AdminManagement: React.FC<AdminManagementProps> = ({ onAddUser, onDeleteUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUsers();
      if (response.success && response.data) {
        // Filter to show only admin users (not superadmins)
        const adminUsers = response.data.filter((user: User) => 
          user.role === 'admin'
        );
        setUsers(adminUsers);
      }
    } catch (error) {
      console.error('Failed to fetch admin users:', error);
      toast({
        title: "Error",
        description: "Failed to load admin users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      const response = await apiClient.deleteUser(user.id);
      if (response.success) {
        toast({
          title: "Success",
          description: `${user.name} has been deleted successfully`,
        });
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const canDeleteUser = (user: User) => {
    if (!currentUser) return false;
    
    // Superadmin can delete admin users but not themselves
    if (currentUser.role === 'superadmin') {
      return user.id !== currentUser.id && user.role === 'admin';
    }
    
    return false;
  };

  if (loading) {
    return (
      <Card className="glass-light dark:glass border border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-light dark:glass border border-primary/30 hover:border-primary/50 transition-all">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Management
            </CardTitle>
            <CardDescription>
              Manage admin users and superadmin accounts
            </CardDescription>
          </div>
          <Button 
            onClick={onAddUser}
            className="bg-primary hover:bg-primary/90 neon-glow-cyan"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Admin
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No admin users found
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-lg border border-primary/20 hover:border-primary/40 transition-all bg-background/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(user.role)}
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.phone}</p>
                      {user.email && (
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                    {user.role}
                  </Badge>
                  
                  {canDeleteUser(user) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteUser(user)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};