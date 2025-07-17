
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Vehicle, Location, parseLocation } from "@/types";

// Fix default marker icon issue in Leaflet
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Override default Leaflet marker icons
const defaultIcon = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

// Custom Icons
const carPinMarkerIcon = L.icon({
  iconUrl: '/image.png',
  iconRetinaUrl: '/image.png',
  iconSize: [32, 38],
  iconAnchor: [16, 34],
  popupAnchor: [0, -32],
});


const historyMarkerIcon = L.icon({
  iconUrl: '/images/history-marker.png',
  iconRetinaUrl: '/images/history-marker.png',
  shadowUrl,
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [0, -32],
});

// Function to get the appropriate icon based on vehicle status
const getVehicleIcon = (_status: string) => carPinMarkerIcon;

function MapView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom() || 13);
  }, [map, center]);

  return null;
}

export interface VehicleMapProps {
  vehicle: Vehicle;
  showHistory?: boolean;
}

export interface MultiVehicleMapProps {
  vehicles: Vehicle[];
  selectedVehicleId?: string;
  onVehicleSelect?: (id: string) => void;
}

// Component for showing a single vehicle
export const VehicleMap = ({ vehicle, showHistory = false }: VehicleMapProps) => {
  // Process the current_location to ensure it's in the right format
  const currentLocation = vehicle.current_location ? parseLocation(vehicle.current_location) : { lat: 0, lng: 0 };
  
  // Process the history locations
  const historyLocations = vehicle.history
    ? vehicle.history.map(loc => parseLocation(loc)).filter(loc => loc.lat !== 0 && loc.lng !== 0)
    : [];
  
  return (
    <div className="h-full min-h-[300px] w-full rounded-md border">
      <MapContainer
        center={[currentLocation.lat || 37.7749, currentLocation.lng || -122.4194]}
        zoom={13}
        className="h-full w-full rounded-md"
      >
        <MapView center={[currentLocation.lat || 37.7749, currentLocation.lng || -122.4194]} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Show current vehicle location */}
        {currentLocation.lat !== 0 && currentLocation.lng !== 0 && (
          <Marker 
            position={[currentLocation.lat, currentLocation.lng]}
            icon={getVehicleIcon(vehicle.status)}
          >
            <Popup>
              <div>
                <p className="font-bold">{vehicle.plate_number}</p>
                <p>Current Location</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Show history if enabled */}
        {showHistory && historyLocations.map((location, index) => (
          <Marker
            key={index}
            position={[location.lat, location.lng]}
            icon={historyMarkerIcon}
          >
            <Popup>
              <div>
                <p className="font-bold">{vehicle.plate_number}</p>
                <p>History Point {index + 1}</p>
                {location.timestamp && (
                  <p>{new Date(location.timestamp).toLocaleString()}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

// Component for showing multiple vehicles
export const MultiVehicleMap = ({ vehicles, selectedVehicleId, onVehicleSelect }: MultiVehicleMapProps) => {
  // Find center point based on selected vehicle or first valid vehicle
  let centerLat = 0;
  let centerLng = 0;
  
  if (selectedVehicleId) {
    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (selectedVehicle && selectedVehicle.current_location) {
      const loc = parseLocation(selectedVehicle.current_location);
      centerLat = loc.lat;
      centerLng = loc.lng;
    }
  }
  
  // If no selected vehicle or invalid location, use the first vehicle with valid location
  if (centerLat === 0 && centerLng === 0 && vehicles.length > 0) {
    for (const vehicle of vehicles) {
      if (vehicle.current_location) {
        const loc = parseLocation(vehicle.current_location);
        if (loc.lat !== 0 && loc.lng !== 0) {
          centerLat = loc.lat;
          centerLng = loc.lng;
          break;
        }
      }
    }
  }
  
  // Fallback to a default location if no valid vehicle location found
  if (centerLat === 0 && centerLng === 0) {
    centerLat = 37.7749;
    centerLng = -122.4194; // Default: San Francisco
  }
  
  return (
    <div className="h-full min-h-[300px] w-full rounded-md border">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={11}
        className="h-full w-full rounded-md"
      >
        <MapView center={[centerLat, centerLng]} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Show all vehicles */}
        {vehicles.map((vehicle) => {
          if (!vehicle || !vehicle.current_location) return null;
          
          const loc = parseLocation(vehicle.current_location);
          if (loc.lat === 0 && loc.lng === 0) return null;
          
          return (
            <Marker 
              key={vehicle.id}
              position={[loc.lat, loc.lng]}
              icon={getVehicleIcon(vehicle.status)}
              eventHandlers={onVehicleSelect ? {
                click: () => onVehicleSelect(vehicle.id)
              } : undefined}
            >
              <Popup>
                <div>
                  <p className="font-bold">{vehicle.plate_number}</p>
                  <p>Status: {vehicle.status}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
