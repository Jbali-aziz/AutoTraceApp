
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase"; 
import { Vehicle, Alert, mapVehicle, mapAlert } from "@/types";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleMap, MultiVehicleMap } from "@/components/VehicleMap";
import { Badge } from "@/components/ui/badge";
import { Car, AlertTriangle, BadgeCheck, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined);
  const [devCount, setDevCount] = useState<number>(0);
  const [userCount, setUserCount] = useState<number>(0);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch vehicles managed by this admin
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('admin_uid', user.id);
          
        if (vehicleError) throw vehicleError;
        
        const mappedVehicles = (vehicleData || []).map(mapVehicle);
        
        // For each vehicle, fetch its latest position
        for (const vehicle of mappedVehicles) {
          try {
            // Get device IDs for this vehicle
            const { data: deviceData } = await supabase
              .from('devices')
              .select('id')
              .eq('vehicle_id', vehicle.id);
              
            if (deviceData && deviceData.length > 0) {
              const deviceIds = deviceData.map((d: any) => d.id);
              
              // Get latest position for these devices
              const { data: posData } = await supabase
                .from('vehicle_positions')
                .select('*')
                .in('device_id', deviceIds)
                .order('created_at', { ascending: false })
                .limit(1);
                
              if (posData && posData.length > 0) {
                // Add current location to the vehicle
                vehicle.current_location = {
                  lat: posData[0].latitude,
                  lng: posData[0].longitude,
                  timestamp: posData[0].created_at
                };
              }
            }
          } catch (err) {
            console.error(`Error fetching position for vehicle ${vehicle.id}:`, err);
          }
        }
        
        setVehicles(mappedVehicles);
        
        // Fetch developers for this admin
        const { data: devData, error: devError } = await supabase
          .from('developers')
          .select('id')
          .eq('admin_uid', user.id);
        if (devError) throw devError;
        setDevCount(devData ? devData.length : 0);

        // Fetch users for this admin
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('admin_uid', user.id);
        if (userError) throw userError;
        setUserCount(userData ? userData.length : 0);

        // Fetch alerts for vehicles managed by this admin
        const { data: alertData, error: alertError } = await supabase
          .from('alerts')
          .select('*')
          .in('vehicle_id', mappedVehicles.map(v => v.id));
          
        if (alertError) throw alertError;
        
        // Map the alerts data using our helper function
        const mappedAlerts = (alertData || []).map(mapAlert);
        setAlerts(mappedAlerts);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up subscription for real-time updates on vehicles
    const vehiclesSubscription = supabase
      .channel('vehicles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const vehicle = mapVehicle(payload.new);
          setVehicles(prev => {
            const exists = prev.find(v => v.id === vehicle.id);
            if (exists) {
              return prev.map(v => v.id === vehicle.id ? vehicle : v);
            } else {
              return [...prev, vehicle];
            }
          });
        }
      })
      .subscribe();
      
    // Set up subscription for real-time updates on vehicle positions
    const positionsSubscription = supabase
      .channel('positions_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vehicle_positions' }, async (payload) => {
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
          }
        } catch (error) {
          console.error("Error processing position update:", error);
        }
      })
      .subscribe();
      
    // Set up subscription for real-time updates on alerts
    const alertsSubscription = supabase
      .channel('alerts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const alert = mapAlert(payload.new);
          setAlerts(prev => [...prev, alert]);
        }
      })
      .subscribe();
    
    // Cleanup subscriptions
    return () => {
      vehiclesSubscription.unsubscribe();
      alertsSubscription.unsubscribe();
      positionsSubscription.unsubscribe();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 p-4 bg-background rounded-xl shadow-md">
        <Car className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">Full control and overview of your fleet, users, and developers</p>
        </div>
      </div>

      {/* Admin Stat Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 flex flex-col items-center">
            <Car className="h-6 w-6 text-primary mb-2" />
            <div className="font-medium">Total Vehicles</div>
            <div className="text-3xl font-bold">{vehicles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center">
            <BadgeCheck className="h-6 w-6 text-blue-600 mb-2" />
            <div className="font-medium">Developers</div>
            <div className="text-3xl font-bold text-blue-700">{devCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center">
            <Users className="h-6 w-6 text-purple-600 mb-2" />
            <div className="font-medium">Users</div>
            <div className="text-3xl font-bold text-purple-700">{userCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fleet Summary</CardTitle>
          <CardDescription>
            Overview of your entire vehicle fleet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg bg-accent/40 flex flex-col items-center shadow-sm">
              <Car className="h-6 w-6 text-primary mb-2" />
              <div className="font-medium">Total Vehicles</div>
              <div className="text-3xl font-bold">{vehicles.length}</div>
            </div>
            <div className="p-6 rounded-lg bg-green-100 flex flex-col items-center shadow-sm">
              <Car className="h-6 w-6 text-green-600 mb-2" />
              <div className="font-medium">Active Vehicles</div>
              <div className="text-3xl font-bold text-green-700">
                {vehicles.filter((vehicle) => vehicle.status === 'active').length}
              </div>
            </div>
            <div className="p-6 rounded-lg bg-red-100 flex flex-col items-center shadow-sm">
              <Car className="h-6 w-6 text-red-600 mb-2" />
              <div className="font-medium">Inactive Vehicles</div>
              <div className="text-3xl font-bold text-red-700">
                {vehicles.filter((vehicle) => vehicle.status === 'inactive').length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map + Vehicle List section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-2">
        {/* Map and vehicle list side by side on desktop */}
        <div className="md:col-span-2 flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-[70%]">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle>Fleet Map</CardTitle>
                <CardDescription>
                  All vehicles visualized on a single map
                </CardDescription>
              </CardHeader>
              <CardContent>
                {vehicles.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No vehicles found.</p>
                  </div>
                ) : (
                  <div className="h-[350px] w-full rounded-lg border overflow-hidden">
                    <MultiVehicleMap 
                      vehicles={vehicles}
                      selectedVehicleId={selectedVehicleId}
                      onVehicleSelect={setSelectedVehicleId}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Vehicle List */}
          <div className="w-full md:w-[35%]">
            <Card className="h-[350px] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-base">Vehicles</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {vehicles.map(vehicle => (
                    <li
                      key={vehicle.id}
                      className={`px-4 py-3 cursor-pointer flex items-center gap-2 hover:bg-accent/40 transition-colors ${selectedVehicleId === vehicle.id ? 'bg-primary/10 font-semibold' : ''}`}
                      onClick={() => setSelectedVehicleId(vehicle.id)}
                      title={`Focus map on ${vehicle.plate_number}`}
                    >
                      <Car className="h-4 w-4 text-primary" />
                      <span>{vehicle.plate_number}</span>
                      <Badge
                        variant={vehicle.status === 'active' ? 'default' : 'secondary'}
                        className={`ml-auto ${vehicle.status === 'active' ? 'bg-green-100 text-green-700 border-green-300' : ''}`}
                      >
                        {vehicle.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
