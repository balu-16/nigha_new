import { Home, Cpu, BarChart3, FileText, Settings, Smartphone, Users, Shield, Plus, Send, Download } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const DashboardSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const userRole = user?.role || 'customer';
  
  // Custom function to determine if a menu item is active
  const isMenuItemActive = (itemPath: string) => {
    const currentPath = location.pathname + location.hash;
    
    // For exact matches (including hash)
    if (currentPath === itemPath) {
      return true;
    }
    
    // For home page, only highlight when exactly on /dashboard with no hash or #analytics
    if (itemPath === '/dashboard') {
      return location.pathname === '/dashboard' && (!location.hash || location.hash === '#analytics');
    }
    
    return false;
  };
  const isCustomer = userRole === 'customer';
  const isAdmin = userRole === 'admin';
  const isSuperAdmin = userRole === 'superadmin';

  const menuItems = [
    // Customer items
    ...(isCustomer ? [
      { icon: Home, label: 'Home', path: '/dashboard', roles: ['customer'] },
      { icon: Smartphone, label: 'Devices', path: '/dashboard#devices', roles: ['customer'] },
      { icon: Plus, label: 'Add Device', path: '/dashboard#add-devices', roles: ['customer'] },
      { icon: Send, label: 'Sent Devices', path: '/dashboard#sent-devices', roles: ['customer'] },
      { icon: Download, label: 'Received', path: '/dashboard#received-devices', roles: ['customer'] },
    ] : []),
    
    // Admin items
    ...(isAdmin ? [
      { icon: Home, label: 'Home', path: '/dashboard', roles: ['admin'] },
      { icon: Users, label: 'Users', path: '/user-management', roles: ['admin'] },
      { icon: Smartphone, label: 'Devices', path: '/device-management', roles: ['admin'] },
    ] : []),
    
    // SuperAdmin items
    ...(isSuperAdmin ? [
      { icon: Home, label: 'Home', path: '/dashboard', roles: ['superadmin'] },
      { icon: Users, label: 'Users', path: '/user-management', roles: ['superadmin'] },
      { icon: Smartphone, label: 'Devices', path: '/device-management', roles: ['superadmin'] },
      { icon: Shield, label: 'Admins', path: '/admin-management', roles: ['superadmin'] },
    ] : []),
    
    // Settings - different paths for different roles
    ...(isCustomer ? [
      { icon: Settings, label: 'Settings', path: '/customer-settings', roles: ['customer'] },
    ] : []),
    ...((isAdmin || isSuperAdmin) ? [
      { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin', 'superadmin'] },
    ] : []),
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen transition-all duration-300 ease-in-out z-50 ${
        isExpanded ? 'w-64' : 'w-20'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className={`h-full ${isExpanded ? 'glass dark:glass' : ''} ${isExpanded ? 'glass-light' : ''} flex flex-col py-6 px-3`}>
        <div className="mb-8 flex items-center justify-center">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center neon-glow-cyan">
            <Cpu className="w-6 h-6 text-white" />
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const isActive = isMenuItemActive(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 neon-border-cyan'
                    : 'hover:bg-primary/5'
                }`}
              >
                <item.icon
                  className={`w-6 h-6 transition-all duration-200 ${
                    isActive ? 'neon-glow-cyan text-primary' : 'text-foreground/70'
                  }`}
                />
                {isExpanded && (
                  <span
                    className={`text-sm font-medium whitespace-nowrap animate-slide-in ${
                      isActive ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
