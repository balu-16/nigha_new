const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: 'customer' | 'admin' | 'superadmin';
  created_at: string;
}

export interface Device {
  id: number;
  device_code: string;
  device_name: string;
  assigned_to?: number;
  assigned_user?: {
    id: number;
    name: string;
    phone: string;
  };
  created_at: string;
}

export interface LoginLog {
  id: number;
  admin_id: number;
  admin_name: string;
  admin_phone: string;
  login_time: string;
}

export interface DashboardStats {
  users: {
    total: number;
    customers: number;
    admins: number;
    superadmins: number;
  };
  devices: {
    total: number;
    assigned: number;
    unassigned: number;
  };
  recentLogins: number;
  otpSessions: {
    total: number;
    active: number;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle expired/invalid token
        if (response.status === 403 && (data.message?.includes('token') || data.message?.includes('expired'))) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(data.message || data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async sendOTP(phone: string, role?: string): Promise<ApiResponse> {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, role }),
    });
  }

  async verifyOTP(phone: string, otp: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  }

  async signup(name: string, phone: string, email?: string): Promise<ApiResponse<User>> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, phone, email }),
    });
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request('/auth/profile');
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Device endpoints
  async getDevices(): Promise<ApiResponse<Device[]>> {
    return this.request('/devices/list');
  }

  async addDevice(deviceCode: string, deviceName: string): Promise<ApiResponse<Device>> {
    return this.request('/devices/add', {
      method: 'POST',
      body: JSON.stringify({ device_code: deviceCode, device_name: deviceName }),
    });
  }

  async getDevice(deviceCode: string): Promise<ApiResponse<Device>> {
    return this.request(`/devices/${deviceCode}`);
  }

  async assignDevice(deviceCode: string, userId: number): Promise<ApiResponse> {
    return this.request(`/devices/${deviceCode}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async unassignDevice(deviceCode: string): Promise<ApiResponse> {
    return this.request(`/devices/${deviceCode}/unassign`, {
      method: 'PUT',
    });
  }

  async deleteDevice(deviceCode: string): Promise<ApiResponse> {
    return this.request(`/devices/${deviceCode}`, {
      method: 'DELETE',
    });
  }

  async generateDevices(count: number): Promise<ApiResponse<Device[]>> {
    return this.request('/devices/generate-bulk', {
      method: 'POST',
      body: JSON.stringify({ count }),
    });
  }

  // Admin endpoints
  async getLoginLogs(limit?: number): Promise<ApiResponse<LoginLog[]>> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request(`/admin/logs${params}`);
  }

  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.request('/admin/users');
  }

  async createUser(userData: {
    name: string;
    phone: string;
    email?: string;
    role: 'customer' | 'admin' | 'superadmin';
  }): Promise<ApiResponse<User>> {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUserRole(userId: number, role: string): Promise<ApiResponse> {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async deleteUser(userId: number): Promise<ApiResponse> {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request('/admin/stats');
  }

  async cleanupExpiredOTPs(): Promise<ApiResponse> {
    return this.request('/admin/cleanup-otps', {
      method: 'POST',
    });
  }

  // Device sharing endpoints
  async getSentDevices(userId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/devices/sent/${userId}`);
  }

  async revokeAccess(deviceCode: string, userId: number): Promise<ApiResponse> {
    return this.request(`/devices/${deviceCode}/revoke/${userId}`, {
      method: 'DELETE',
    });
  }

  async downloadQR(deviceCode: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/devices/${deviceCode}/qr`, {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      // Handle expired/invalid token
      if (response.status === 403) {
        const data = await response.json();
        if (data.message?.includes('token') || data.message?.includes('expired')) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
      }
      throw new Error('Failed to download QR code');
    }
    
    return response.blob();
  }

  // Telemetry data methods
  async getTemperatureReadings(deviceId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/devices/${deviceId}/temperature`);
  }

  async getDistanceReadings(deviceId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/devices/${deviceId}/distance`);
  }

  async getPressureReadings(deviceId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/devices/${deviceId}/pressure`);
  }

  async getLatestReadings(deviceId: number): Promise<ApiResponse<any>> {
    return this.request(`/devices/${deviceId}/latest-readings`);
  }
}

export const apiClient = new ApiClient();