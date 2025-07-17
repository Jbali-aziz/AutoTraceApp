import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Vehicle, mapVehicle, Developer } from "@/types";
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
import { Search, MoreHorizontal, Plus, Trash, Edit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VehicleMap, MultiVehicleMap } from "@/components/VehicleMap";

const AdminVehicles = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  
  // Form state
  const [plateNumber, setPlateNumber] = useState("");
  const [model, setModel] = useState("");
  const [vehicleType, setVehicleType] = useState("car");
  const [status, setStatus] = useState<'active' | 'inactive' | 'maintenance'>('active');
  const [assignedDevelopers, setAssignedDevelopers] = useState<string[]>([]);
  
  // Mode for the map view
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedVehicleForMap, setSelectedVehicleForMap] = useState<string | undefined>(undefined);
  const [selectedDeveloperForMap, setSelectedDeveloperForMap] = useState<string | undefined>(undefined);
  
  // Device name/serial for assignment
  const [deviceName, setDeviceName] = useState("");
  
  // Fetch vehicles and developers
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch vehicles
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('admin_uid', user.id);
          
        if (vehicleError) throw vehicleError;
        
        // Convert supabase data to our Vehicle type using the mapVehicle helper
        const mappedData = (vehicleData || []).map(mapVehicle);
        setVehicles(mappedData);
        setFilteredVehicles(mappedData);

        // Fetch developers
        const { data: developerData, error: developerError } = await supabase
          .from('developers')
          .select('*')
          .eq('admin_uid', user.id);
          
        if (developerError) throw developerError;
        
        setDevelopers(developerData || []);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        toast.error("Failed to load vehicles");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up real-time subscription for vehicles
    const vehiclesChannel = supabase
      .channel('vehicles_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'vehicles',
        filter: `admin_uid=eq.${user?.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newVehicle = mapVehicle(payload.new as any);
          setVehicles(prev => [...prev, newVehicle]);
          // Update filtered vehicles only if search is empty or the new vehicle matches the search
          if (searchTerm === '' || 
              newVehicle.plate_number.toLowerCase().includes(searchTerm.toLowerCase())) {
            setFilteredVehicles(prev => [...prev, newVehicle]);
          }
          toast.success("Vehicle added successfully");
        } 
        else if (payload.eventType === 'UPDATE') {
          const updatedVehicle = mapVehicle(payload.new as any);
          setVehicles(prev => 
            prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v)
          );
          setFilteredVehicles(prev => 
            prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v)
          );
          toast.success("Vehicle updated successfully");
        } 
        else if (payload.eventType === 'DELETE') {
          const deletedVehicle = payload.old as Vehicle;
          setVehicles(prev => prev.filter(v => v.id !== deletedVehicle.id));
          setFilteredVehicles(prev => prev.filter(v => v.id !== deletedVehicle.id));
          toast.success("Vehicle deleted successfully");
        }
      })
      .subscribe();
      
    // Set up subscription for developers changes (for vehicle assignments)
    const developersChannel = supabase
      .channel('developers_changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'developers',
        filter: `admin_uid=eq.${user?.id}`
      }, (payload) => {
        // Update developers list when assignments change
        setDevelopers(prev => 
          prev.map(d => d.id === payload.new.id ? {...d, ...payload.new} : d)
        );
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(vehiclesChannel);
      supabase.removeChannel(developersChannel);
    };
  }, [user, searchTerm]);
  
  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredVehicles(vehicles);
    } else {
      const lowerCaseSearch = searchTerm.toLowerCase();
      setFilteredVehicles(
        vehicles.filter((vehicle) => 
          vehicle.plate_number.toLowerCase().includes(lowerCaseSearch) ||
          vehicle.status.toLowerCase().includes(lowerCaseSearch)
        )
      );
    }
  }, [searchTerm, vehicles]);
  
  // Set form values when editing
  useEffect(() => {
    if (isEditing && selectedVehicle) {
      setPlateNumber(selectedVehicle.plate_number);
      setModel(selectedVehicle.model || "");
      setVehicleType(selectedVehicle.type || "car");
      setStatus(selectedVehicle.status);
      
      // Get assigned developers for this vehicle
      const assigned = developers
        .filter(d => d.assigned_vehicle_ids?.includes(selectedVehicle.id))
        .map(d => d.id);
      
      setAssignedDevelopers(assigned);
    } else {
      resetForm();
    }
  }, [isEditing, selectedVehicle, developers]);
  
  // Reset the form
  const resetForm = () => {
    setPlateNumber("");
    setModel("");
    setVehicleType("car");
    setStatus('active');
    setAssignedDevelopers([]);
    setDeviceName("");
  };
  
  // Dialog open/close handlers
  const handleOpenDialog = (vehicle?: Vehicle) => {
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setIsEditing(true);
    } else {
      setSelectedVehicle(null);
      setIsEditing(false);
      resetForm();
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
    
    try {
      if (isEditing && selectedVehicle) {
        // Update existing vehicle
        const { error } = await supabase
          .from('vehicles')
          .update({
            plate_number: plateNumber,
            model: model,
            type: vehicleType,
            status,
          })
          .eq('id', selectedVehicle.id);
          
        if (error) throw error;
        
        // Real-time will handle the UI update
      } else {
        // Create new vehicle
        const vehicleId = crypto.randomUUID();
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .insert({
            id: vehicleId,
            plate_number: plateNumber,
            model: model,
            type: vehicleType,
            status,
            admin_uid: user.id
          });
        if (vehicleError) throw vehicleError;

        // Create device and assign to vehicle
        if (deviceName) {
          const { error: deviceError } = await supabase
            .from('devices')
            .insert({
              id: deviceName, // use input as device id
              vehicle_id: vehicleId
            });
          if (deviceError) throw deviceError;
        }

        // Real-time will handle the UI update
      }
      
      // For editing, update developer assignments
      if (isEditing && selectedVehicle) {
        await updateDeveloperAssignments(selectedVehicle.id);
      }
      // If this is a new vehicle and developers are assigned, update them
      else if (assignedDevelopers.length > 0) {
        // First need to get the new vehicle's ID
        const { data: newVehicle } = await supabase
          .from('vehicles')
          .select('id')
          .eq('plate_number', plateNumber)
          .eq('admin_uid', user.id)
          .single();
          
        if (newVehicle) {
          await updateDeveloperAssignments(newVehicle.id);
        }
      }
      
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving vehicle:", error);
      toast.error("Failed to save vehicle");
    }
  };
  
  // Update developer assignments for a vehicle
  const updateDeveloperAssignments = async (vehicleId: string) => {
    try {
      // For each developer
      for (const developer of developers) {
        const hasVehicle = developer.assigned_vehicle_ids?.includes(vehicleId);
        const shouldHaveVehicle = assignedDevelopers.includes(developer.id);
        
        if (hasVehicle && !shouldHaveVehicle) {
          // Remove vehicle from developer
          const updatedIds = (developer.assigned_vehicle_ids || []).filter(id => id !== vehicleId);
          await supabase
            .from('developers')
            .update({ assigned_vehicle_ids: updatedIds })
            .eq('id', developer.id);
        } else if (!hasVehicle && shouldHaveVehicle) {
          // Add vehicle to developer
          const updatedIds = [...(developer.assigned_vehicle_ids || []), vehicleId];
          await supabase
            .from('developers')
            .update({ assigned_vehicle_ids: updatedIds })
            .eq('id', developer.id);
        }
      }
    } catch (error) {
      console.error("Error updating developer assignments:", error);
      toast.error("Failed to update developer assignments");
    }
  };
  
  // Handle delete
  const handleDelete = async (vehicleId: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) {
      return;
    }

    try {
      // Remove vehicle from all developers first
      for (const developer of developers) {
        if (developer.assigned_vehicle_ids?.includes(vehicleId)) {
          const updatedIds = developer.assigned_vehicle_ids.filter(id => id !== vehicleId);
          await supabase
            .from('developers')
            .update({ assigned_vehicle_ids: updatedIds })
            .eq('id', developer.id);
        }
      }

      // Delete all devices associated with this vehicle
      const { error: deviceDeleteError } = await supabase
        .from('devices')
        .delete()
        .eq('vehicle_id', vehicleId);
      if (deviceDeleteError) throw deviceDeleteError;

      // Delete the vehicle
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);
      if (error) throw error;

      // Real-time will handle the UI update
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast.error("Failed to delete vehicle");
    }
  };
  
  // Open map view for a specific vehicle
  const handleOpenMap = (vehicleId: string) => {
    setSelectedVehicleForMap(vehicleId);
    setMapDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Vehicle Management</h1>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search vehicles..."
                className="w-full sm:w-[250px] pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground py-8">Loading...</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Vehicles</CardTitle>
              <CardDescription>
                Manage your company vehicles and their assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plate Number</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => {
                    // Find developers assigned to this vehicle
                    const assignedDevs = developers.filter(
                      (dev) => dev.assigned_vehicle_ids?.includes(vehicle.id)
                    );
                    
                    return (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">{vehicle.plate_number}</TableCell>
                        <TableCell>{vehicle.model || "—"}</TableCell>
                        <TableCell>{vehicle.vehicle_type || "Car"}</TableCell>
                        <TableCell>
                          <Badge className={
                            vehicle.status === 'active' ? 'bg-green-500' :
                            vehicle.status === 'maintenance' ? 'bg-amber-500' :
                            'bg-red-500'
                          }>
                            {vehicle.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto"
                            onClick={() => handleOpenMap(vehicle.id)}
                          >
                            View Map
                          </Button>
                        </TableCell>
                        <TableCell>
                          {assignedDevs.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {assignedDevs.map((dev) => (
                                <Badge key={dev.id} variant="outline" className="bg-gray-100">
                                  {dev.first_name} {dev.last_name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">Not assigned</span>
                          )}
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
                              <DropdownMenuItem onClick={() => handleOpenDialog(vehicle)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(vehicle.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Vehicle Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the vehicle details below."
                : "Fill in the details for the new vehicle."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="plate-number" className="text-right">
                  Plate Number
                </Label>
                <Input
                  id="plate-number"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="model" className="text-right">
                  Model
                </Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select 
                  value={vehicleType} 
                  onValueChange={(value) => setVehicleType(value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="device-name" className="text-right">
                  Device ID (serial)
                </Label>
                <Input
                  id="device-name"
                  value={deviceName}
                  onChange={e => setDeviceName(e.target.value)}
                  className="col-span-3"
                  placeholder="Device ID (serial)"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select 
                  value={status} 
                  onValueChange={(value) => setStatus(value as 'active' | 'inactive' | 'maintenance')}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {developers.length > 0 && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">Assign To</Label>
                  <div className="col-span-3">
                    <Select
                      value={assignedDevelopers.length > 0 ? assignedDevelopers[0] : ""}
                      onValueChange={(value) => {
                        if (value) {
                          setAssignedDevelopers([value]);
                        } else {
                          setAssignedDevelopers([]);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a developer" />
                      </SelectTrigger>
                      <SelectContent>
                        {developers.map(developer => (
                          <SelectItem key={developer.id} value={developer.id}>
                            {developer.first_name} {developer.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit">{isEditing ? 'Update Vehicle' : 'Add Vehicle'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Map Dialog */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vehicle Location</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <label htmlFor="dev-map-select" className="block font-medium mb-1">Show vehicles for developer:</label>
            <select
              id="dev-map-select"
              className="border rounded px-2 py-1 w-full"
              value={selectedDeveloperForMap || ''}
              onChange={e => setSelectedDeveloperForMap(e.target.value || undefined)}
            >
              <option value="">All Developers</option>
              {developers.map(dev => (
                <option key={dev.id} value={dev.id}>
                  {dev.first_name} {dev.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="h-[500px]">
            <MultiVehicleMap
              vehicles={
                selectedDeveloperForMap
                  ? vehicles.filter(v => developers.find(dev => dev.id === selectedDeveloperForMap)?.assigned_vehicle_ids?.includes(v.id))
                  : vehicles
              }
              selectedVehicleId={selectedVehicleForMap}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminVehicles;
