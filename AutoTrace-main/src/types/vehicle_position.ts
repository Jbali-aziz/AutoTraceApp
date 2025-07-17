export interface VehiclePosition {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  accel_x?: number;
  accel_y?: number;
  accel_z?: number;
  pitch?: number;
  roll?: number;
  created_at?: string;
}
