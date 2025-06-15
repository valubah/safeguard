import React, { useState, useEffect, useRef } from 'react';
import { Shield, Phone, MapPin, Users, Settings, Bell, Camera, Mic, AlertTriangle, Send, Plus, X, Check, Clock, Battery } from 'lucide-react';

const SafeGuardApp = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [emergencyContacts, setEmergencyContacts] = useState([
    { id: 1, name: 'Mom', phone: '+1234567890', relation: 'Parent' },
    { id: 2, name: 'Dad', phone: '+1234567891', relation: 'Parent' },
    { id: 3, name: 'Police', phone: '911', relation: 'Emergency' }
  ]);
  const [currentLocation, setCurrentLocation] = useState({ lat: 0, lng: 0, accuracy: 0 });
  const [isTracking, setIsTracking] = useState(false);
  const [panicMode, setPanicMode] = useState(false);
  const [safetyTimer, setSafetyTimer] = useState({ active: false, duration: 30, remaining: 30 });
  const [recordings, setRecordings] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const watchIdRef = useRef(null);
  const timerRef = useRef(null);

  // Simulate location tracking
  useEffect(() => {
    if (isTracking) {
      watchIdRef.current = setInterval(() => {
        // Simulate GPS coordinates (in real app, use navigator.geolocation.watchPosition)
        setCurrentLocation({
          lat: 40.7128 + (Math.random() - 0.5) * 0.01,
          lng: -74.0060 + (Math.random() - 0.5) * 0.01,
          accuracy: Math.floor(Math.random() * 10) + 5
        });
      }, 5000);
    } else {
      if (watchIdRef.current) {
        clearInterval(watchIdRef.current);
      }
    }

    return () => {
      if (watchIdRef.current) {
        clearInterval(watchIdRef.current);
      }
    };
  }, [isTracking]);

  // Safety timer countdown
  useEffect(() => {
    if (safetyTimer.active && safetyTimer.remaining > 0) {
      timerRef.current = setInterval(() => {
        setSafetyTimer(prev => ({
          ...prev,
          remaining: prev.remaining - 1
        }));
      }, 1000);
    } else if (safetyTimer.active && safetyTimer.remaining === 0) {
      triggerEmergencyAlert('Safety timer expired - no check-in received');
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [safetyTimer.active, safetyTimer.remaining]);

  const startTracking = () => {
    setIsTracking(true);
    // In real app: navigator.geolocation.watchPosition()
  };

  const stopTracking = () => {
    setIsTracking(false);
  };

  const triggerPanic = () => {
    setPanicMode(true);
    setIsTracking(true);
    triggerEmergencyAlert('PANIC BUTTON ACTIVATED - IMMEDIATE HELP NEEDED');
    startRecording();
  };

  const cancelPanic = () => {
    setPanicMode(false);
    setIsRecording(false);
  };

  const triggerEmergencyAlert = (message) => {
    const locationText = `https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`;
    const whatsappMessage = `🚨 EMERGENCY ALERT 🚨\n\n${message}\n\nLocation: ${locationText}\nTime: ${new Date().toLocaleString()}\nAccuracy: ${currentLocation.accuracy}m\n\nThis is an automated safety alert from SafeGuard app.`;
    
    emergencyContacts.forEach(contact => {
      if (contact.phone !== '911') {
        const whatsappUrl = `whatsapp://send?phone=${contact.phone}&text=${encodeURIComponent(whatsappMessage)}`;
        // In real app, this would open WhatsApp
        console.log(`Sending to ${contact.name}: ${whatsappUrl}`);
      }
    });
  };

  const startSafetyTimer = (minutes) => {
    setSafetyTimer({
      active: true,
      duration: minutes,
      remaining: minutes * 60
    });
  };

  const checkIn = () => {
    setSafetyTimer(prev => ({ ...prev, active: false }));
    const message = `✅ Safe Check-in\n\nI'm safe and checking in as scheduled.\nLocation: https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}\nTime: ${new Date().toLocaleString()}`;
    
    emergencyContacts.forEach(contact => {
      if (contact.phone !== '911') {
        console.log(`Check-in sent to ${contact.name}: ${message}`);
      }
    });
  };

  const startRecording = () => {
    setIsRecording(true);
    // Simulate recording
    setTimeout(() => {
      const newRecording = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        duration: '00:30',
        type: 'emergency'
      };
      setRecordings(prev => [newRecording, ...prev]);
      setIsRecording(false);
    }, 3000);
  };

  const addEmergencyContact = (name, phone, relation) => {
    const newContact = {
      id: Date.now(),
      name,
      phone,
      relation
    };
    setEmergencyContacts(prev => [...prev, newContact]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const TabButton = ({ id, icon: Icon, label, active }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex flex-col items-center p-2 rounded-lg transition-all ${
        active ? 'bg-red-500 text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={20} />
      <span className="text-xs mt-1">{label}</span>
    </button>
  );

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield size={24} />
            <h1 className="text-xl font-bold">SafeGuard</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Battery size={16} />
            <span className="text-sm">89%</span>
          </div>
        </div>
        
        {panicMode && (
          <div className="mt-2 p-3 bg-red-800 rounded-lg animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle size={20} />
                <span className="font-bold">PANIC MODE ACTIVE</span>
              </div>
              <button
                onClick={cancelPanic}
                className="bg-white text-red-800 px-3 py-1 rounded-full text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20">
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={triggerPanic}
                className="bg-red-500 hover:bg-red-600 text-white p-6 rounded-xl text-center transition-all transform active:scale-95"
                disabled={panicMode}
              >
                <AlertTriangle size={32} className="mx-auto mb-2" />
                <div className="font-bold">PANIC</div>
                <div className="text-sm opacity-90">Emergency Alert</div>
              </button>
              
              <button
                onClick={isTracking ? stopTracking : startTracking}
                className={`${
                  isTracking ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
                } text-white p-6 rounded-xl text-center transition-all`}
              >
                <MapPin size={32} className="mx-auto mb-2" />
                <div className="font-bold">{isTracking ? 'STOP' : 'START'}</div>
                <div className="text-sm opacity-90">Location Tracking</div>
              </button>
            </div>

            {/* Current Status */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="font-semibold mb-3">Current Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Location Tracking</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    isTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isTracking ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Emergency Contacts</span>
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {emergencyContacts.length} contacts
                  </span>
                </div>
                {isTracking && (
                  <div className="text-xs text-gray-600 mt-2">
                    Last location: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                    <br />
                    Accuracy: {currentLocation.accuracy}m
                  </div>
                )}
              </div>
            </div>

            {/* Safety Timer */}
            <div className="bg-blue-50 p-4 rounded-xl">
              <h3 className="font-semibold mb-3">Safety Timer</h3>
              {safetyTimer.active ? (
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {formatTime(safetyTimer.remaining)}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">Time remaining to check in</div>
                  <button
                    onClick={checkIn}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg"
                  >
                    <Check size={16} className="inline mr-1" />
                    Check In - I'm Safe
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => startSafetyTimer(30)}
                    className="bg-blue-500 text-white p-2 rounded-lg text-sm"
                  >
                    30 min
                  </button>
                  <button
                    onClick={() => startSafetyTimer(60)}
                    className="bg-blue-500 text-white p-2 rounded-lg text-sm"
                  >
                    1 hour
                  </button>
                  <button
                    onClick={() => startSafetyTimer(120)}
                    className="bg-blue-500 text-white p-2 rounded-lg text-sm"
                  >
                    2 hours
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'location' && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-xl">
              <h3 className="font-semibold mb-3">Real-time Location</h3>
              {isTracking ? (
                <div>
                  <div className="bg-white p-3 rounded-lg mb-3">
                    <div className="text-sm text-gray-600">Current Position</div>
                    <div className="font-mono text-sm">
                      Lat: {currentLocation.lat.toFixed(6)}<br/>
                      Lng: {currentLocation.lng.toFixed(6)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Accuracy: ±{currentLocation.accuracy}m
                    </div>
                  </div>
                  <button
                    onClick={() => triggerEmergencyAlert('Current location shared')}
                    className="w-full bg-blue-500 text-white p-3 rounded-lg"
                  >
                    <Send size={16} className="inline mr-2" />
                    Share Location Now
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">Location tracking is disabled</p>
                  <button
                    onClick={startTracking}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg"
                  >
                    Enable Tracking
                  </button>
                </div>
              )}
            </div>

            {/* Location History */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="font-semibold mb-3">Recent Locations</h3>
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">Location {i}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(Date.now() - i * 3600000).toLocaleString()}
                        </div>
                      </div>
                      <button className="text-blue-500 text-sm">View</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Emergency Contacts</h3>
              <button className="bg-red-500 text-white p-2 rounded-lg">
                <Plus size={16} />
              </button>
            </div>
            
            <div className="space-y-3">
              {emergencyContacts.map(contact => (
                <div key={contact.id} className="bg-white border rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold">{contact.name}</div>
                      <div className="text-gray-600">{contact.phone}</div>
                      <div className="text-sm text-gray-500">{contact.relation}</div>
                    </div>
                    <button className="text-green-500 p-2">
                      <Phone size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* WhatsApp Integration Status */}
            <div className="bg-green-50 p-4 rounded-xl">
              <h4 className="font-semibold text-green-800 mb-2">WhatsApp Integration</h4>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700">Connected and ready</span>
              </div>
              <p className="text-xs text-green-600 mt-2">
                Emergency alerts will be sent via WhatsApp with location and timestamp
              </p>
            </div>
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Evidence Recording</h3>
              <button
                onClick={startRecording}
                disabled={isRecording}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  isRecording ? 'bg-red-200 text-red-800' : 'bg-red-500 text-white'
                }`}
              >
                <Mic size={16} />
                <span>{isRecording ? 'Recording...' : 'Record'}</span>
              </button>
            </div>

            {/* Recording Controls */}
            <div className="bg-red-50 p-4 rounded-xl">
              <h4 className="font-semibold mb-3">Quick Record</h4>
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-red-500 text-white p-3 rounded-lg">
                  <Camera size={20} className="mx-auto mb-1" />
                  <div className="text-sm">Photo</div>
                </button>
                <button className="bg-red-500 text-white p-3 rounded-lg">
                  <Mic size={20} className="mx-auto mb-1" />
                  <div className="text-sm">Audio</div>
                </button>
              </div>
            </div>

            {/* Recordings List */}
            <div className="space-y-3">
              <h4 className="font-semibold">Saved Evidence</h4>
              {recordings.map(recording => (
                <div key={recording.id} className="bg-white border rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Recording {recording.id}</div>
                      <div className="text-sm text-gray-600">{recording.timestamp}</div>
                      <div className="text-xs text-gray-500">Duration: {recording.duration}</div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-blue-500 text-sm">Play</button>
                      <button className="text-green-500 text-sm">Share</button>
                    </div>
                  </div>
                </div>
              ))}
              {recordings.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No recordings yet
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h3 className="font-semibold">Settings</h3>
            
            <div className="bg-white border rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span>Auto-start tracking</span>
                <button className="w-12 h-6 bg-gray-300 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                </button>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Silent mode alerts</span>
                <button className="w-12 h-6 bg-blue-500 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                </button>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Background location</span>
                <button className="w-12 h-6 bg-blue-500 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                </button>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <h4 className="font-semibold mb-3">Privacy & Security</h4>
              <div className="space-y-3">
                <button className="w-full text-left p-2 hover:bg-gray-50 rounded">
                  Data encryption settings
                </button>
                <button className="w-full text-left p-2 hover:bg-gray-50 rounded">
                  Location sharing permissions
                </button>
                <button className="w-full text-left p-2 hover:bg-gray-50 rounded">
                  Emergency contact verification
                </button>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-xl">
              <h4 className="font-semibold text-red-800 mb-2">Emergency Features</h4>
              <div className="space-y-2 text-sm">
                <div>• Automatic WhatsApp alerts</div>
                <div>• Real-time GPS tracking</div>
                <div>• Silent background recording</div>
                <div>• Emergency contact notifications</div>
                <div>• Location history backup</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t p-3">
        <div className="flex justify-around">
          <TabButton id="home" icon={Shield} label="Home" active={activeTab === 'home'} />
          <TabButton id="location" icon={MapPin} label="Location" active={activeTab === 'location'} />
          <TabButton id="contacts" icon={Users} label="Contacts" active={activeTab === 'contacts'} />
          <TabButton id="evidence" icon={Camera} label="Evidence" active={activeTab === 'evidence'} />
          <TabButton id="settings" icon={Settings} label="Settings" active={activeTab === 'settings'} />
        </div>
      </div>
    </div>
  );
};

export default SafeGuardApp;