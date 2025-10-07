import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 via-background to-primary/10" />
      
      {/* Content */}
      <div className="relative z-10 text-center space-y-6">
        <div className="flex justify-center">
          <AlertCircle className="w-24 h-24 text-destructive neon-glow-magenta" />
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-destructive to-primary">
          404
        </h1>
        
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex gap-4 justify-center pt-4">
          <Button
            onClick={() => navigate('/')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground neon-glow-cyan px-6 py-6"
          >
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Button>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="border-2 border-primary/30 hover:bg-primary/10 px-6 py-6"
          >
            Go Back
          </Button>
        </div>
      </div>

      <style>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary) / 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
