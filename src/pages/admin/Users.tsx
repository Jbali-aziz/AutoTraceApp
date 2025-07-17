
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Customer } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, MoreHorizontal, Plus, Trash, Edit, Car } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<Customer[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Customer | null>(null);
  
  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cin, setCin] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [developerId, setDeveloperId] = useState<string | null>(null);
  
  // Available vehicles and developers
  const [availableVehicles, setAvailableVehicles] = useState<{id: string, plate_number: string}[]>([]);
  const [availableDevelopers, setAvailableDevelopers] = useState<{id: string, name: string}[]>([]);
  
  // Fetch users, vehicles and developers
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch users managed by this admin
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('admin_uid', user.id);
        if (userError) throw userError;
        setUsers(userData || []);
        setFilteredUsers(userData || []);
        
        // Fetch available vehicles
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('id, plate_number')
          .eq('admin_uid', user.id);
        if (vehicleError) throw vehicleError;
        setAvailableVehicles(vehicleData || []);

        // Fetch available developers
        const { data: developerData, error: developerError } = await supabase
          .from('developers')
          .select('id, first_name, last_name')
          .eq('admin_uid', user.id);
        if (developerError) throw developerError;
        
        // Format developer data for display
        const formattedDevelopers = (developerData || []).map(dev => ({
          id: dev.id,
          name: `${dev.first_name} ${dev.last_name}`
        }));
        setAvailableDevelopers(formattedDevelopers);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load users and vehicles");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up subscription for real-time updates
    const usersChannel = supabase
      .channel('users_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'users',
        filter: `admin_uid=eq.${user?.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newUser = payload.new as Customer;
          setUsers(prev => [...prev, newUser]);
          // Update filtered users only if search is empty or the new user matches the search
          if (searchTerm === '' || 
              newUser.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              newUser.last_name.toLowerCase().includes(searchTerm.toLowerCase())) {
            setFilteredUsers(prev => [...prev, newUser]);
          }
          toast.success("New user added");
        } 
        else if (payload.eventType === 'UPDATE') {
          const updatedUser = payload.new as Customer;
          setUsers(prev => 
            prev.map(u => u.id === updatedUser.id ? updatedUser : u)
          );
          setFilteredUsers(prev => 
            prev.map(u => u.id === updatedUser.id ? updatedUser : u)
          );
          toast.success("User updated");
        } 
        else if (payload.eventType === 'DELETE') {
          const deletedUser = payload.old as Customer;
          setUsers(prev => prev.filter(u => u.id !== deletedUser.id));
          setFilteredUsers(prev => prev.filter(u => u.id !== deletedUser.id));
          toast.success("User deleted");
        }
      })
      .subscribe();
      
    // Set up subscription for vehicles changes
    const vehiclesChannel = supabase
      .channel('vehicles_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'vehicles',
        filter: `admin_uid=eq.${user?.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
          // Refetch vehicles to get updated list
          supabase
            .from('vehicles')
            .select('id, plate_number')
            .eq('admin_uid', user?.id)
            .then(({ data }) => {
              if (data) setAvailableVehicles(data);
            });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(vehiclesChannel);
    };
  }, [user, searchTerm]);
  
  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const lowerCaseSearch = searchTerm.toLowerCase();
      setFilteredUsers(
        users.filter((user) => 
          user.first_name.toLowerCase().includes(lowerCaseSearch) ||
          user.last_name.toLowerCase().includes(lowerCaseSearch) ||
          user.company_name.toLowerCase().includes(lowerCaseSearch) ||
          user.cin.toLowerCase().includes(lowerCaseSearch)
        )
      );
    }
  }, [searchTerm, users]);
  
  // Set form values when editing
  useEffect(() => {
    if (isEditing && selectedUser) {
      setFirstName(selectedUser.first_name);
      setLastName(selectedUser.last_name);
      setCin(selectedUser.cin);
      setPhone(selectedUser.phone);
      setCompanyName(selectedUser.company_name);
      setAddress(selectedUser.address);
      setVehicleId(selectedUser.vehicle_id);
      // We don't have developerId in selectedUser, 
      // so we'll need to fetch it if needed, or initialize it to null
      setDeveloperId(null);
    } else {
      resetForm();
    }
  }, [isEditing, selectedUser]);
  
  // Reset the form
  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setCin("");
    setPhone("");
    setCompanyName("");
    setAddress("");
    setVehicleId(null);
    setDeveloperId(null);
  };
  
  // Dialog open/close handlers
  const handleOpenDialog = (user?: Customer) => {
    if (user) {
      setSelectedUser(user);
      setIsEditing(true);
      
      // If editing, fetch developer assignment if any
      fetchDeveloperAssignment(user.id);
    } else {
      setSelectedUser(null);
      setIsEditing(false);
      resetForm();
    }
    setDialogOpen(true);
  };
  
  // Fetch developer assignment for a user
  const fetchDeveloperAssignment = async (userId: string) => {
    try {
      // Query all developers to find who has this user assigned
      const { data: developers, error } = await supabase
        .from('developers')
        .select('id, assigned_user_ids')
        .eq('admin_uid', user?.id);
        
      if (error) throw error;
      
      // Find developer who has this user in assigned_user_ids
      const assignedDeveloper = developers?.find(dev => 
        dev.assigned_user_ids && dev.assigned_user_ids.includes(userId)
      );
      
      setDeveloperId(assignedDeveloper?.id || null);
    } catch (error) {
      console.error("Error fetching developer assignment:", error);
    }
  };
  
  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to perform this action");
      return;
    }
    
    try {
      // Prepare user data
      const userData = {
        first_name: firstName,
        last_name: lastName,
        cin: cin,
        phone: phone,
        company_name: companyName,
        address: address,
        vehicle_id: vehicleId === "none" ? null : vehicleId,
        admin_uid: user.id
      };
      
      let userId = selectedUser?.id;
      
      if (isEditing && selectedUser) {
        // Update existing user
        const { error } = await supabase
          .from('users')
          .update(userData)
          .eq('id', selectedUser.id);
          
        if (error) throw error;
        
        // Real-time will handle the UI update
      } else {
        // Create new user with UUID
        // Generate a UUID directly
        const newId = crypto.randomUUID();
        userId = newId;
        
        // Create new user with the generated UUID
        const { error } = await supabase
          .from('users')
          .insert({
            id: newId,
            ...userData
          });
          
        if (error) throw error;
        
        // Real-time will handle the UI update
      }
      
      // Update developer assignment if selected
      if (userId) {
        if (developerId) {
          await handleDeveloperAssignment(userId, developerId);
        } else {
          // If no developer selected, remove from any developer assignments
          await removeUserFromAllDevelopers(userId);
        }
      }
      
      setDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving user:", error);
      toast.error("Failed to save user", { 
        description: error.message 
      });
    }
  };

  const handleDeveloperAssignment = async (userId: string, developerId: string) => {
    try {
      // First remove user from any developers they might be assigned to
      await removeUserFromAllDevelopers(userId);
      
      // Then add to the selected developer
      const { data: developerData, error: getError } = await supabase
        .from('developers')
        .select('assigned_user_ids')
        .eq('id', developerId)
        .single();
        
      if (getError) throw getError;
      
      const assignedUserIds = [...(developerData?.assigned_user_ids || [])];
      if (!assignedUserIds.includes(userId)) {
        assignedUserIds.push(userId);
        
        const { error: updateError } = await supabase
          .from('developers')
          .update({ assigned_user_ids: assignedUserIds })
          .eq('id', developerId);
          
        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error("Error updating developer assignment:", error);
      toast.error("Failed to update developer assignment");
    }
  };

  const removeUserFromAllDevelopers = async (userId: string) => {
    try {
      // Get all developers managed by this admin
      const { data: developers, error: devError } = await supabase
        .from('developers')
        .select('id, assigned_user_ids')
        .eq('admin_uid', user?.id);
        
      if (devError) throw devError;
      
      // Update each developer who has this user assigned
      for (const dev of developers || []) {
        if (dev.assigned_user_ids && dev.assigned_user_ids.includes(userId)) {
          const updatedIds = dev.assigned_user_ids.filter(id => id !== userId);
          
          await supabase
            .from('developers')
            .update({ assigned_user_ids: updatedIds })
            .eq('id', dev.id);
        }
      }
    } catch (error) {
      console.error("Error removing user from developers:", error);
    }
  };
  
  // Handle delete
  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }
    
    try {
      // Remove user from any developers first
      await removeUserFromAllDevelopers(userId);
      
      // Delete the user
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
        
      if (error) throw error;
      
      // Real-time will handle the UI update
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };
  
  // Get vehicle plate number by ID
  const getVehiclePlate = (vehicleId: string | null) => {
    if (!vehicleId) return 'None';
    const vehicle = availableVehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.plate_number : 'Unknown';
  };

  // Get developer assigned to user
  const getDeveloperAssignment = (userId: string) => {
    for (const dev of availableDevelopers) {
      const { data } = supabase
        .from('developers')
        .select('assigned_user_ids')
        .eq('id', dev.id)
        .single();
        
      if (data && data.assigned_user_ids && data.assigned_user_ids.includes(userId)) {
        return dev.name;
      }
    }
    return 'None';
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
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-theme-darkPurple">User Management</h1>
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
              onClick={() => handleOpenDialog()}
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
                <h3 className="text-lg font-medium mb-2 text-theme-darkPurple">No users found</h3>
                <p className="text-muted-foreground">Add your first user to get started.</p>
                <Button 
                  onClick={() => handleOpenDialog()} 
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
              <CardTitle className="text-theme-darkPurple">Users</CardTitle>
              <CardDescription>
                Manage your customer accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-theme-lightBrown/20">
                    <TableHead className="text-theme-deepPurple">Name</TableHead>
                    <TableHead className="text-theme-deepPurple">CIN</TableHead>
                    <TableHead className="text-theme-deepPurple">Phone</TableHead>
                    <TableHead className="text-theme-deepPurple">Company</TableHead>
                    <TableHead className="text-theme-deepPurple">Assigned Vehicle</TableHead>
                    <TableHead className="text-right text-theme-deepPurple">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-theme-lightBrown/20 hover:bg-theme-lightBrown/5">
                      <TableCell className="font-medium text-theme-darkPurple">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell className="text-theme-darkPurple/80">{user.cin}</TableCell>
                      <TableCell className="text-theme-darkPurple/80">{user.phone}</TableCell>
                      <TableCell className="text-theme-darkPurple/80">{user.company_name}</TableCell>
                      <TableCell>
                        {user.vehicle_id ? (
                          <Badge variant="outline" className="bg-theme-lightBrown/10 text-theme-terracotta border-theme-terracotta/20 flex items-center w-fit">
                            <Car className="h-3 w-3 mr-1" />
                            {getVehiclePlate(user.vehicle_id)}
                          </Badge>
                        ) : (
                          <span className="text-gray-500 text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-theme-deepPurple hover:text-theme-darkPurple hover:bg-theme-lightBrown/10">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-theme-lightBrown/30">
                            <DropdownMenuItem 
                              onClick={() => handleOpenDialog(user)}
                              className="text-theme-deepPurple hover:text-theme-darkPurple cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(user.id)}
                              className="text-red-600 focus:text-red-600 cursor-pointer"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white border-theme-lightBrown/30">
          <DialogHeader>
            <DialogTitle className="text-theme-darkPurple">{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription className="text-theme-terracotta/70">
              {isEditing
                ? "Update the user details below."
                : "Fill in the details for the new user."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="first-name" className="text-right text-theme-deepPurple">
                  First name
                </Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="col-span-3 border-theme-lightBrown/30 focus:ring-theme-deepPurple"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="last-name" className="text-right text-theme-deepPurple">
                  Last name
                </Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="col-span-3 border-theme-lightBrown/30 focus:ring-theme-deepPurple"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cin" className="text-right text-theme-deepPurple">
                  CIN
                </Label>
                <Input
                  id="cin"
                  value={cin}
                  onChange={(e) => setCin(e.target.value)}
                  className="col-span-3 border-theme-lightBrown/30 focus:ring-theme-deepPurple"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right text-theme-deepPurple">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="col-span-3 border-theme-lightBrown/30 focus:ring-theme-deepPurple"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="company" className="text-right text-theme-deepPurple">
                  Company
                </Label>
                <Input
                  id="company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="col-span-3 border-theme-lightBrown/30 focus:ring-theme-deepPurple"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right text-theme-deepPurple">
                  Address
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="col-span-3 border-theme-lightBrown/30 focus:ring-theme-deepPurple"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vehicle" className="text-right text-theme-deepPurple">
                  Vehicle
                </Label>
                <Select 
                  value={vehicleId || "none"} 
                  onValueChange={(value) => setVehicleId(value === "none" ? null : value)}
                >
                  <SelectTrigger className="col-span-3 border-theme-lightBrown/30 focus:ring-theme-deepPurple">
                    <SelectValue placeholder="Select a vehicle (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="developer" className="text-right text-theme-deepPurple">
                  Developer
                </Label>
                <Select 
                  value={developerId || "none"} 
                  onValueChange={(value) => setDeveloperId(value === "none" ? null : value)}
                >
                  <SelectTrigger className="col-span-3 border-theme-lightBrown/30 focus:ring-theme-deepPurple">
                    <SelectValue placeholder="Assign to developer (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableDevelopers.map((developer) => (
                      <SelectItem key={developer.id} value={developer.id}>
                        {developer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit"
                className="bg-theme-deepPurple hover:bg-theme-darkPurple"
              >
                {isEditing ? 'Update User' : 'Add User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminUsers;
