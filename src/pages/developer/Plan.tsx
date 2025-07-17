
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Vehicle, mapVehicle } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Car, AlertTriangle } from "lucide-react";
import { MultiVehicleMap } from "@/components/VehicleMap";

const DeveloperPlan = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  
  // In a real application, this would come from the user's profile in Supabase
  const currentPlan = {
    name: "Professional",
    price: 29.99,
    billingPeriod: "monthly",
    renewalDate: "2025-06-12",
    status: "active",
    features: [
      "50 vehicles",
      "Priority support",
      "Advanced analytics",
      "API access"
    ]
  };
  
  const availablePlans = [
    {
      id: 1,
      name: "Basic",
      price: 9.99,
      features: ["10 vehicles", "Standard support", "Basic analytics"],
      isPopular: false,
    },
    {
      id: 2,
      name: "Professional",
      price: 29.99,
      features: ["50 vehicles", "Priority support", "Advanced analytics", "API access"],
      isPopular: true,
      current: true,
    },
    {
      id: 3,
      name: "Enterprise",
      price: 99.99,
      features: ["Unlimited vehicles", "24/7 support", "Custom analytics", "API access", "White labeling"],
      isPopular: false,
    },
  ];
  
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!user) return;
      setLoading(true);
      
      try {
        // Fetch vehicles associated with this developer
        const { data: developerData, error: developerError } = await supabase
          .from('developers')
          .select('assigned_vehicle_ids')
          .eq('id', user.id)
          .single();
          
        if (developerError) throw developerError;
        
        if (developerData?.assigned_vehicle_ids?.length) {
          // Fetch the actual vehicles
          const { data: vehicleData, error: vehicleError } = await supabase
            .from('vehicles')
            .select('*')
            .in('id', developerData.assigned_vehicle_ids);
            
          if (vehicleError) throw vehicleError;
          
          setVehicles(vehicleData?.map(mapVehicle) || []);
        }
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
    
    // Set up real-time subscription for vehicles
    const vehicleChannel = supabase
      .channel('vehicles_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'vehicles' 
      }, async (payload) => {
        // Refetch vehicles when there are changes
        fetchVehicles();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(vehicleChannel);
    };
  }, [user]);
  
  // For the map, ensure we have correctly typed vehicles
  const sampleVehicles: Vehicle[] = [
    {
      id: "sample-1",
      plate_number: "ABC123",
      status: "active",
      admin_uid: "",
      type: "car",
      model: "Sample Car",
      current_location: { lat: 37.7749, lng: -122.4194 }
    },
    {
      id: "sample-2",
      plate_number: "DEF456",
      status: "active",
      admin_uid: "",
      type: "car",
      model: "Sample Car",
      current_location: { lat: 37.7809, lng: -122.4129 }
    },
    {
      id: "sample-3",
      plate_number: "GHI789",
      status: "inactive",
      admin_uid: "",
      type: "car",
      model: "Sample Car",
      current_location: { lat: 37.7700, lng: -122.4260 }
    }
  ];
  
  // Use real vehicles if available, otherwise use sample data
  const displayVehicles: Vehicle[] = vehicles.length > 0 ? vehicles : sampleVehicles;
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Plan Overview</h1>
      
      <Card className="mb-8 border-fleet-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Current Plan: {currentPlan.name}
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {currentPlan.status.toUpperCase()}
            </Badge>
          </CardTitle>
          <CardDescription>
            <span className="text-2xl font-bold">${currentPlan.price}</span>/month
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Next billing date</p>
                <p>{currentPlan.renewalDate}</p>
              </div>
              
              <div>
                <p className="font-medium mb-2">Plan Features:</p>
                <ul className="space-y-2">
                  {currentPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <ShieldCheck className="h-5 w-5 text-fleet-500 mr-2 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="h-[200px] rounded-lg border overflow-hidden">
              <div className="h-full w-full">
                <MultiVehicleMap vehicles={displayVehicles} />
              </div>
              <div className="text-center text-xs text-muted-foreground mt-2">
                {loading ? "Loading vehicles..." : 
                  vehicles.length > 0 ? "Your current fleet vehicles" : 
                  "Sample fleet visualization with your current plan capacity"}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel Subscription</Button>
          <Button>Manage Billing</Button>
        </CardFooter>
      </Card>
      
      <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {availablePlans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`${plan.isPopular ? "border-fleet-500 shadow-lg" : ""} ${plan.current ? "bg-gray-50" : ""}`}
          >
            {plan.isPopular && (
              <div className="bg-fleet-500 text-white text-center py-1 text-sm">
                MOST POPULAR
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-2xl font-bold">${plan.price}</span>/month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <ShieldCheck className="h-5 w-5 text-fleet-500 mr-2 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={plan.current ? "secondary" : plan.isPopular ? "default" : "outline"}
                disabled={plan.current}
              >
                {plan.current ? "Current Plan" : "Switch to Plan"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DeveloperPlan;
