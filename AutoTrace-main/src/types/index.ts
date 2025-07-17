
import { Json } from "@/integrations/supabase/types";

export type UserRole = 'admin' | 'developer' | 'unassigned';

export interface Location {
  lat: number;
  lng: number;
  timestamp?: string;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  status: 'active' | 'inactive' | 'maintenance';
  current_location?: Location;
  history?: Location[];
  admin_uid: string;
  model?: string;
  type?: string;
  vehicle_type?: string;
  assigned_devices?: string[];
}

export interface Alert {
  id: string;
  vehicle_id: string;
  type: 'speeding' | 'geofence' | 'maintenance';
  description: string;
  timestamp: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  cin: string;
  phone: string;
  company_name: string;
  address: string;
  vehicle_id: string | null;
  admin_uid: string;
}

// Alias for User to maintain compatibility
export type Customer = User;

export interface Developer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  cin: string;
  phone: string;
  company_name: string;
  address: string;
  created_at: string;
  assigned_vehicle_ids: string[];
  assigned_user_ids: string[];
  admin_uid: string;
}

export interface Admin {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  cin: string;
  phone: string;
  company_name: string;
  address: string;
  created_at: string;
}

// Helper functions to convert database types to our interface types
export const mapVehicle = (dbVehicle: any): Vehicle => {
  // Handle both cases - vehicles with or without location data
  const vehicle: Vehicle = {
    id: dbVehicle.id,
    plate_number: dbVehicle.plate_number,
    status: dbVehicle.status as 'active' | 'inactive' | 'maintenance',
    admin_uid: dbVehicle.admin_uid,
    model: dbVehicle.model,
    type: dbVehicle.type || dbVehicle.vehicle_type || 'car',
    assigned_devices: dbVehicle.assigned_devices || []
  };

  // Only add location data if it exists
  if (dbVehicle.current_location) {
    vehicle.current_location = parseLocation(dbVehicle.current_location);
  }

  // Only add history if it exists and is an array
  if (Array.isArray(dbVehicle.history)) {
    vehicle.history = dbVehicle.history.map(parseLocation);
  }

  return vehicle;
};

export const mapAlert = (dbAlert: any): Alert => {
  return {
    id: dbAlert.id,
    vehicle_id: dbAlert.vehicle_id,
    type: dbAlert.type as 'speeding' | 'geofence' | 'maintenance',
    description: dbAlert.description,
    timestamp: dbAlert.timestamp
  };
};

export const mapDeveloper = (dbDeveloper: any): Developer => {
  return {
    id: dbDeveloper.id,
    email: dbDeveloper.email || '',
    first_name: dbDeveloper.first_name || '',
    last_name: dbDeveloper.last_name || '',
    cin: dbDeveloper.cin || '',
    phone: dbDeveloper.phone || '',
    company_name: dbDeveloper.company_name || '',
    address: dbDeveloper.address || '',
    created_at: dbDeveloper.created_at || new Date().toISOString(),
    assigned_vehicle_ids: dbDeveloper.assigned_vehicle_ids || [],
    assigned_user_ids: dbDeveloper.assigned_user_ids || [],
    admin_uid: dbDeveloper.admin_uid || ''
  };
};

export const mapUser = (dbUser: any): User => {
  return {
    id: dbUser.id,
    first_name: dbUser.first_name || '',
    last_name: dbUser.last_name || '',
    cin: dbUser.cin || '',
    phone: dbUser.phone || '',
    company_name: dbUser.company_name || '',
    address: dbUser.address || '',
    vehicle_id: dbUser.vehicle_id,
    admin_uid: dbUser.admin_uid || ''
  };
};

// Helper function to parse location data from any format
export const parseLocation = (location: any): Location => {
  if (!location) {
    return { lat: 0, lng: 0 };
  }
  
  if (typeof location === 'object' && location !== null) {
    if ('lat' in location && 'lng' in location) {
      return {
        lat: Number(location.lat) || 0,
        lng: Number(location.lng) || 0,
        timestamp: location.timestamp
      };
    }
    
    // Check for latitude/longitude properties
    if ('latitude' in location && 'longitude' in location) {
      return {
        lat: Number(location.latitude) || 0,
        lng: Number(location.longitude) || 0,
        timestamp: location.created_at || location.timestamp
      };
    }
  }
  
  try {
    // If it's a JSON string, try to parse it
    if (typeof location === 'string') {
      const parsed = JSON.parse(location);
      return {
        lat: Number(parsed.lat || parsed.latitude) || 0,
        lng: Number(parsed.lng || parsed.longitude) || 0,
        timestamp: parsed.timestamp || parsed.created_at
      };
    }
  } catch (e) {
    console.error("Failed to parse location:", e);
  }
  
  // Return default location if parsing fails
  return { lat: 0, lng: 0 };
};
