
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { User, mapUser } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const DeveloperUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // First get the developer record to get assigned user IDs
        const { data: developerData, error: developerError } = await supabase
          .from('developers')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (developerError) throw developerError;
        
        if (developerData && developerData.assigned_user_ids?.length > 0) {
          const { assigned_user_ids } = developerData;
          
          // Fetch assigned users
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .in('id', assigned_user_ids);
            
          if (userError) throw userError;
          
          // Map raw data to User type
          const mappedUsers = (userData || []).map(mapUser);
          setUsers(mappedUsers);
          setFilteredUsers(mappedUsers);
        } else {
          setUsers([]);
          setFilteredUsers([]);
        }

        // Fetch available users that could be assigned to this developer
        const { data: adminId } = await supabase
          .from('developers')
          .select('admin_uid')
          .eq('id', user.id)
          .single();

        if (adminId?.admin_uid) {
          // Get all users managed by the same admin who aren't already assigned to this developer
          const { data: allUsers, error: allUsersError } = await supabase
            .from('users')
            .select('*')
            .eq('admin_uid', adminId.admin_uid);

          if (allUsersError) throw allUsersError;

          const mappedAllUsers = (allUsers || []).map(mapUser);
          // Filter out users that are already assigned to this developer
          const unassignedUsers = mappedAllUsers.filter(
            u => !developerData?.assigned_user_ids?.includes(u.id)
          );
          
          setAvailableUsers(unassignedUsers);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [user]);
  
  // Apply search filter
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const lowerCaseSearch = searchTerm.toLowerCase();
      setFilteredUsers(
        users.filter((user) => 
          user.first_name.toLowerCase().includes(lowerCaseSearch) ||
          user.last_name.toLowerCase().includes(lowerCaseSearch) ||
          user.cin.toLowerCase().includes(lowerCaseSearch) ||
          user.phone.toLowerCase().includes(lowerCaseSearch) ||
          user.company_name.toLowerCase().includes(lowerCaseSearch)
        )
      );
    }
  }, [searchTerm, users]);

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  const handleAddUser = async () => {
    if (!user || !selectedUserId) return;
    
    setIsSubmitting(true);
    try {
      // First get the developer record to get current assigned user IDs
      const { data: developerData, error: developerError } = await supabase
        .from('developers')
        .select('assigned_user_ids')
        .eq('id', user.id)
        .single();
        
      if (developerError) throw developerError;
      
      // Update the developer record with the new user ID added to the array
      const assignedUserIds = [...(developerData?.assigned_user_ids || []), selectedUserId];
      
      const { error: updateError } = await supabase
        .from('developers')
        .update({ assigned_user_ids: assignedUserIds })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // Fetch the newly assigned user to add to the UI
      const { data: newUserData, error: newUserError } = await supabase
        .from('users')
        .select('*')
        .eq('id', selectedUserId)
        .single();
        
      if (newUserError) throw newUserError;
      
      // Add the new user to the state
      const newUser = mapUser(newUserData);
      setUsers(prev => [...prev, newUser]);
      
      // Remove the user from available users
      setAvailableUsers(prev => prev.filter(u => u.id !== selectedUserId));
      
      toast.success("User assigned successfully");
      setIsAddUserDialogOpen(false);
    } catch (error) {
      console.error("Error assigning user:", error);
      toast.error("Failed to assign user");
    } finally {
      setIsSubmitting(false);
      setSelectedUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-theme-deepPurple border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-theme-deepPurple">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-theme-darkPurple">Users</h1>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-theme-terracotta" />
            <Input
              type="search"
              placeholder="Search users..."
              className="w-full sm:w-[250px] pl-9 border-theme-lightBrown/30 focus:border-theme-deepPurple"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setIsAddUserDialogOpen(true)}
            className="bg-theme-deepPurple hover:bg-theme-darkPurple"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {users.length === 0 ? (
        <Card className="border-theme-lightBrown/20 shadow-md">
          <CardContent className="pt-6 text-center">
            <div className="py-12 px-6">
              <div className="flex justify-center mb-4">
                <div className="bg-theme-lightBrown/10 p-3 rounded-full">
                  <Search className="h-8 w-8 text-theme-terracotta opacity-70" />
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2 text-theme-darkPurple">No users are currently assigned to you</h3>
              <p className="text-muted-foreground">Click the 'Add User' button to request a user assignment from your admin.</p>
              <Button 
                onClick={() => setIsAddUserDialogOpen(true)} 
                className="mt-6 bg-theme-deepPurple hover:bg-theme-darkPurple"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-theme-lightBrown/20 shadow-md">
          <CardHeader>
            <CardTitle className="text-theme-darkPurple">Assigned Users</CardTitle>
            <CardDescription>
              Users that have been assigned to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-theme-lightBrown/20">
                  <TableHead className="text-theme-deepPurple">Name</TableHead>
                  <TableHead className="text-theme-deepPurple">Company</TableHead>
                  <TableHead className="text-theme-deepPurple">CIN</TableHead>
                  <TableHead className="text-theme-deepPurple">Phone</TableHead>
                  <TableHead className="text-right text-theme-deepPurple">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-theme-lightBrown/20 hover:bg-theme-lightBrown/5">
                    <TableCell className="font-medium text-theme-darkPurple">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell className="text-theme-darkPurple/80">{user.company_name || "N/A"}</TableCell>
                    <TableCell className="text-theme-darkPurple/80">{user.cin}</TableCell>
                    <TableCell className="text-theme-darkPurple/80">{user.phone}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(user)}
                        className="text-theme-deepPurple hover:text-theme-darkPurple hover:bg-theme-lightBrown/10"
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {/* User details dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-md bg-white border-theme-lightBrown/30">
          <DialogHeader>
            <DialogTitle className="text-theme-darkPurple">User Details</DialogTitle>
            <DialogDescription className="text-theme-terracotta/70">
              Detailed information about the selected user
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-sm font-medium text-theme-deepPurple">First Name</div>
                <div className="text-theme-darkPurple">{selectedUser.first_name}</div>
                
                <div className="text-sm font-medium text-theme-deepPurple">Last Name</div>
                <div className="text-theme-darkPurple">{selectedUser.last_name}</div>
                
                <div className="text-sm font-medium text-theme-deepPurple">CIN</div>
                <div className="text-theme-darkPurple">{selectedUser.cin}</div>
                
                <div className="text-sm font-medium text-theme-deepPurple">Phone</div>
                <div className="text-theme-darkPurple">{selectedUser.phone}</div>
                
                <div className="text-sm font-medium text-theme-deepPurple">Company</div>
                <div className="text-theme-darkPurple">{selectedUser.company_name}</div>
                
                <div className="text-sm font-medium text-theme-deepPurple">Address</div>
                <div className="text-theme-darkPurple">{selectedUser.address}</div>
                
                <div className="text-sm font-medium text-theme-deepPurple">Vehicle ID</div>
                <div className="text-theme-darkPurple">
                  {selectedUser.vehicle_id ? (
                    <Badge variant="outline" className="bg-theme-lightBrown/10 text-theme-terracotta border-theme-terracotta/20">
                      {selectedUser.vehicle_id}
                    </Badge>
                  ) : (
                    "No vehicle assigned"
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={() => setIsDetailsOpen(false)}
                  className="bg-theme-deepPurple hover:bg-theme-darkPurple"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add User dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border-theme-lightBrown/30">
          <DialogHeader>
            <DialogTitle className="text-theme-darkPurple">Add User</DialogTitle>
            <DialogDescription className="text-theme-terracotta/70">
              Select a user to add to your assignment list
            </DialogDescription>
          </DialogHeader>
          
          {availableUsers.length === 0 ? (
            <Alert className="bg-theme-lightBrown/10 border-theme-terracotta/20 text-theme-terracotta">
              <AlertTitle>No available users</AlertTitle>
              <AlertDescription>
                There are no more users available for assignment. Contact your admin to create new users.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="user-select" className="text-right text-theme-deepPurple">
                    User
                  </Label>
                  <Select
                    value={selectedUserId || ""}
                    onValueChange={setSelectedUserId}
                  >
                    <SelectTrigger className="col-span-3 border-theme-lightBrown/30 focus:ring-theme-deepPurple">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} - {user.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddUserDialogOpen(false)}
                  className="border-theme-terracotta/20 text-theme-terracotta hover:bg-theme-terracotta/10 hover:text-theme-terracotta"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddUser} 
                  disabled={!selectedUserId || isSubmitting}
                  className="bg-theme-deepPurple hover:bg-theme-darkPurple"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Add User
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeveloperUsers;
