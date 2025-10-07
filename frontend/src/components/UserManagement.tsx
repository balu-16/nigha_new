import React, { useState, useEffect } from 'react';
import { apiClient, User } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserPlus, Shield, User as UserIcon, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserManagementProps {
  onAddUser: () => void;
  onDeleteUser: (user: User) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onAddUser, onDeleteUser }) => {
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
        setUsers(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'customer':
        return <UserIcon className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'customer':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const canDeleteUser = (user: User) => {
    if (!currentUser) return false;
    
    // Superadmin can delete anyone except themselves
    if (currentUser.role === 'superadmin') {
      return user.id !== currentUser.id;
    }
    
    // Admin can only delete customers
    if (currentUser.role === 'admin') {
      return user.role === 'customer';
    }
    
    return false;
  };

  const canAddRole = (role: string) => {
    if (!currentUser) return false;
    
    // Superadmin can add anyone
    if (currentUser.role === 'superadmin') {
      return true;
    }
    
    // Admin can only add customers
    if (currentUser.role === 'admin') {
      return role === 'customer';
    }
    
    return false;
  };

  const filteredUsers = users.filter(user => {
    if (!currentUser) return false;
    
    // UserManagement should only show customers
    return user.role === 'customer';
    
    return false;
  });

  if (loading) {
    return (
      <Card className="glass-light dark:glass border border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            User Management
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
              <UserIcon className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage {currentUser?.role === 'superadmin' ? 'all users' : 'customers'} in the system
            </CardDescription>
          </div>
          <Button 
            onClick={onAddUser}
            className="bg-primary hover:bg-primary/90"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.phone}</div>
                    {user.email && (
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
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
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};