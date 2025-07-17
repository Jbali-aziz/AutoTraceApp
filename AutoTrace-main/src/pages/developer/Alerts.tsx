
import { useState, useEffect } from 'react';
import cn from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Bell, AlertTriangle, Info, Check, Search, AlertCircle, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AlertItem {
  id: string;
  vehicle_id: string;
  description: string;
  type: string;
  timestamp: string;
  roll?: number;
  pitch?: number;
  read?: boolean;
  vehicleInfo?: {
    plate_number: string;
  };
}

const DeveloperAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [readAlerts, setReadAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAlerts();

    // Set up the real-time subscription
    const alertsSubscription = supabase
      .channel('alerts_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'alerts'
      }, (payload) => {
        // Add the new alert to the list
        const newAlert = payload.new as AlertItem;
        handleNewAlert(newAlert);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(alertsSubscription);
    };
  }, [user]);

  useEffect(() => {
    // Apply filters whenever searchTerm or filterType changes
    applyFilters();
  }, [searchTerm, filterType, alerts]);

  const fetchAlerts = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // First get the developer record to get assigned vehicle IDs
      const { data: developerData, error: developerError } = await supabase
        .from('developers')
        .select('assigned_vehicle_ids')
        .eq('id', user.id)
        .single();
      
      if (developerError) throw developerError;
      
      console.log('Developer assigned_vehicle_ids:', developerData?.assigned_vehicle_ids);
      
      if (!developerData?.assigned_vehicle_ids?.length) {
        setAlerts([]);
        setFilteredAlerts([]);
        setLoading(false);
        return null;
      }
      
      // Fetch device IDs for developer's assigned vehicles
      const { data: devices, error: devicesError } = await supabase
        .from('devices')
        .select('id, vehicle_id')
        .in('vehicle_id', developerData.assigned_vehicle_ids);
      if (devicesError) throw devicesError;
      const deviceIds = (devices || []).map(d => d.id);
      console.log('Mapped device IDs for this dev:', deviceIds);

      // Calculate timestamp for 3 hours ago
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
      console.log('Fetching positions from:', threeHoursAgo, 'to now:', now.toISOString());

      // Fetch all vehicle_positions for these device IDs in the last 3 hours
      const { data: positionsData, error: positionsError } = await supabase
        .from('vehicle_positions')
        .select('*')
        .in('device_id', deviceIds)
        .gte('created_at', threeHoursAgo)
        .order('created_at', { ascending: false });
      if (positionsError) throw positionsError;
      console.log('All vehicle_positions for this dev:', positionsData);

      // Fetch ALL vehicle_positions in DB for debug
      const { data: allPositions } = await supabase.from('vehicle_positions').select('*');
      console.log('ALL vehicle_positions in DB:', allPositions);

      // Generate alerts from positions
      const alertsFromPositions = (positionsData || []).map((pos) => {
        let type = 'info';
        let reasons: string[] = [];
        // Speed logic
        if (pos.speed > 120) {
          type = 'critical';
          reasons.push(`Overspeeding: ${pos.speed} km/h`);
        } else if (pos.speed > 90) {
          type = type === 'critical' ? type : 'warning';
          reasons.push(`High speed: ${pos.speed} km/h`);
        } else if (pos.speed < 1) {
          reasons.push('Vehicle stopped or idling');
        }

        // Acceleration logic
        if (typeof pos.accel_x === 'number' && Math.abs(pos.accel_x) > 3) {
          type = 'critical';
          reasons.push(`Harsh accel/brake: accel_x=${pos.accel_x.toFixed(2)} m/s²`);
        }
        if (typeof pos.accel_y === 'number' && Math.abs(pos.accel_y) > 3) {
          type = 'warning';
          reasons.push(`Sharp turn/swerve: accel_y=${pos.accel_y.toFixed(2)} m/s²`);
        }
        if (typeof pos.accel_z === 'number' && Math.abs(pos.accel_z) > 5) {
          type = 'critical';
          reasons.push(`Possible bump/crash: accel_z=${pos.accel_z.toFixed(2)} m/s²`);
        } else if (typeof pos.accel_z === 'number' && Math.abs(pos.accel_z) > 3) {
          type = type === 'critical' ? type : 'warning';
          reasons.push(`Bump detected: accel_z=${pos.accel_z.toFixed(2)} m/s²`);
        }

        // Pitch/Roll logic
        if (typeof pos.roll === 'number' && Math.abs(pos.roll) > 20) {
          type = 'critical';
          reasons.push(`Extreme roll: ${pos.roll}°`);
        } else if (typeof pos.roll === 'number' && Math.abs(pos.roll) > 10) {
          type = type === 'critical' ? type : 'warning';
          reasons.push(`Moderate roll: ${pos.roll}°`);
        }
        if (typeof pos.pitch === 'number' && Math.abs(pos.pitch) > 20) {
          type = 'critical';
          reasons.push(`Extreme pitch: ${pos.pitch}°`);
        } else if (typeof pos.pitch === 'number' && Math.abs(pos.pitch) > 10) {
          type = type === 'critical' ? type : 'warning';
          reasons.push(`Moderate pitch: ${pos.pitch}°`);
        }

        // Crash/rollover detection (combine accel_z and roll/pitch)
        if (
          typeof pos.accel_z === 'number' && Math.abs(pos.accel_z) > 8 &&
          ((typeof pos.roll === 'number' && Math.abs(pos.roll) > 20) || (typeof pos.pitch === 'number' && Math.abs(pos.pitch) > 20))
        ) {
          type = 'critical';
          reasons.push('Possible crash or rollover!');
        }

        // Compose description
        let description = reasons.length > 0 ? reasons.join(' | ') : `Speed: ${pos.speed} km/h`;

        return {
          id: pos.id,
          vehicle_id: pos.device_id,
          description,
          type,
          timestamp: pos.created_at,
          roll: pos.roll,
          pitch: pos.pitch,
          accel_x: pos.accel_x,
          accel_y: pos.accel_y,
          accel_z: pos.accel_z,
        };
      });

      // Enrich with vehicle info
      const enrichedAlerts = await Promise.all(alertsFromPositions.map(async (alert) => {
        const { data: vehicleData } = await supabase
          .from('vehicles')
          .select('plate_number')
          .eq('id', alert.vehicle_id)
          .single();
        return {
          ...alert,
          vehicleInfo: vehicleData || { plate_number: 'Unknown' }
        };
      }));
      
      console.log('Generated enrichedAlerts from positions:', enrichedAlerts);
      setAlerts(enrichedAlerts);
      setFilteredAlerts(enrichedAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleNewAlert = async (newAlert: AlertItem) => {
    try {
      // Fetch vehicle info for the new alert
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('plate_number')
        .eq('id', newAlert.vehicle_id)
        .single();

      const enrichedAlert = {
        ...newAlert,
        vehicleInfo: vehicleData || { plate_number: 'Unknown' }
      };

      // Add new alert to the list
      setAlerts(prev => [enrichedAlert, ...prev]);
      
      // Show a toast notification
      toast.warning(`New alert: ${enrichedAlert.type}`, {
        description: `${enrichedAlert.description} for vehicle ${enrichedAlert.vehicleInfo.plate_number}`
      });
    } catch (error) {
      console.error('Error processing new alert:', error);
    }
  };

  const applyFilters = () => {
    let filtered = alerts;
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(alert => alert.type === filterType);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        alert => 
          alert.description.toLowerCase().includes(searchLower) ||
          alert.type.toLowerCase().includes(searchLower) ||
          alert.vehicleInfo?.plate_number.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredAlerts(filtered);
  };

  const handleAlertClick = (alert: AlertItem) => {
    setSelectedAlert(alert);
    setIsDetailOpen(true);
    
    // Mark as read
    setReadAlerts(prev => {
      const updated = new Set(prev);
      updated.add(alert.id);
      return updated;
    });
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'critical':
        return <Badge className="bg-red-500">{type}</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500 text-black">{type}</Badge>;
      case 'info':
        return <Badge className="bg-blue-500">{type}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const markAllAsRead = () => {
    const allIds = alerts.map(alert => alert.id);
    setReadAlerts(new Set(allIds));
    toast.success('All alerts marked as read', { description: '' });
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-theme-deepPurple border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-theme-deepPurple">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-darkPurple">Alerts</h1>
          <p className="text-theme-terracotta">Monitor vehicle alerts and notifications</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-theme-terracotta" />
            <Input
              type="search"
              placeholder="Search alerts..."
              className="w-full sm:w-[200px] pl-9 border-theme-lightBrown/30 focus:border-theme-deepPurple"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[120px] border-theme-lightBrown/30 focus:border-theme-deepPurple">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={markAllAsRead}
            className="border-theme-terracotta/20 text-theme-terracotta hover:bg-theme-terracotta/10"
          >
            <Check className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <Card className="border-theme-lightBrown/20 shadow-md">
          <CardContent className="pt-10 pb-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-theme-lightBrown/10 p-4 rounded-full">
                <Bell className="h-10 w-10 text-theme-terracotta/50" />
              </div>
            </div>
            <h3 className="text-lg font-medium mb-1 text-theme-darkPurple">No alerts found</h3>
            <p className="text-theme-terracotta/70">
              {searchTerm || filterType !== 'all' 
                ? "Try adjusting your search or filters" 
                : "You don't have any alerts right now"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-theme-lightBrown/20 shadow-md overflow-hidden">
          <CardHeader className="bg-theme-darkPurple/5 border-b border-theme-lightBrown/20">
            <CardTitle className="text-theme-darkPurple">System Alerts</CardTitle>
            <CardDescription>
              {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-theme-lightBrown/20">
              {filteredAlerts.map(alert => (
                <div 
                  key={alert.id} 
                  className={cn(
                    "p-4 hover:bg-theme-lightBrown/5 cursor-pointer flex items-center transition-colors",
                    readAlerts.has(alert.id) ? "bg-white" : "bg-theme-lightBrown/10"
                  )}
                  onClick={() => handleAlertClick(alert)}
                >
                  <div className="mr-4">
                    {getAlertTypeIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-theme-darkPurple truncate">
                        {alert.vehicleInfo?.plate_number} - {alert.description.slice(0, 50)}
                        {alert.description.length > 50 ? '...' : ''}
                      </h4>
                      <div className="text-xs text-theme-terracotta/80">
                        Roll: {typeof alert.roll === 'number' ? `${alert.roll}°` : 'N/A'} | Pitch: {typeof alert.pitch === 'number' ? `${alert.pitch}°` : 'N/A'}
                      </div>
                      {!readAlerts.has(alert.id) && (
                        <span className="h-2 w-2 bg-theme-terracotta rounded-full ml-2"></span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-theme-terracotta/70 gap-2">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(alert.timestamp)}</span>
                      <div className="ml-auto">
                        {getAlertTypeBadge(alert.type)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md bg-white border-theme-lightBrown/30">
          <DialogHeader>
            <DialogTitle className="flex items-center text-theme-darkPurple">
              {selectedAlert && getAlertTypeIcon(selectedAlert.type)}
              <span className="ml-2">Alert Details</span>
            </DialogTitle>
            <DialogDescription className="text-theme-terracotta/70">
              Complete information about the selected alert
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              <Alert className={cn(
                "border",
                selectedAlert.type.toLowerCase() === 'critical' ? "border-red-200 bg-red-50" : 
                selectedAlert.type.toLowerCase() === 'warning' ? "border-yellow-200 bg-yellow-50" : 
                "border-blue-200 bg-blue-50"
              )}>
                <AlertTitle className={cn(
                  selectedAlert.type.toLowerCase() === 'critical' ? "text-red-800" : 
                  selectedAlert.type.toLowerCase() === 'warning' ? "text-yellow-800" : 
                  "text-blue-800"
                )}>
                  {selectedAlert.type} Alert
                </AlertTitle>
                <AlertDescription className={cn(
                  selectedAlert.type.toLowerCase() === 'critical' ? "text-red-700" : 
                  selectedAlert.type.toLowerCase() === 'warning' ? "text-yellow-700" : 
                  "text-blue-700"
                )}>
                  {selectedAlert.description}
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="text-sm font-medium text-theme-deepPurple">Vehicle Plate</div>
                <div className="text-theme-darkPurple">{selectedAlert.vehicleInfo?.plate_number}</div>
                
                <div className="text-sm font-medium text-theme-deepPurple">Vehicle ID</div>
                <div className="text-theme-darkPurple">{selectedAlert.vehicle_id}</div>
                
                <div className="text-sm font-medium text-theme-deepPurple">Date & Time</div>
                <div className="text-theme-darkPurple">{formatDate(selectedAlert.timestamp)}</div>
                
                <div className="text-sm font-medium text-theme-deepPurple">Alert Type</div>
                <div>{getAlertTypeBadge(selectedAlert.type)}</div>
                
                <div className="text-sm font-medium text-theme-deepPurple">Alert ID</div>
                <div className="text-theme-darkPurple text-xs font-mono">{selectedAlert.id}</div>
              </div>
              
              <DialogFooter>
                <Button 
                  onClick={() => setIsDetailOpen(false)}
                  className="bg-theme-deepPurple hover:bg-theme-darkPurple"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeveloperAlerts;
