
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, userRole } = useAuth();
  const navigate = useNavigate();

  // Add useEffect to handle automatic redirect based on role
  useEffect(() => {
    if (userRole === 'admin') {
      navigate('/admin/dashboard');
    } else if (userRole === 'developer') {
      navigate('/developer/dashboard');
    }
  }, [userRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Special logic for creator registration access
    if (email === "creator@creator.tn" && password === "autotrace2025creator") {
      setIsLoading(false);
      navigate("/register");
      return;
    } else if (email === "creator@creator.tn" || password === "autotrace2025creator") {
      setIsLoading(false);
      toast.error("Both email and password must match for creator registration access");
      return;
    }

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast.error("Failed to sign in", {
          description: error.message,
        });
        return;
      }
      
      toast.success("Logged in successfully");
      
      // Navigate is done in useEffect based on userRole
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-theme-darkPurple via-theme-deepPurple to-theme-deepPurple/90 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">autotrace</h1>
          <p className="mt-2 text-theme-lightBrown">Vehicle Tracking System</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/95 border-theme-deepPurple/10 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-theme-darkPurple text-2xl">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-theme-deepPurple/20 focus-visible:ring-theme-deepPurple"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="#"
                    className="text-sm font-medium text-theme-terracotta hover:text-theme-deepPurple"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-theme-deepPurple/20 focus-visible:ring-theme-deepPurple"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-theme-deepPurple hover:bg-theme-darkPurple text-white" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
              
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
