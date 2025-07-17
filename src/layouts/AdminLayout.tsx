
import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  User, 
  UserCog,
  Menu, 
  LogOut,
  X,
  BarChart3,
  BellRing
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const AdminLayout = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<number>(0);

  // Simulate notifications count (in a real app, this would come from an API)
  useEffect(() => {
    setNotifications(Math.floor(Math.random() * 5));
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Vehicles",
      href: "/admin/vehicles",
      icon: <Car className="h-5 w-5" />,
    },
    {
      title: "Developers",
      href: "/admin/developers",
      icon: <UserCog className="h-5 w-5" />,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Plan",
      href: "/admin/plan",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Profile",
      href: "/admin/profile",
      icon: <User className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-full bg-white shadow-md"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-theme-darkPurple text-white border-r border-theme-deepPurple/30 shadow-sm transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-theme-deepPurple/40">
            <h1 className="text-xl font-bold text-white flex items-center font-['Orbitron']">
              <BarChart3 className="mr-2 h-6 w-6 text-theme-lightBrown" />
              <span className="text-theme-lightBrown">A</span>utotrace <span className="ml-2 text-sm font-medium px-2 py-1 bg-theme-deepPurple text-white rounded">Admin</span>
            </h1>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) => cn(
                  "flex items-center px-4 py-3 rounded-lg transition-colors duration-200",
                  isActive 
                    ? "bg-theme-deepPurple text-white font-medium" 
                    : "text-gray-300 hover:bg-theme-deepPurple/50 hover:text-white"
                )}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
              >
                {item.icon}
                <span className="ml-3">{item.title}</span>
              </NavLink>
            ))}
          </nav>
          
          {/* User & Logout */}
          <div className="p-4 border-t border-theme-deepPurple/40">
            <div className="flex items-center mb-4 bg-theme-deepPurple/30 p-3 rounded-lg">
              <Avatar className="h-10 w-10 border-2 border-theme-deepPurple shadow-sm">
                <AvatarFallback className="bg-theme-terracotta text-white">
                  {user?.email?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-100 truncate">
                  {user?.email || "admin@autotrace.com"}
                </p>
                <p className="text-xs text-gray-400">Administrator</p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="ml-auto relative">
                      <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white h-8 w-8">
                        <BellRing className="h-5 w-5" />
                      </Button>
                      {notifications > 0 && (
                        <span className="absolute top-0 right-0 h-4 w-4 bg-theme-terracotta rounded-full text-white text-xs flex items-center justify-center">
                          {notifications}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>You have {notifications} notifications</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start text-gray-200 hover:text-white hover:bg-theme-deepPurple/50 border border-theme-deepPurple/40"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out",
        sidebarOpen ? "lg:ml-64" : "ml-0"
      )}>
        {/* Header */}
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <h2 className="text-lg font-medium text-theme-darkPurple">
            {navItems.find(item => item.href === location.pathname)?.title || "Dashboard"}
          </h2>
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-500">
                    <BellRing className="h-5 w-5" />
                    {notifications > 0 && (
                      <span className="absolute top-1 right-1 h-3 w-3 bg-theme-terracotta rounded-full"></span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>You have {notifications} notifications</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </header>
        
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
        
        <footer className="py-4 px-6 border-t text-center text-sm text-gray-500 bg-white">
          &copy; {new Date().getFullYear()} <span className="font-['Orbitron']"><span className="text-theme-terracotta">A</span>utotrace</span>. All rights reserved.
        </footer>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
