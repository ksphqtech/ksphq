import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Clock, Timer, Edit2 } from 'lucide-react';
import { DynamicFieldGroup } from '@/components/workforce/DynamicFieldGroup';
import { HourMinuteSelector } from '@/components/workforce/HourMinuteSelector';
import { TimeLogEditDialog } from '@/components/workforce/TimeLogEditDialog';
import {
  getWorkforceSettings,
  canUserAccessTab,
  areFieldsDisabled,
  validateFormData
} from '@/lib/workforceSettings';
import {
  getClients,
  getActivities,
  getProjects,
  hasWorkforceData,
  initializeAllWorkforceData
} from '@/lib/workforceData';
import { clientsData, activitiesData, workforceProjectsData } from '@/data/workforceData';

export function ClockIn() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('clock-in');

  // Clock In state
  const [clockSession, setClockSession] = useState(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    client: '',
    activity: '',
    project: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  // Log Time state
  const [logHours, setLogHours] = useState(0);
  const [logMinutes, setLogMinutes] = useState(0);

  // Time log state
  const [timeLog, setTimeLog] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Initialize workforce data on mount
  useEffect(() => {
    if (!hasWorkforceData()) {
      initializeAllWorkforceData(clientsData, activitiesData, workforceProjectsData);
    }
  }, []);

  // Load settings and clock session
  useEffect(() => {
    const workforceSettings = getWorkforceSettings();
    setSettings(workforceSettings);

    // Load clock session from localStorage
    const sessionKey = `clockSession_${user.id}`;
    const storedSession = localStorage.getItem(sessionKey);
    if (storedSession) {
      const session = JSON.parse(storedSession);
      setClockSession(session);
      setIsClockedIn(session.isClockedIn);
      setFormData({
        client: session.client || '',
        activity: session.activity || '',
        project: session.project || '',
        notes: session.notes || ''
      });
    }

    // Load today's time log
    loadTimeLog();
  }, [user.id]);

  // Real-time clock update (every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate elapsed time
  useEffect(() => {
    if (isClockedIn && clockSession?.clockInTime) {
      const start = new Date(clockSession.clockInTime);
      const now = new Date();
      const diff = now - start;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setElapsedTime(`${hours}h ${minutes}m`);
    } else {
      setElapsedTime('');
    }
  }, [currentTime, isClockedIn, clockSession]);

  const loadTimeLog = () => {
    const today = new Date().toISOString().split('T')[0];
    const logKey = `timeLog_${user.id}_${today}`;
    const stored = localStorage.getItem(logKey);
    if (stored) {
      setTimeLog(JSON.parse(stored));
    } else {
      setTimeLog([]);
    }
  };

  const saveTimeLog = (log) => {
    const today = new Date().toISOString().split('T')[0];
    const logKey = `timeLog_${user.id}_${today}`;
    localStorage.setItem(logKey, JSON.stringify(log));
    setTimeLog(log);
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Update session if clocked in
    if (isClockedIn) {
      const updatedSession = {
        ...clockSession,
        [field]: value
      };
      setClockSession(updatedSession);
      localStorage.setItem(`clockSession_${user.id}`, JSON.stringify(updatedSession));
    }
  };

  const handleClockIn = () => {
    // Validate if timing is 'before'
    if (settings.clockIn.fieldEditTiming === 'before') {
      const validation = validateFormData(formData, settings);
      if (!validation.valid) {
        setErrors(validation.errors);
        return;
      }
    }

    const now = new Date().toISOString();
    const session = {
      id: `session_${Date.now()}`,
      clockInTime: now,
      client: formData.client,
      activity: formData.activity,
      project: formData.project,
      notes: formData.notes,
      isClockedIn: true
    };

    setClockSession(session);
    setIsClockedIn(true);
    localStorage.setItem(`clockSession_${user.id}`, JSON.stringify(session));
  };

  const handleClockOut = () => {
    // Validate if timing is 'after'
    if (settings.clockIn.fieldEditTiming === 'after') {
      const validation = validateFormData(formData, settings);
      if (!validation.valid) {
        setErrors(validation.errors);
        return;
      }
    }

    const now = new Date().toISOString();
    const start = new Date(clockSession.clockInTime);
    const end = new Date(now);
    const diff = end - start;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const durationParts = [];
    if (hours > 0) durationParts.push(`${hours}h`);
    if (minutes > 0) durationParts.push(`${minutes}m`);
    const duration = durationParts.join(' ') || '0m';

    // Create time log entry
    const entry = {
      id: `entry_${Date.now()}`,
      type: 'clock',
      startTime: clockSession.clockInTime,
      endTime: now,
      duration,
      clientId: formData.client,
      activityId: formData.activity,
      projectId: formData.project,
      notes: formData.notes,
      createdAt: now
    };

    // Add to time log
    const updatedLog = [...timeLog, entry];
    saveTimeLog(updatedLog);

    // Clear session
    setClockSession(null);
    setIsClockedIn(false);
    setFormData({ client: '', activity: '', project: '', notes: '' });
    setErrors({});
    localStorage.removeItem(`clockSession_${user.id}`);
  };

  const handleLogTime = () => {
    // Validate form data
    const validation = validateFormData(formData, settings);

    // Check minimum time (at least 15 minutes)
    const totalMinutes = (logHours * 60) + logMinutes;
    if (totalMinutes < 15) {
      setErrors({ ...validation.errors, duration: 'Minimum duration is 15 minutes' });
      return;
    }

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    const now = new Date().toISOString();
    const durationParts = [];
    if (logHours > 0) durationParts.push(`${logHours}h`);
    if (logMinutes > 0) durationParts.push(`${logMinutes}m`);
    const duration = durationParts.join(' ') || '0m';

    // Create time log entry
    const entry = {
      id: `entry_${Date.now()}`,
      type: 'manual',
      duration,
      clientId: formData.client,
      activityId: formData.activity,
      projectId: formData.project,
      notes: formData.notes,
      createdAt: now
    };

    // Add to time log
    const updatedLog = [...timeLog, entry];
    saveTimeLog(updatedLog);

    // Reset form
    setFormData({ client: '', activity: '', project: '', notes: '' });
    setLogHours(0);
    setLogMinutes(0);
    setErrors({});
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setShowEditDialog(true);
  };

  const handleSaveEdit = (updatedEntry) => {
    const updatedLog = timeLog.map(entry =>
      entry.id === updatedEntry.id ? updatedEntry : entry
    );
    saveTimeLog(updatedLog);
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getEntityName = (entityId, type) => {
    if (!entityId) return '-';

    let entity;
    if (type === 'client') {
      entity = getClients().find(c => c.id === entityId);
    } else if (type === 'activity') {
      entity = getActivities().find(a => a.id === entityId);
    } else if (type === 'project') {
      entity = getProjects().find(p => p.id === entityId);
    }

    return entity?.name || '-';
  };

  // Check tab permissions
  const canClockIn = settings && canUserAccessTab(user, 'clockIn', settings);
  const canLogTime = settings && canUserAccessTab(user, 'logTime', settings);

  // Determine which tabs to show
  const showTabs = canClockIn && canLogTime;
  const showSingleView = (canClockIn && !canLogTime) || (!canClockIn && canLogTime);

  if (!settings) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canClockIn && !canLogTime) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              You don't have permission to access this page. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fieldsDisabled = areFieldsDisabled(isClockedIn, settings);

  const renderClockInView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clock Status Card */}
        <Card className={isClockedIn ? 'border-2 border-primary bg-primary/5' : 'border-2 border-dashed'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className={isClockedIn ? 'h-5 w-5 text-primary animate-pulse' : 'h-5 w-5 text-muted-foreground'} />
              {isClockedIn ? 'Clocked In' : 'Clock In'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Time */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Current Time</p>
              <p className="text-2xl font-bold">
                {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>

            {/* Clock In Info */}
            {isClockedIn && clockSession && (
              <div className="space-y-2 border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Clocked in at</p>
                  <p className="font-semibold">{formatTime(clockSession.clockInTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Elapsed Time</p>
                  <p className="text-3xl font-bold text-primary">{elapsedTime}</p>
                </div>
              </div>
            )}

            {/* Clock In/Out Button */}
            <Button
              onClick={isClockedIn ? handleClockOut : handleClockIn}
              variant={isClockedIn ? 'destructive' : 'default'}
              className="w-full"
            >
              <Timer className="h-4 w-4 mr-2" />
              {isClockedIn ? 'Clock Out' : 'Clock In'}
            </Button>
          </CardContent>
        </Card>

        {/* Fields Card */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <DynamicFieldGroup
              formData={formData}
              onFieldChange={handleFieldChange}
              disabled={fieldsDisabled}
              errors={errors}
              settings={settings}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderLogTimeView = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Log Time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Duration Selector */}
          <HourMinuteSelector
            hours={logHours}
            minutes={logMinutes}
            onHoursChange={(value) => setLogHours(parseInt(value))}
            onMinutesChange={(value) => setLogMinutes(parseInt(value))}
          />
          {errors.duration && (
            <p className="text-sm text-destructive">{errors.duration}</p>
          )}

          {/* Dynamic Fields */}
          <DynamicFieldGroup
            formData={formData}
            onFieldChange={handleFieldChange}
            disabled={false}
            errors={errors}
            settings={settings}
          />

          {/* Log Button */}
          <Button onClick={handleLogTime} className="w-full md:w-auto">
            Log Time Entry
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderTimeLog = () => (
    <Card>
      <CardHeader>
        <CardTitle>Today's Time Log</CardTitle>
      </CardHeader>
      <CardContent>
        {timeLog.length === 0 ? (
          <p className="text-sm text-muted-foreground">No time entries for today.</p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Time Range</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeLog.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Badge variant={entry.type === 'clock' ? 'default' : 'secondary'}>
                          {entry.type === 'clock' ? 'Clock In' : 'Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {entry.type === 'clock' ? (
                          `${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}`
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{getEntityName(entry.clientId, 'client')}</TableCell>
                      <TableCell>{getEntityName(entry.activityId, 'activity')}</TableCell>
                      <TableCell>{getEntityName(entry.projectId, 'project')}</TableCell>
                      <TableCell className="font-semibold">{entry.duration}</TableCell>
                      <TableCell>
                        {entry.type === 'manual' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEntry(entry)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {timeLog.map(entry => (
                <Card key={entry.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={entry.type === 'clock' ? 'default' : 'secondary'}>
                        {entry.type === 'clock' ? 'Clock In' : 'Manual'}
                      </Badge>
                      {entry.type === 'manual' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEntry(entry)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {entry.type === 'clock' && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Time: </span>
                        {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-muted-foreground">Client: </span>
                      {getEntityName(entry.clientId, 'client')}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Activity: </span>
                      {getEntityName(entry.activityId, 'activity')}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Project: </span>
                      {getEntityName(entry.projectId, 'project')}
                    </div>
                    <div className="text-sm font-semibold">
                      <span className="text-muted-foreground">Duration: </span>
                      {entry.duration}
                    </div>
                    {entry.notes && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Notes: </span>
                        {entry.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {showTabs ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clock-in">Clock In</TabsTrigger>
            <TabsTrigger value="log-time">Log Time</TabsTrigger>
          </TabsList>

          <TabsContent value="clock-in" className="space-y-6">
            {renderClockInView()}
            {renderTimeLog()}
          </TabsContent>

          <TabsContent value="log-time" className="space-y-6">
            {renderLogTimeView()}
            {renderTimeLog()}
          </TabsContent>
        </Tabs>
      ) : (
        <>
          {canClockIn && renderClockInView()}
          {canLogTime && renderLogTimeView()}
          {renderTimeLog()}
        </>
      )}

      {/* Edit Dialog */}
      <TimeLogEditDialog
        entry={editingEntry}
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingEntry(null);
        }}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
