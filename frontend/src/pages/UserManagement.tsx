import React, { useState } from 'react';
import { User } from '@/lib/api';
import { UserManagement as UserManagementComponent } from '@/components/UserManagement';
import { AddUserDialog } from '@/components/AddUserDialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';

const UserManagement = () => {
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddUser = () => {
    setAddUserDialogOpen(true);
  };

  const handleDeleteUser = (userToDelete: User) => {
    setSelectedUserToDelete(userToDelete);
    setDeleteUserDialogOpen(true);
  };

  const handleUserAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setAddUserDialogOpen(false);
  };

  const handleUserDeleted = () => {
    setRefreshTrigger(prev => prev + 1);
    setDeleteUserDialogOpen(false);
    setSelectedUserToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-accent/10 rounded-full blur-3xl animate-pulse delay-150"></div>
        <div className="absolute w-64 h-64 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary/5 rounded-full blur-2xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage users and their permissions
          </p>
        </div>

        {/* User Management Component */}
        <UserManagementComponent
          key={refreshTrigger}
          onAddUser={handleAddUser}
          onDeleteUser={handleDeleteUser}
        />

        {/* Dialogs */}
        <AddUserDialog
          open={addUserDialogOpen}
          onOpenChange={setAddUserDialogOpen}
          onUserAdded={handleUserAdded}
        />

        <ConfirmDeleteDialog
          open={deleteUserDialogOpen}
          onOpenChange={setDeleteUserDialogOpen}
          user={selectedUserToDelete}
          onUserDeleted={handleUserDeleted}
        />
      </div>
    </div>
  );
};

export default UserManagement;