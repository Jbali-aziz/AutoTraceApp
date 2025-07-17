import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Developer, mapDeveloper } from "@/types";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, MoreHorizontal, Plus, Trash, Edit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminDevelopers = () => {
  const { user } = useAuth();
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [filteredDevelopers, setFilteredDevelopers] = useState<Developer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cin, setCin] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  
  // Fetch developers
  useEffect(() => {
    const fetchDevelopers = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('developers')
          .select('*')
          .eq('admin_uid', user.id);
        if (error) throw error;
        const mappedDevelopers = (data || []).map(mapDeveloper);
        setDevelopers(mappedDevelopers);
        setFilteredDevelopers(mappedDevelopers);
      } catch (error) {
        console.error("Error fetching developers:", error);
        toast.error("Failed to load developers");
      } finally {
        setLoading(false);
      }
    };

    fetchDevelopers();

    // Set up subscription for real-time updates
    const developersChannel = supabase
      .channel('developers_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'developers',
        filter: `admin_uid=eq.${user?.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newDev = mapDeveloper(payload.new as any);
          setDevelopers(prev => [...prev, newDev]);
          // Update filtered developers only if search is empty or the new dev matches the search
          if (searchTerm === '' || 
              newDev.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              newDev.last_name.toLowerCase().includes(searchTerm.toLowerCase())) {
            setFilteredDevelopers(prev => [...prev, newDev]);
          }
          toast.success("New developer added");
        } 
        else if (payload.eventType === 'UPDATE') {
          const updatedDev = mapDeveloper(payload.new as any);
          setDevelopers(prev => 
            prev.map(d => d.id === updatedDev.id ? updatedDev : d)
          );
          setFilteredDevelopers(prev => 
            prev.map(d => d.id === updatedDev.id ? updatedDev : d)
          );
          toast.success("Developer updated");
        } 
        else if (payload.eventType === 'DELETE') {
          const deletedDev = payload.old as Developer;
          setDevelopers(prev => prev.filter(d => d.id !== deletedDev.id));
          setFilteredDevelopers(prev => prev.filter(d => d.id !== deletedDev.id));
          toast.success("Developer deleted");
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(developersChannel);
    };
  }, [user, searchTerm]);
  
  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredDevelopers(developers);
    } else {
      const lowerCaseSearch = searchTerm.toLowerCase();
      setFilteredDevelopers(
        developers.filter((developer) => 
          developer.first_name.toLowerCase().includes(lowerCaseSearch) ||
          developer.last_name.toLowerCase().includes(lowerCaseSearch) ||
          developer.email.toLowerCase().includes(lowerCaseSearch) ||
          developer.company_name.toLowerCase().includes(lowerCaseSearch)
        )
      );
    }
  }, [searchTerm, developers]);
  
  // Set form values when editing
  useEffect(() => {
    if (isEditing && selectedDeveloper) {
      setFirstName(selectedDeveloper.first_name);
      setLastName(selectedDeveloper.last_name);
      setEmail(selectedDeveloper.email);
      setPassword(""); // Don't populate password for security
      setCin(selectedDeveloper.cin);
      setPhone(selectedDeveloper.phone);
      setCompanyName(selectedDeveloper.company_name);
      setAddress(selectedDeveloper.address);
    } else {
      // Reset form for new developer
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setCin("");
      setPhone("");
      setCompanyName("");
      setAddress("");
    }
  }, [isEditing, selectedDeveloper]);
  
  // Dialog open/close handlers
  const handleOpenDialog = (developer?: Developer) => {
    if (developer) {
      setSelectedDeveloper(developer);
      setIsEditing(true);
    } else {
      setSelectedDeveloper(null);
      setIsEditing(false);
      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setCin("");
      setPhone("");
      setCompanyName("");
      setAddress("");
    }
    setDialogOpen(true);
  };
  
  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to perform this action");
      return;
    }
    
    setSubmitting(true);
    try {
      if (isEditing && selectedDeveloper) {
        // Update existing developer
        const updates = {
          first_name: firstName,
          last_name: lastName,
          email: email,
          cin: cin,
          phone: phone,
          company_name: companyName,
          address: address,
        };
        
        const { error } = await supabase
          .from('developers')
          .update(updates)
          .eq('id', selectedDeveloper.id);
          
        if (error) throw error;
        
        // Real-time will handle the UI update
        setDialogOpen(false);
      } else {
        // Create a new user through sign-up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              role: 'developer'
            }
          }
        });
        
        if (signUpError) throw signUpError;
        
        if (!signUpData.user) {
          throw new Error("Failed to create user account");
        }
        
        // Create developer record in the developers table
        const { error: devError } = await supabase
          .from('developers')
          .insert({
            id: signUpData.user.id,
            first_name: firstName,
            last_name: lastName,
            email: email,
            cin: cin,
            phone: phone,
            company_name: companyName,
            address: address,
            admin_uid: user.id,
            assigned_vehicle_ids: [],
            assigned_user_ids: []
          });
        
        if (devError) throw devError;
        
        // Real-time will handle the UI update
        setDialogOpen(false);
      }
    } catch (error: any) {
      console.error("Error saving developer:", error);
      toast.error("Failed to save developer", { 
        description: error.message 
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle delete
  const handleDelete = async (developerId: string) => {
    if (!confirm("Are you sure you want to delete this developer?")) {
      return;
    }
    
    try {
      // Delete the developer record
      const { error } = await supabase
        .from('developers')
        .delete()
        .eq('id', developerId);
        
      if (error) throw error;
      
      // Real-time will handle the UI update
    } catch (error) {
      console.error("Error deleting developer:", error);
      toast.error("Failed to delete developer");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading developers...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Developer Management</h1>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search developers..."
                className="w-full sm:w-[250px] pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Developer
            </Button>
          </div>
        </div>

        {developers.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground py-8">No developers found. Add your first developer to get started.</p>
              <Button onClick={() => handleOpenDialog()} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Developer
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Developers</CardTitle>
              <CardDescription>
                Manage your development team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Assigned Vehicles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevelopers.map((developer) => (
                    <TableRow key={developer.id}>
                      <TableCell className="font-medium">
                        {developer.first_name} {developer.last_name}
                      </TableCell>
                      <TableCell>{developer.email}</TableCell>
                      <TableCell>{developer.phone}</TableCell>
                      <TableCell>{developer.company_name}</TableCell>
                      <TableCell>
                        {developer.assigned_vehicle_ids?.length || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(developer)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(developer.id)}
                              className="text-red-600 focus:text-red-600"
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

      {/* Developer Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Developer' : 'Add New Developer'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the developer details below."
                : "Fill in the details for the new developer."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isEditing}
                  className="col-span-3"
                  required
                />
              </div>
              
              {!isEditing && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="col-span-3"
                    required={!isEditing}
                  />
                </div>
              )}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="first-name" className="text-right">
                  First name
                </Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="last-name" className="text-right">
                  Last name
                </Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cin" className="text-right">
                  CIN
                </Label>
                <Input
                  id="cin"
                  value={cin}
                  onChange={(e) => setCin(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="company" className="text-right">
                  Company
                </Label>
                <Input
                  id="company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Address
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Processing...' : isEditing ? 'Update Developer' : 'Add Developer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminDevelopers;
