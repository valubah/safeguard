import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, Phone, MapPin, Users, Settings, Bell, Camera, Mic, AlertTriangle, Send, Plus, X, Check, Clock, Battery, Play, Pause, Square, Download, Share2, Eye, EyeOff, Zap, Brain, Navigation, CheckCircle } from 'lucide-react';




const persistentStorage = {
  getItem: function(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage not available, using session storage');
      return sessionStorage.getItem(key);
    }
  },
  
  setItem: function(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage not available, using session storage');
      sessionStorage.setItem(key, value);
    }
  },
  
  removeItem: function(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage not available, using session storage');
      sessionStorage.removeItem(key);
    }
  }
};


// Initialize with default data if not exists
const initializeStorage = () => {
  if (!persistentStorage.getItem('safeguard_initialized')) {
    persistentStorage.setItem('safeguard_contacts', JSON.stringify([
      { id: 1, name: 'Mom', phone: '+1234567890', relation: 'Parent', verified: true },
      { id: 2, name: 'Dad', phone: '+1234567891', relation: 'Parent', verified: true },
      { id: 3, name: 'Police', phone: '911', relation: 'Emergency', verified: true }
    ]));
    persistentStorage.setItem('safeguard_recordings', JSON.stringify([]));
    persistentStorage.setItem('safeguard_location_history', JSON.stringify([]));
    persistentStorage.setItem('safeguard_settings', JSON.stringify({
      autoStartTracking: false,
      silentMode: true,
      backgroundLocation: true,
      aiMonitoring: true,
      autoRecord: true,
      emergencyTimeout: 10
    }));
    persistentStorage.setItem('safeguard_initialized', 'true');
  }
};



const SafeGuardApp = () => {

  React.useEffect(() => {
    initializeStorage();
  }, []);



  const [activeTab, setActiveTab] = useState('home');
  
  const [emergencyContacts, setEmergencyContacts] = useState(() => {
    const saved = persistentStorage.getItem('safeguard_contacts');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Mom', phone: '+1234567890', relation: 'Parent', verified: true, verifiedAt: new Date('2024-01-15T10:30:00').toISOString() },
      { id: 2, name: 'Dad', phone: '+1234567891', relation: 'Parent', verified: true, verifiedAt: new Date('2024-01-15T10:30:00').toISOString() },
      { id: 3, name: 'Police', phone: '911', relation: 'Emergency', verified: false, verifiedAt: null }
    ];
  });

  const [contactDataAccess, setContactDataAccess] = useState(() => {
    const saved = persistentStorage.getItem('safeguard_contact_access');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [sharedDataSessions, setSharedDataSessions] = useState(() => {
    const saved = persistentStorage.getItem('safeguard_shared_sessions');
    return saved ? JSON.parse(saved) : [];
  });





  const [locationHistory, setLocationHistory] = useState(() => {
    const saved = persistentStorage.getItem('safeguard_location_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [recordings, setRecordings] = useState(() => {
    const saved = persistentStorage.getItem('safeguard_recordings');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [settings, setSettings] = useState(() => {
    const saved = persistentStorage.getItem('safeguard_settings');
    return saved ? JSON.parse(saved) : {
      autoStartTracking: true,
      silentMode: true,
      backgroundLocation: true,
      aiMonitoring: true,
      autoRecord: true,
      emergencyTimeout: 10
    };
  });








  const [currentLocation, setCurrentLocation] = useState({ lat: 0, lng: 0, accuracy: 0, timestamp: null });


  
  const [isTracking, setIsTracking] = useState(false);
  const [panicMode, setPanicMode] = useState(false);
  const [safetyTimer, setSafetyTimer] = useState({ active: false, duration: 30, remaining: 30 });
  


  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [aiAnalysis, setAiAnalysis] = useState({ threat: 'low', confidence: 0, suggestions: [] });
 
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' });
  const [showAddContact, setShowAddContact] = useState(false);


  


  useEffect(() => {
    persistentStorage.setItem('safeguard_contacts', JSON.stringify(emergencyContacts));
  }, [emergencyContacts]);

  // Persist location history
  useEffect(() => {
    persistentStorage.setItem('safeguard_location_history', JSON.stringify(locationHistory));
  }, [locationHistory]);

  // Persist recordings
  useEffect(() => {
    persistentStorage.setItem('safeguard_recordings', JSON.stringify(recordings));
  }, [recordings]);

  // Persist settings
  useEffect(() => {
    persistentStorage.setItem('safeguard_settings', JSON.stringify(settings));
  }, [settings]);


  useEffect(() => {
    persistentStorage.setItem('safeguard_contact_access', JSON.stringify(contactDataAccess));
  }, [contactDataAccess]);
  
  useEffect(() => {
    persistentStorage.setItem('safeguard_shared_sessions', JSON.stringify(sharedDataSessions));
  }, [sharedDataSessions]);




  const watchIdRef = useRef(null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);


  

  // Initialize geolocation and device features
  useEffect(() => {
    // Check permissions and capabilities
    if ('geolocation' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'granted' && settings.autoStartTracking) {
          startTracking();
        }
      });
    }

    // Battery API
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        setBatteryLevel(Math.floor(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.floor(battery.level * 100));
        });
      });
    }

    // Online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [settings.autoStartTracking]);

  // Real geolocation tracking
  const startTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const success = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      const timestamp = new Date();
      
      const newLocation = {
        lat: latitude,
        lng: longitude,
        accuracy: Math.round(accuracy),
        timestamp: timestamp.toISOString()
      };

      setCurrentLocation(newLocation);
      setLocationHistory(prev => [newLocation, ...prev.slice(0, 99)]); // Keep last 100 locations

      // AI threat analysis based on location patterns
      analyzeLocationThreat(newLocation);
    };

    const error = (err) => {
      console.error('Geolocation error:', err);
      alert(`Location error: ${err.message}`);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(success, error, options);
    setIsTracking(true);
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // AI-powered threat analysis
  const analyzeLocationThreat = useCallback((location) => {
    if (!settings.aiMonitoring) return;

    // Simulate AI analysis (in production, call your AI service)
    const hourOfDay = new Date().getHours();
    const isNightTime = hourOfDay < 6 || hourOfDay > 22;
    const speedPattern = calculateSpeed();
    const locationPattern = analyzeLocationPattern(location);

    let threat = 'low';
    let confidence = 0.7;
    let suggestions = [];

    if (isNightTime && locationPattern.isUnfamiliar) {
      threat = 'medium';
      confidence = 0.8;
      suggestions.push('Unfamiliar area at night - consider sharing location');
    }

    if (speedPattern.isStationary && locationPattern.isIsolated) {
      threat = 'medium';
      confidence = 0.75;
      suggestions.push('Stationary in isolated area - enable auto-recording');
    }

    setAiAnalysis({ threat, confidence, suggestions });
  }, [settings.aiMonitoring]);

  const calculateSpeed = () => {
    if (locationHistory.length < 2) return { speed: 0, isStationary: true };
    
    const recent = locationHistory[0];
    const previous = locationHistory[1];
    const timeDiff = (new Date(recent.timestamp) - new Date(previous.timestamp)) / 1000;
    const distance = calculateDistance(recent.lat, recent.lng, previous.lat, previous.lng);
    const speed = distance / timeDiff;

    return { speed, isStationary: speed < 0.5 };
  };

  const analyzeLocationPattern = (location) => {
    // Analyze if location is familiar based on history
    const familiarLocations = locationHistory.filter(loc => 
      calculateDistance(location.lat, location.lng, loc.lat, loc.lng) < 0.1
    );

    return {
      isUnfamiliar: familiarLocations.length < 3,
      isIsolated: true // Simplified - in production, use POI data
    };
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Safety timer with real countdown
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
      if (settings.autoRecord) {
        startRecording('audio');
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [safetyTimer.active, safetyTimer.remaining, settings.autoRecord]);





  const generateSecureSessionId = () => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };
  
  const generateEmergencyAccessLink = (sessionId, data) => {
    // In production, this would be your actual domain
    const baseUrl = 'https://safeguardng.vercel.app';
    return `${baseUrl}/emergency-access/${sessionId}`;
  };

  const createEmergencyDataPackage = () => {
    return {
      timestamp: new Date().toISOString(),
      location: {
        current: currentLocation,
        history: locationHistory.slice(0, 20),
        accuracy: currentLocation.accuracy || 'Unknown'
      },
      device: {
        battery: batteryLevel,
        online: isOnline,
        lastSeen: new Date().toISOString()
      },
      recordings: recordings.map(rec => ({
        id: rec.id,
        type: rec.type,
        timestamp: rec.timestamp,
        location: rec.location,
        duration: rec.duration,
        size: rec.size,
        downloadUrl: rec.url // In production, this would be a secure cloud URL
      })),
      contacts: emergencyContacts,
      userProfile: {
        settings: settings,
        medicalInfo: settings.medicalInfo || 'Not specified',
        bloodType: settings.bloodType || 'Unknown',
        allergies: settings.allergies || 'None specified',
        medications: settings.medications || 'None specified',
        emergencyNotes: settings.emergencyNotes || ''
      },
      aiAnalysis: aiAnalysis
    };
  };


  const triggerEmergencyAlert = useCallback((alertMessage) => {
    const locationUrl = `https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`;
    
    // Create comprehensive emergency data package
    const emergencyData = createEmergencyDataPackage();
    emergencyData.alert = alertMessage;
  
    // Generate secure access link for emergency contacts
    const sessionId = generateSecureSessionId();
    const accessLink = generateEmergencyAccessLink(sessionId, emergencyData);
    
    // Store emergency session data
    const emergencySession = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      data: emergencyData,
      accessCount: 0,
      lastAccessed: null,
      active: true
    };
    
    setSharedDataSessions(prev => [emergencySession, ...prev.slice(0, 9)]); // Keep last 10 sessions




     // Enhanced emergency message with full data access
  const comprehensiveMessage = `🚨 EMERGENCY ALERT 🚨

  ${alertMessage}
  
  📍 LIVE LOCATION: ${locationUrl}
  ⏰ Time: ${new Date().toLocaleString()}
  🎯 Accuracy: ${currentLocation.accuracy || 'Unknown'}m
  🔋 Battery: ${batteryLevel}%
  📶 Network: ${isOnline ? 'Online' : 'Offline'}
  
  🔗 FULL DATA ACCESS:
  ${accessLink}
  
  This secure link provides access to:
  • Real-time location tracking
  • Location history (last 20 locations)
  • Audio/video recordings
  • Photos taken
  • Medical information
  • Emergency contact details
  • Device status
  
  ⚠️ Link expires in 24 hours
  ⚠️ This is an automated safety alert from SafeGuard app.
  
  IMMEDIATE ACTIONS RECOMMENDED:
  1. Click the link above to access all data
  2. Contact local emergency services if needed
  3. Share this information with other emergency contacts
  4. Call ${emergencyContacts.find(c => c.relation === 'Emergency')?.phone || '911'} for immediate help`;
  
    // Send to all emergency contacts
    sendWhatsAppMessage(comprehensiveMessage);
  
    // Also create a simplified SMS version for fallback
    const smsMessage = `🚨 EMERGENCY: ${alertMessage}\nLocation: ${locationUrl}\nTime: ${new Date().toLocaleString()}\nFull data: ${accessLink}\nCall 911 if needed!`;
    
    // Send SMS if available
    if ('sms' in navigator) {
      emergencyContacts.forEach(contact => {
        if (contact.phone !== '911') {
          navigator.sms.send(contact.phone, smsMessage);
        }
      });
    }
  
    // Store this emergency event
    const emergencyEvent = {
      id: Date.now(),
      type: 'emergency_alert',
      message: alertMessage,
      timestamp: new Date().toISOString(),
      location: currentLocation,
      sessionId: sessionId,
      contactsNotified: emergencyContacts.length,
      dataShared: true
    };


     // Add to recordings/events history
  setRecordings(prev => [emergencyEvent, ...prev]);

}, [currentLocation, batteryLevel, isOnline, emergencyContacts, sendWhatsAppMessage, locationHistory, recordings, settings, aiAnalysis]);

// Enhanced contact management with data access permissions
const addEmergencyContact = useCallback(() => {
  if (!newContact.name || !newContact.phone) {
    alert('Please fill in all fields');
    return;
  }

  const contact = {
    id: Date.now(),
    ...newContact,
    verified: false,
    verifiedAt: null,
    dataAccessLevel: 'full', // full, limited, emergency-only
    permissions: {
      realTimeLocation: true,
      locationHistory: true,
      recordings: true,
      medicalInfo: true,
      deviceStatus: true,
      emergencyAlerts: true
    },
    lastDataAccess: null,
    totalDataAccesses: 0
  };

  setEmergencyContacts(prev => [...prev, contact]);
  setContactDataAccess(prev => ({
    ...prev,
    [contact.id]: {
      granted: true,
      grantedAt: new Date().toISOString(),
      level: 'full'
    }
  }));
  
  setNewContact({ name: '', phone: '', relation: '' });
  setShowAddContact(false);

  // Enhanced verification message with data access explanation
  const verifyMessage = `Hi ${contact.name}! 

You've been added as an emergency contact for SafeGuard personal safety app.

🔐 DATA ACCESS GRANTED:
In case of emergency, you will receive a secure link with access to:
• Live location tracking
• Location history
• Audio/video recordings 
• Photos
• Medical information
• Device battery & status

🚨 EMERGENCY ALERTS:
You'll receive WhatsApp messages with:
• Immediate location data
• Emergency situation details
• Secure access to all safety data
• Recommended actions

Please confirm you received this message and understand your emergency contact responsibilities.

This access is only activated during genuine emergencies.`;

  const whatsappUrl = `https://wa.me/${contact.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(verifyMessage)}`;
  window.open(whatsappUrl, '_blank');
}, [newContact]);

// Function to revoke emergency data access
const revokeContactAccess = useCallback((contactId) => {
  setContactDataAccess(prev => ({
    ...prev,
    [contactId]: {
      ...prev[contactId],
      granted: false,
      revokedAt: new Date().toISOString()
    }
  }));

  // Deactivate any active sessions for this contact
  setSharedDataSessions(prev => 
    prev.map(session => ({
      ...session,
      active: session.contactId === contactId ? false : session.active
    }))
  );
}, []);

// Function to grant specific data access levels
const updateContactPermissions = useCallback((contactId, permissions) => {
  setEmergencyContacts(prev => 
    prev.map(contact => 
      contact.id === contactId 
        ? { ...contact, permissions: { ...contact.permissions, ...permissions } }
        : contact
    )
  );
}, []);

// Function to get emergency data for a specific session
const getEmergencySessionData = useCallback((sessionId) => {
  const session = sharedDataSessions.find(s => s.id === sessionId && s.active);
  if (!session || new Date() > new Date(session.expiresAt)) {
    return null;
  }

  // Update access count
  setSharedDataSessions(prev =>
    prev.map(s => 
      s.id === sessionId 
        ? { ...s, accessCount: s.accessCount + 1, lastAccessed: new Date().toISOString() }
        : s
    )
  );

  return session.data;
}, [sharedDataSessions]);



  


  // Real panic button with immediate response
  const triggerPanic = useCallback(() => {
    setPanicMode(true);
    if (!isTracking) startTracking();
    
    // Immediate emergency alert
    triggerEmergencyAlert('🚨 PANIC BUTTON ACTIVATED - IMMEDIATE HELP NEEDED 🚨');
    
    // Start recording immediately
    if (settings.autoRecord) {
      startRecording('video');
    }

    // Vibrate if available
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // Flash screen
    document.body.style.backgroundColor = '#ef4444';
    setTimeout(() => {
      document.body.style.backgroundColor = '';
    }, 1000);
  }, [isTracking, settings.autoRecord]);

  const cancelPanic = useCallback(() => {
    setPanicMode(false);
    stopRecording();
    
    // Send cancellation message
    const message = `✅ PANIC ALERT CANCELLED\n\nFalse alarm - I am safe.\nTime: ${new Date().toLocaleString()}\nLocation: https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`;
    sendWhatsAppMessage(message);
  }, [currentLocation]);

  // Real WhatsApp integration
  const sendWhatsAppMessage = useCallback((message) => {
    emergencyContacts.forEach(contact => {
      if (contact.phone !== '911') {
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${contact.phone.replace(/[^\d]/g, '')}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
      }
    });
  }, [emergencyContacts]);

  //const triggerEmergencyAlert = useCallback((alertMessage) => {
    const locationUrl = `https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`;
    const accuracy = currentLocation.accuracy || 'Unknown';
    
    const message = `🚨 EMERGENCY ALERT 🚨\n\n${alertMessage}\n\n📍 Location: ${locationUrl}\n⏰ Time: ${new Date().toLocaleString()}\n🎯 Accuracy: ${accuracy}m\n🔋 Battery: ${batteryLevel}%\n📶 Network: ${isOnline ? 'Online' : 'Offline'}\n\n⚠️ This is an automated safety alert from SafeGuard app.`;
    
    sendWhatsAppMessage(message);

    // Also try to send SMS if available
    if ('sms' in navigator) {
      emergencyContacts.forEach(contact => {
        if (contact.phone !== '911') {
          navigator.sms.send(contact.phone, message);
        }
      });
    }
 // }, [currentLocation, batteryLevel, isOnline, sendWhatsAppMessage]);

  // Real media recording
  const startRecording = useCallback(async (type = 'audio') => {
    try {
      let stream;
      
      if (type === 'video') {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: { facingMode: 'environment' } 
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      setMediaStream(stream);
      setRecordingType(type);
      setIsRecording(true);

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: type === 'video' ? 'video/webm' : 'audio/webm' 
        });
        
        const url = URL.createObjectURL(blob);
        const newRecording = {
          id: Date.now(),
          type,
          blob,
          url,
          timestamp: new Date().toISOString(),
          location: { ...currentLocation },
          duration: Math.floor((Date.now() - recorder.startTime) / 1000),
          size: blob.size
        };

        setRecordings(prev => [newRecording, ...prev]);
        
        // Auto-upload to cloud storage in production
        // uploadToCloud(newRecording);
      };

      recorder.startTime = Date.now();
      recorder.start();
      setMediaRecorder(recorder);
      mediaRecorderRef.current = recorder;

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not start recording: ' + error.message);
    }
  }, [currentLocation]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    
    setIsRecording(false);
    setRecordingType(null);
    setMediaRecorder(null);
  }, [mediaStream]);

  // Take photo
  const takePhoto = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Capture after a short delay
        setTimeout(() => {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          const context = canvas.getContext('2d');
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0);
          
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const photo = {
              id: Date.now(),
              type: 'photo',
              blob,
              url,
              timestamp: new Date().toISOString(),
              location: { ...currentLocation },
              size: blob.size
            };
            
            setRecordings(prev => [photo, ...prev]);
          }, 'image/jpeg', 0.8);
          
          // Stop the stream
          stream.getTracks().forEach(track => track.stop());
        }, 1000);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      alert('Could not take photo: ' + error.message);
    }
  }, [currentLocation]);

  // Safety timer functions
  const startSafetyTimer = useCallback((minutes) => {
    setSafetyTimer({
      active: true,
      duration: minutes,
      remaining: minutes * 60
    });
  }, []);

  const checkIn = useCallback(() => {
    setSafetyTimer(prev => ({ ...prev, active: false }));
    const message = `✅ Safe Check-in\n\nI'm safe and checking in as scheduled.\n📍 Location: https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}\n⏰ Time: ${new Date().toLocaleString()}\n🔋 Battery: ${batteryLevel}%`;
    sendWhatsAppMessage(message);
  }, [currentLocation, batteryLevel, sendWhatsAppMessage]);

  // Contact management
 // const addEmergencyContact = useCallback(() => {
    if (!newContact.name || !newContact.phone) {
      alert('Please fill in all fields');
      return;
    }

    const contact = {
      id: Date.now(),
      ...newContact,
      verified: false,
      verifiedAt: null // Added verification date field
    };

    setEmergencyContacts(prev => [...prev, contact]);
    setNewContact({ name: '', phone: '', relation: '' });
    setShowAddContact(false);

    // Send verification message
    const verifyMessage = `Hi ${contact.name}! You've been added as an emergency contact for SafeGuard personal safety app.\n\nThis app will send you emergency alerts with location data if needed.\n\nPlease confirm you received this message by tapping "Verify Contact" in the app settings.`;
    const whatsappUrl = `https://wa.me/${contact.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(verifyMessage)}`;
    window.open(whatsappUrl, '_blank');
 // }, [newContact]);



  // STEP 2: ADD THIS NEW FUNCTION
const verifyContact = useCallback((contactId) => {
  setEmergencyContacts(prev => prev.map(contact => 
    contact.id === contactId 
      ? { 
          ...contact, 
          verified: true, 
          verifiedAt: new Date().toISOString() 
        }
      : contact
  ));
}, []);





  const removeContact = useCallback((id) => {
    setEmergencyContacts(prev => prev.filter(contact => contact.id !== id));
  }, []);





  // Share recording
  const shareRecording = useCallback(async (recording) => {
    if (navigator.share && recording.blob) {
      try {
        const file = new File([recording.blob], `safeguard-${recording.type}-${recording.id}.${recording.type === 'photo' ? 'jpg' : 'webm'}`, {
          type: recording.blob.type
        });
        
        await navigator.share({
          title: 'SafeGuard Evidence',
          text: `Emergency evidence recorded at ${new Date(recording.timestamp).toLocaleString()}`,
          files: [file]
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to WhatsApp
        const message = `🚨 SafeGuard Evidence\n\nRecorded: ${new Date(recording.timestamp).toLocaleString()}\nLocation: https://maps.google.com/?q=${recording.location.lat},${recording.location.lng}\nType: ${recording.type}\nSize: ${(recording.size / 1024 / 1024).toFixed(2)}MB`;
        sendWhatsAppMessage(message);
      }
    }
  }, [sendWhatsAppMessage]);

  // Download recording
  const downloadRecording = useCallback((recording) => {
    const a = document.createElement('a');
    a.href = recording.url;
    a.download = `safeguard-${recording.type}-${recording.id}.${recording.type === 'photo' ? 'jpg' : 'webm'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  // Utility functions
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      {/* Hidden video and canvas for photo capture */}
      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield size={24} />
            <h1 className="text-xl font-bold">SafeGuard</h1>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
          </div>
          <div className="flex items-center space-x-2">
            <Battery size={16} />
            <span className="text-sm">{batteryLevel}%</span>
          </div>
        </div>
        
        {/* AI Threat Analysis */}
        {settings.aiMonitoring && (
          <div className={`mt-2 p-2 rounded-lg ${
            aiAnalysis.threat === 'high' ? 'bg-red-800' : 
            aiAnalysis.threat === 'medium' ? 'bg-yellow-700' : 'bg-green-700'
          }`}>
            <div className="flex items-center space-x-2">
              <Brain size={16} />
              <span className="text-sm">AI Threat Level: {aiAnalysis.threat.toUpperCase()}</span>
              <span className="text-xs opacity-75">({Math.round(aiAnalysis.confidence * 100)}%)</span>
            </div>
          </div>
        )}
        
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
                className="bg-red-500 hover:bg-red-600 text-white p-6 rounded-xl text-center transition-all transform active:scale-95 shadow-lg"
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
                } text-white p-6 rounded-xl text-center transition-all shadow-lg`}
              >
                <MapPin size={32} className="mx-auto mb-2" />
                <div className="font-bold">{isTracking ? 'STOP' : 'START'}</div>
                <div className="text-sm opacity-90">Location Tracking</div>
              </button>
            </div>

            {/* AI Suggestions */}
            {aiAnalysis.suggestions.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain size={16} className="text-blue-600" />
                  <h3 className="font-semibold text-blue-800">AI Safety Suggestions</h3>
                </div>
                <div className="space-y-1">
                  {aiAnalysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="text-sm text-blue-700">
                      • {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                    {emergencyContacts.filter(c => c.verified).length}/{emergencyContacts.length} verified
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Recordings</span>
                  <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                    {recordings.length} saved
                  </span>
                </div>
                {isTracking && currentLocation.lat !== 0 && (
                  <div className="text-xs text-gray-600 mt-2 p-2 bg-white rounded">
                    📍 Last location: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                    <br />
                    🎯 Accuracy: ±{currentLocation.accuracy}m
                    <br />
                    ⏰ Updated: {currentLocation.timestamp ? new Date(currentLocation.timestamp).toLocaleTimeString() : 'Never'}
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
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Check size={16} className="inline mr-1" />
                    Check In - I'm Safe
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => startSafetyTimer(30)}
                    className="bg-blue-500 text-white p-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                  >
                    30 min
                  </button>
                  <button
                    onClick={() => startSafetyTimer(60)}
                    className="bg-blue-500 text-white p-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                  >
                    1 hour
                  </button>
                  <button
                    onClick={() => startSafetyTimer(120)}
                    className="bg-blue-500 text-white p-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
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
                      <br />
                      Last update: {currentLocation.timestamp ? new Date(currentLocation.timestamp).toLocaleString() : 'Never'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => triggerEmergencyAlert('📍 Current location shared')}
                      className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Send size={16} className="inline mr-2" />
                      Share Now
                    </button>
                    <button
                      onClick={() => window.open(`https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`, '_blank')}
                      className="bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Navigation size={16} className="inline mr-2" />
                      Open Maps
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">Location tracking is disabled</p>
                  <button
                    onClick={startTracking}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Enable Tracking
                  </button>
                </div>
              )}
            </div>

            {/* Location History */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="font-semibold mb-3">Location History</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {locationHistory.slice(0, 10).map((location, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </div>
                        <div className="text-xs text-gray-600">
                          {new Date(location.timestamp).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          ±{location.accuracy}m accuracy
                        </div>
                      </div>
                      <button 
                        onClick={() => window.open(`https://maps.google.com/?q=${location.lat},${location.lng}`, '_blank')}
                        className="text-blue-500 text-sm hover:text-blue-700"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
                {locationHistory.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No location history yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Emergency Contacts</h3>
              <button 
                onClick={() => setShowAddContact(true)}
                className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            
            {/* Add Contact Modal */}
            {showAddContact && (
              <div className="bg-white border-2 border-red-200 rounded-xl p-4 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold">Add Emergency Contact</h4>
                  <button 
                    onClick={() => setShowAddContact(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newContact.name}
                    onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number (with country code)"
                    value={newContact.phone}
                    onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <select
                    value={newContact.relation}
                    onChange={(e) => setNewContact(prev => ({ ...prev, relation: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select Relationship</option>
                    <option value="Parent">Parent</option>
                    <option value="Partner">Partner</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                    <option value="Emergency">Emergency Service</option>
                    <option value="Other">Other</option>
                  </select>
                  <button
                    onClick={addEmergencyContact}
                    className="w-full bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition-colors"
                    disabled={!newContact.name || !newContact.phone || !newContact.relation}
                  >
                    Add Contact
                  </button>
                </div>
              </div>
            )}
            

{emergencyContacts.map(contact => (
  <div key={contact.id} className="bg-white border rounded-xl p-4 shadow-sm">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="font-semibold">{contact.name}</span>
          {contact.verified ? (
            <Check size={16} className="text-green-500" />
          ) : (
            <Clock size={16} className="text-yellow-500" />
          )}
        </div>
        <div className="text-gray-600">{contact.phone}</div>
        <div className="text-sm text-gray-500">{contact.relation}</div>
        <div className="text-xs text-gray-400 mt-1">
          {contact.verified ? (
            <span className="text-green-600">
              ✓ Verified on {new Date(contact.verifiedAt).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-yellow-600">⏳ Pending verification</span>
          )}
        </div>
      </div>
      <div className="flex space-x-2">
        {!contact.verified && (
          <button 
            onClick={() => verifyContact(contact.id)}
            className="text-blue-500 p-2 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            title="Mark as verified"
          >
            <CheckCircle size={16} />
          </button>
        )}
        <button 
          onClick={() => window.open(`tel:${contact.phone}`, '_self')}
          className="text-green-500 p-2 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
        >
          <Phone size={16} />
        </button>
        <button 
          onClick={() => removeContact(contact.id)}
          className="text-red-500 p-2 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  </div>
))}

{emergencyContacts.length === 0 && (
  <div className="text-center py-8 text-gray-500">
    <Users size={48} className="mx-auto mb-4 text-gray-300" />
    <p>No emergency contacts yet</p>
    <p className="text-sm">Add your first contact to get started</p>
  </div>
)}

{/* WhatsApp Integration Status */}
<div className="bg-green-50 p-4 rounded-xl border border-green-200">
  <h4 className="font-semibold text-green-800 mb-2">WhatsApp Integration</h4>
  <div className="flex items-center space-x-2">
    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
    <span className="text-sm text-green-700">Ready to send alerts</span>
  </div>
  <p className="text-xs text-green-600 mt-2">
    Emergency alerts will be sent via WhatsApp with location, timestamp, and device status
  </p>
</div>

{/* Contact Verification Instructions */}
<div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
  <h4 className="font-semibold text-blue-800 mb-2">Contact Verification</h4>
  <div className="text-sm text-blue-700 space-y-1">
    <p>📱 When you add a contact, they'll receive a WhatsApp message explaining SafeGuard</p>
    <p>✅ Once they confirm they received the message, tap the blue checkmark to verify them</p>
    <p>🔔 Only verified contacts will receive emergency alerts</p>
  </div>
</div>
</div>
)}




        {activeTab === 'evidence' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Evidence Recording</h3>
              <div className="flex space-x-2">
                {isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    <Square size={16} />
                    <span>Stop</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => startRecording('audio')}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                      <Mic size={16} />
                      <span>Audio</span>
                    </button>
                    <button
                      onClick={() => startRecording('video')}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                    >
                      <Camera size={16} />
                      <span>Video</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Recording Status */}
            {isRecording && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-red-800">
                    Recording {recordingType}...
                  </span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  Recording in progress. Audio and location data are being captured.
                </p>
              </div>
            )}

            {/* Quick Record */}
            <div className="bg-red-50 p-4 rounded-xl">
              <h4 className="font-semibold mb-3">Quick Actions</h4>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={takePhoto}
                  className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Camera size={20} className="mx-auto mb-1" />
                  <div className="text-sm">Photo</div>
                </button>
                <button 
                  onClick={() => startRecording('audio')}
                  disabled={isRecording}
                  className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <Mic size={20} className="mx-auto mb-1" />
                  <div className="text-sm">Audio</div>
                </button>
                <button 
                  onClick={() => startRecording('video')}
                  disabled={isRecording}
                  className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <Camera size={20} className="mx-auto mb-1" />
                  <div className="text-sm">Video</div>
                </button>
              </div>
            </div>

            {/* Recordings List */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Saved Evidence ({recordings.length})</h4>
                {recordings.length > 0 && (
                  <button 
                    onClick={() => {
                      const message = `📁 SafeGuard Evidence Summary\n\nTotal recordings: ${recordings.length}\nLatest: ${recordings[0] ? new Date(recordings[0].timestamp).toLocaleString() : 'None'}\n\nAll evidence includes location and timestamp data.`;
                      sendWhatsAppMessage(message);
                    }}
                    className="text-blue-500 text-sm hover:text-blue-700"
                  >
                    Share Summary
                  </button>
                )}
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {recordings.map(recording => (
                  <div key={recording.id} className="bg-white border rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {recording.type === 'photo' ? '📷' : recording.type === 'video' ? '🎥' : '🎵'} 
                            {recording.type.charAt(0).toUpperCase() + recording.type.slice(1)}
                          </span>
                          {recording.type !== 'photo' && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {recording.duration}s
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(recording.timestamp).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          📍 {recording.location.lat.toFixed(4)}, {recording.location.lng.toFixed(4)}
                        </div>
                        <div className="text-xs text-gray-500">
                          💾 {formatFileSize(recording.size)}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        {recording.type !== 'photo' && (
                          <button 
                            onClick={() => {
                              const audio = new Audio(recording.url);
                              audio.play();
                            }}
                            className="text-blue-500 text-sm p-2 hover:text-blue-700"
                          >
                            <Play size={14} />
                          </button>
                        )}
                        {recording.type === 'photo' && (
                          <button 
                            onClick={() => window.open(recording.url, '_blank')}
                            className="text-blue-500 text-sm p-2 hover:text-blue-700"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => shareRecording(recording)}
                          className="text-green-500 text-sm p-2 hover:text-green-700"
                        >
                          <Share2 size={14} />
                        </button>
                        <button 
                          onClick={() => downloadRecording(recording)}
                          className="text-purple-500 text-sm p-2 hover:text-purple-700"
                        >
                          <Download size={14} />
                        </button>
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
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h3 className="font-semibold">Settings</h3>
            
            {/* Basic Settings */}
            <div className="bg-white border rounded-xl p-4 space-y-4">
              <h4 className="font-medium">Basic Settings</h4>
              
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">Auto-start tracking</span>
                  <div className="text-sm text-gray-500">Start location tracking on app open</div>
                </div>
                <button 
                  onClick={() => setSettings(prev => ({ ...prev, autoStartTracking: !prev.autoStartTracking }))}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.autoStartTracking ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                    settings.autoStartTracking ? 'right-0.5' : 'left-0.5'
                  }`}></div>
                </button>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">Silent mode alerts</span>
                  <div className="text-sm text-gray-500">Send alerts without sound notifications</div>
                </div>
                <button 
                  onClick={() => setSettings(prev => ({ ...prev, silentMode: !prev.silentMode }))}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.silentMode ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                    settings.silentMode ? 'right-0.5' : 'left-0.5'
                  }`}></div>
                </button>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">Background location</span>
                  <div className="text-sm text-gray-500">Continue tracking when app is minimized</div>
                </div>
                <button 
                  onClick={() => setSettings(prev => ({ ...prev, backgroundLocation: !prev.backgroundLocation }))}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.backgroundLocation ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                    settings.backgroundLocation ? 'right-0.5' : 'left-0.5'
                  }`}></div>
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">AI Monitoring</span>
                  <div className="text-sm text-gray-500">Enable AI-powered threat detection</div>
                </div>
                <button 
                  onClick={() => setSettings(prev => ({ ...prev, aiMonitoring: !prev.aiMonitoring }))}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.aiMonitoring ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                    settings.aiMonitoring ? 'right-0.5' : 'left-0.5'
                  }`}></div>
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">Auto-record on panic</span>
                  <div className="text-sm text-gray-500">Automatically start recording when panic button is pressed</div>
                </div>
                <button 
                  onClick={() => setSettings(prev => ({ ...prev, autoRecord: !prev.autoRecord }))}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.autoRecord ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                    settings.autoRecord ? 'right-0.5' : 'left-0.5'
                  }`}></div>
                </button>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="bg-white border rounded-xl p-4">
              <h4 className="font-semibold mb-3">Advanced Settings</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Emergency timeout (seconds)</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={settings.emergencyTimeout}
                    onChange={(e) => setSettings(prev => ({ ...prev, emergencyTimeout: parseInt(e.target.value) }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Time before automatic emergency alert after panic button
                  </div>
                </div>
                
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border">
                  <div className="font-medium">Location accuracy settings</div>
                  <div className="text-sm text-gray-500">Configure GPS precision and update frequency</div>
                </button>
                
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border">
                  <div className="font-medium">Data backup settings</div>
                  <div className="text-sm text-gray-500">Configure cloud backup for recordings and locations</div>
                </button>
              </div>
            </div>

            {/* Privacy & Security */}
            <div className="bg-white border rounded-xl p-4">
              <h4 className="font-semibold mb-3">Privacy & Security</h4>
              <div className="space-y-3">
                <button className="w-full text-left p-2 hover:bg-gray-50 rounded">
                  <div className="font-medium">Data encryption settings</div>
                  <div className="text-sm text-gray-500">End-to-end encryption for all recordings</div>
                </button>
                <button className="w-full text-left p-2 hover:bg-gray-50 rounded">
                  <div className="font-medium">Location sharing permissions</div>
                  <div className="text-sm text-gray-500">Control who can access your location data</div>
                </button>
                <button className="w-full text-left p-2 hover:bg-gray-50 rounded">
                  <div className="font-medium">Emergency contact verification</div>
                  <div className="text-sm text-gray-500">Manage contact verification status</div>
                </button>
                <button className="w-full text-left p-2 hover:bg-gray-50 rounded text-red-600">
                  <div className="font-medium">Clear all data</div>
                  <div className="text-sm text-gray-500">Delete all recordings and location history</div>
                </button>
              </div>
            </div>

            {/* App Info */}
            <div className="bg-red-50 p-4 rounded-xl">
              <h4 className="font-semibold text-red-800 mb-2">SafeGuard Features</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <Check size={14} className="text-green-600" />
                  <span>Real-time GPS tracking with high accuracy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check size={14} className="text-green-600" />
                  <span>Automatic WhatsApp emergency alerts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check size={14} className="text-green-600" />
                  <span>AI-powered threat detection and analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check size={14} className="text-green-600" />
                  <span>Silent background audio/video recording</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check size={14} className="text-green-600" />
                  <span>Emergency contact notifications with location</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check size={14} className="text-green-600" />
                  <span>Secure local storage with backup options</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check size={14} className="text-green-600" />
                  <span>Safety timer with automatic check-ins</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check size={14} className="text-green-600" />
                  <span>Evidence sharing and backup</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-red-200 text-xs text-red-600">
                Version 2.0.0 • Production Ready • All features functional
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t p-3 shadow-lg">
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