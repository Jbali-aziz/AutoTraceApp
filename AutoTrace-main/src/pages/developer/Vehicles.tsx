import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Vehicle, Location } from "@/types";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Map as MapIcon } from "lucide-react";
import { VehicleMap, MultiVehicleMap } from "@/components/VehicleMap";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DeveloperVehicles = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [latestPositions, setLatestPositions] = useState<any[]>([]);
  // Removed loading state as per requirements

  // Fetch vehicles assigned to this developer
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!user) return;
      try {
        // First get the developer record to get assigned vehicle IDs
        const { data: developerData, error: developerError } = await supabase
          .from('developers')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (developerError) throw developerError;
        
        if (developerData && developerData.assigned_vehicle_ids?.length > 0) {
          const { assigned_vehicle_ids } = developerData;
          
          // Fetch assigned vehicles
          const { data: vehicleData, error: vehicleError } = await supabase
            .from('vehicles')
            .select('*')
            .in('id', assigned_vehicle_ids);
            
          if (vehicleError) throw vehicleError;
          
          // Convert raw data to Vehicle type
          const mappedVehicles: Vehicle[] = (vehicleData || []).map((vehicle: any) => ({
            id: vehicle.id,
            plate_number: vehicle.plate_number,
            status: vehicle.status as 'active' | 'inactive' | 'maintenance',
            admin_uid: vehicle.admin_uid,
            model: vehicle.model,
            type: vehicle.type || 'car',
            assigned_devices: vehicle.assigned_devices || [],
          }));
          
          // For each vehicle, get the latest position from vehicle_positions via devices
          for (const vehicle of mappedVehicles) {
            try {
              // Get device ID for this vehicle
              const { data: deviceData } = await supabase
                .from('devices')
                .select('id')
                .eq('vehicle_id', vehicle.id);
                
              if (deviceData && deviceData.length > 0) {
                const deviceIds = deviceData.map((d: any) => d.id);
                
                // Get latest position for this device
                const { data: posData } = await supabase
                  .from('vehicle_positions')
                  .select('*')
                  .in('device_id', deviceIds)
                  .order('created_at', { ascending: false })
                  .limit(1);
                  
                if (posData && posData.length > 0) {
                  // Add current location to the vehicle
                  const latestPos = posData[0];
                  vehicle.current_location = {
                    lat: latestPos.latitude,
                    lng: latestPos.longitude,
                    timestamp: latestPos.created_at
                  };
                }
              }
            } catch (error) {
              console.error(`Failed to fetch position for vehicle ${vehicle.id}:`, error);
            }
          }
          
          setVehicles(mappedVehicles);
          setFilteredVehicles(mappedVehicles);
        } else {
          setVehicles([]);
          setFilteredVehicles([]);
        }
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        toast.error("Failed to load vehicles");
      } finally {
        // Removed loading state as per requirements
      }
    };
    
    fetchVehicles();
    // Fetch once on mount or when user changes
    fetchVehicles();

    // Fetch data when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchVehicles();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };

    
    // Set up real-time subscription for vehicle_positions
    const positionsSubscription = supabase
      .channel('vehicle_positions_channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'vehicle_positions' }, 
        async (payload) => {
          try {
            const newPosition = payload.new as any;
            
            // Find which vehicle this belongs to
            const { data: deviceData } = await supabase
              .from('devices')
              .select('vehicle_id')
              .eq('id', newPosition.device_id)
              .single();
              
            if (deviceData) {
              const vehicleId = deviceData.vehicle_id;
              
              // Update vehicle's current location
              setVehicles(prev => 
                prev.map(vehicle => 
                  vehicle.id === vehicleId 
                    ? {
                        ...vehicle,
                        current_location: {
                          lat: newPosition.latitude,
                          lng: newPosition.longitude,
                          timestamp: newPosition.created_at
                        }
                      } 
                    : vehicle
                )
              );
              
              setFilteredVehicles(prev => 
                prev.map(vehicle => 
                  vehicle.id === vehicleId 
                    ? {
                        ...vehicle,
                        current_location: {
                          lat: newPosition.latitude,
                          lng: newPosition.longitude,
                          timestamp: newPosition.created_at
                        }
                      } 
                    : vehicle
                )
              );
              
              // If this is for the selected vehicle, update position data
              if (selectedVehicle && selectedVehicle.id === vehicleId) {
                setLatestPositions(prev => [newPosition, ...prev].slice(0, 10));
              }
            }
          } catch (error) {
            console.error("Error processing position update:", error);
          }
        }
      )
      .subscribe();
      
    // Cleanup subscription
    return () => {
      positionsSubscription.unsubscribe();
    };
  }, [user]);
  
  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredVehicles(vehicles);
    } else {
      const lowerCaseSearch = searchTerm.toLowerCase();
      setFilteredVehicles(
        vehicles.filter((vehicle) => 
          vehicle.plate_number.toLowerCase().includes(lowerCaseSearch) ||
          vehicle.status.toLowerCase().includes(lowerCaseSearch) ||
          (vehicle.model && vehicle.model.toLowerCase().includes(lowerCaseSearch)) ||
          (vehicle.type && vehicle.type.toLowerCase().includes(lowerCaseSearch))
        )
      );
    }
  }, [searchTerm, vehicles]);
  
  // Update selected vehicle when selected ID changes
  useEffect(() => {
    const fetchPositions = async (vehicleId: string) => {
      // 1. Get device(s) for this vehicle
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select('id')
        .eq('vehicle_id', vehicleId);
      if (deviceError || !deviceData || deviceData.length === 0) {
        setLatestPositions([]);
        return;
      }
      const deviceIds = deviceData.map((d: any) => d.id);
      // 2. Get latest positions for these device(s)
      const { data: posData, error: posError } = await supabase
        .from('vehicle_positions')
        .select('*')
        .in('device_id', deviceIds)
        .order('created_at', { ascending: false })
        .limit(10);
      if (posError || !posData) {
        setLatestPositions([]);
        return;
      }
      setLatestPositions(posData);
    };

    if (selectedVehicleId) {
      const vehicle = vehicles.find(v => v.id === selectedVehicleId) || null;
      setSelectedVehicle(vehicle);
      if (vehicle) fetchPositions(vehicle.id);
      else setLatestPositions([]);
    } else {
      setSelectedVehicle(null);
      setLatestPositions([]);
    }
  }, [selectedVehicleId, vehicles]);
  
  const handleVehicleSelect = (id: string) => {
    setSelectedVehicleId(id);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Handle view on map click, including handling inactive tabs
  const handleViewOnMap = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    
    // Get the map tab element and check if it's inactive
    const mapTab = document.querySelector('[value="map"]') as HTMLElement;
    if (mapTab && mapTab.getAttribute('data-state') === 'inactive') {
      // Trigger a click on the map tab
      mapTab.click();
    }
  };
  

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Your Assigned Vehicles</h1>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search vehicles..."
            className="w-full sm:w-[250px] pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground py-8">No vehicles are currently assigned to you.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="map">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="map">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-[80vh]">
                <MultiVehicleMap
                  vehicles={filteredVehicles}
                  selectedVehicleId={selectedVehicleId}
                  onVehicleSelect={handleVehicleSelect}
                />
              </div>
              <div>
                {selectedVehicle ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedVehicle.plate_number}</CardTitle>
                      <CardDescription>Vehicle Details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Status</span>
                          <Badge className={
                            selectedVehicle.status === 'active' ? 'bg-green-500' :
                            selectedVehicle.status === 'maintenance' ? 'bg-amber-500' :
                            'bg-red-500'
                          }>
                            {selectedVehicle.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">Latest Position</span>
                          <span>
                            {latestPositions[0] ? `${latestPositions[0].latitude.toFixed(6)}, ${latestPositions[0].longitude.toFixed(6)}` : 'N/A'}
                          </span>
                        </div>
                        {latestPositions[0] && (
                          <div className="space-y-1 text-xs text-gray-700 mb-2">
                            <div><span className="font-medium">Latitude:</span> {latestPositions[0].latitude}</div>
                            <div><span className="font-medium">Longitude:</span> {latestPositions[0].longitude}</div>
                            <div><span className="font-medium">Speed:</span> {latestPositions[0].speed ?? 'N/A'}</div>
                            <div><span className="font-medium">Accel X:</span> {latestPositions[0].accel_x ?? 'N/A'}</div>
                            <div><span className="font-medium">Accel Y:</span> {latestPositions[0].accel_y ?? 'N/A'}</div>
                            <div><span className="font-medium">Accel Z:</span> {latestPositions[0].accel_z ?? 'N/A'}</div>
                            <div><span className="font-medium">Pitch:</span> {latestPositions[0].pitch ?? 'N/A'}</div>
                            <div><span className="font-medium">Roll:</span> {latestPositions[0].roll ?? 'N/A'}</div>
                            <div><span className="font-medium">Timestamp:</span> {formatDate(latestPositions[0].created_at)}</div>
                          </div>
                        )}
                        <h4 className="font-medium mt-4 mb-2">Recent Positions</h4>
                        <div className="max-h-[300px] overflow-y-auto border rounded-md p-3">
                          {latestPositions.length > 0 ? (
                            <div className="space-y-2">
                              {latestPositions.map((pos, index) => (
                                <div key={pos.id} className="text-sm pb-2 border-b last:border-0">
                                  <div className="flex justify-between">
                                    <span className="font-medium">{index + 1}.</span>
                                    <span className="text-gray-500">{formatDate(pos.created_at)}</span>
                                  </div>
                                  <div className="mt-1">
                                    Lat: {pos.latitude.toFixed(6)}, Lng: {pos.longitude.toFixed(6)}<br />
                                    Speed: {pos.speed ?? 'N/A'}, Accel: [{pos.accel_x ?? 'N/A'}, {pos.accel_y ?? 'N/A'}, {pos.accel_z ?? 'N/A'}], Pitch: {pos.pitch ?? 'N/A'}, Roll: {pos.roll ?? 'N/A'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-gray-500 py-4">No recent positions available</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Select a vehicle on the map to view details</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Vehicles ({filteredVehicles.length})</CardTitle>
                <CardDescription>
                  List of all vehicles assigned to you
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
                      <TableHead>Current Location</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">
                          {vehicle.plate_number}
                        </TableCell>
                        <TableCell>
                          {vehicle.model || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {vehicle.type || 'N/A'}
                        </TableCell>
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
                          {vehicle.current_location ? (
                            `${vehicle.current_location.lat.toFixed(6)}, 
                            ${vehicle.current_location.lng.toFixed(6)}`
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          {vehicle.current_location && vehicle.current_location.timestamp
                            ? formatDate(vehicle.current_location.timestamp)
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewOnMap(vehicle.id)}
                          >
                            View on Map
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default DeveloperVehicles;
