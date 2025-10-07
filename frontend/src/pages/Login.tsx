import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, Activity, UserCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<string>('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    if (!role) {
      toast({
        title: "Role Required",
        description: "Please select your role",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.sendOTP(phoneNumber, role);
      if (response.success) {
        setShowOTP(true);
        toast({
          title: "OTP Sent",
          description: "Please check your phone for the verification code",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to send OTP",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.verifyOTP(phoneNumber, otp);
      if (response.success && response.data) {
        login(response.data.token, response.data.user);
        toast({
          title: "Login Successful",
          description: `Welcome back, ${response.data.user.name}!`,
        });
        navigate('/dashboard');
      } else {
        toast({
          title: "Invalid OTP",
          description: response.message || "Please check your OTP and try again",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-accent rounded-full animate-pulse-glow delay-150" />
        <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse-glow delay-300" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-light dark:glass p-8 rounded-2xl border border-primary/30 neon-border-cyan">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Activity className="w-10 h-10 text-primary neon-glow-cyan" />
            <h1 className="text-3xl font-bold neon-text-cyan">IndustriOS</h1>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Login to Dashboard
          </h2>

          {/* Form */}
          <form onSubmit={showOTP ? handleVerifyLogin : handleSendOTP} className="space-y-6">
            {/* Role Selection */}
            {!showOTP && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Login As</label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary z-10" />
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="pl-12 h-12 bg-background/50 border-primary/30 focus:border-primary neon-border-cyan rounded-xl">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Phone Number Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <Input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-12 h-12 bg-background/50 border-primary/30 focus:border-primary neon-border-cyan rounded-xl"
                  disabled={showOTP}
                />
              </div>
            </div>

            {/* OTP Input (Dynamic Reveal) */}
            {showOTP && (
              <div className="space-y-4 animate-slide-in">
                <label className="text-sm font-medium text-foreground/80">Enter OTP</label>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="border-primary/30 neon-border-cyan" />
                      <InputOTPSlot index={1} className="border-primary/30 neon-border-cyan" />
                      <InputOTPSlot index={2} className="border-primary/30 neon-border-cyan" />
                      <InputOTPSlot index={3} className="border-primary/30 neon-border-cyan" />
                      <InputOTPSlot index={4} className="border-primary/30 neon-border-cyan" />
                      <InputOTPSlot index={5} className="border-primary/30 neon-border-cyan" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground neon-glow-cyan text-lg font-semibold rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  {showOTP ? 'Verifying...' : 'Sending...'}
                </div>
              ) : (
                showOTP ? 'Verify & Login' : 'Send OTP'
              )}
            </Button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:text-accent neon-text-cyan font-semibold transition-colors">
                Sign Up
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary) / 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .delay-150 {
          animation-delay: 150ms;
        }

        .delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
};

export default Login;
