
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Admin } from "@/types";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Lock, User, Building, Phone, Mail, MapPin } from "lucide-react";

const AdminProfile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cin, setCin] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('admins')
          .select()
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        setProfileData(data as Admin);
        
        // Set form data
        if (data) {
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
          setCin(data.cin || "");
          setPhone(data.phone || "");
          setCompanyName(data.company_name || "");
          setAddress(data.address || "");
          setEmail(data.email || user.email || "");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]);
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }
    
    setUpdating(true);
    try {
      const updates = {
        first_name: firstName,
        last_name: lastName,
        cin: cin,
        phone: phone,
        company_name: companyName,
        address: address,
        email: email
      };
      
      const { error } = await supabase
        .from('admins')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update local state with the new profile data
      setProfileData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ...updates
        };
      });
      
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile", {
        description: error.message
      });
    } finally {
      setUpdating(false);
    }
  };
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to change your password");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsPasswordDialogOpen(false);
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password", {
        description: error.message
      });
    } finally {
      setPasswordLoading(false);
    }
  };
  
  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };
  
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-theme-deepPurple border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-theme-deepPurple">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-theme-darkPurple">Your Profile</h1>
        {!isEditing && (
          <Button 
            onClick={toggleEdit} 
            className="bg-theme-deepPurple hover:bg-theme-darkPurple text-white"
          >
            Edit Profile
          </Button>
        )}
      </div>
      
      <Card className="border border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-theme-darkPurple to-theme-deepPurple text-white">
          <CardTitle>Admin Account Information</CardTitle>
          <CardDescription className="text-gray-200">
            Manage your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled
                      className="pl-10 bg-gray-50"
                      required
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Email address cannot be changed.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cin">CIN</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <Input
                        id="cin"
                        value={cin}
                        onChange={(e) => setCin(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input
                      id="company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={toggleEdit}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updating}
                  className="bg-theme-deepPurple hover:bg-theme-darkPurple text-white"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="font-medium text-theme-darkPurple flex items-center">
                    <User className="mr-2 h-4 w-4 text-theme-deepPurple" />
                    {profileData?.first_name} {profileData?.last_name}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="font-medium text-theme-darkPurple flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-theme-deepPurple" />
                    {profileData?.email || user?.email}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">CIN</p>
                  <p className="font-medium text-theme-darkPurple flex items-center">
                    <User className="mr-2 h-4 w-4 text-theme-deepPurple" />
                    {profileData?.cin || "Not set"}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="font-medium text-theme-darkPurple flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-theme-deepPurple" />
                    {profileData?.phone || "Not set"}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Company</p>
                  <p className="font-medium text-theme-darkPurple flex items-center">
                    <Building className="mr-2 h-4 w-4 text-theme-deepPurple" />
                    {profileData?.company_name || "Not set"}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="font-medium text-theme-darkPurple flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-theme-deepPurple" />
                    {profileData?.address || "Not set"}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Account Created</p>
                  <p className="font-medium text-theme-darkPurple">
                    {profileData?.created_at 
                      ? new Date(profileData.created_at).toLocaleDateString() 
                      : "Unknown"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
          <CardDescription>
            Manage your password and security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium flex items-center">
                  <Lock className="mr-2 h-4 w-4 text-theme-deepPurple" />
                  Password
                </h4>
                <p className="text-sm text-muted-foreground">Update your password</p>
              </div>
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Change Password</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Create a new password for your account
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleChangePassword} className="space-y-4 py-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <Input
                            id="newPassword"
                            type="password"
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsPasswordDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={passwordLoading}
                        className="bg-theme-deepPurple hover:bg-theme-darkPurple text-white"
                      >
                        {passwordLoading ? "Updating..." : "Update Password"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Two-factor Authentication</h4>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <Button variant="outline" disabled>Coming Soon</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfile;
