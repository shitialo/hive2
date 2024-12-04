import { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, onValue, set, get } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyAcgvExvFKBu4ZuB1vC6_scQM9HPEgS9uc",
  authDomain: "aero-23f92.firebaseapp.com",
  databaseURL: "https://aero-23f92-default-rtdb.firebaseio.com",
  projectId: "aero-23f92",
  storageBucket: "aero-23f92.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export const useFirebase = () => {
  const [sensorData, setSensorData] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const dataTimeoutRef = useRef(null);

  useEffect(() => {
    const connectToFirebase = async () => {
      try {
        // Sign in with email and password
        await signInWithEmailAndPassword(auth, 'davechrom99@gmail.com', '0736502088');
        setIsConnected(true);
        setError(null);

        // Subscribe to sensor readings
        const sensorRef = ref(database, 'sensor_readings');
        onValue(sensorRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setSensorData(data);
            // Reset timeout
            if (dataTimeoutRef.current) clearTimeout(dataTimeoutRef.current);
            dataTimeoutRef.current = setTimeout(() => {
              setSensorData(prev => ({...prev, status: 'timeout'}));
            }, 10000); // 10 second timeout
          }
        });

        // Subscribe to system status
        const statusRef = ref(database, 'system_status');
        onValue(statusRef, (snapshot) => {
          const status = snapshot.val();
          if (status) {
            setSystemStatus(status);
          }
        });

      } catch (err) {
        setError(err.message);
        setIsConnected(false);
        console.error('Firebase connection error:', err);
      }
    };

    connectToFirebase();

    return () => {
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
      }
    };
  }, []);

  const updateControlSettings = async (settings) => {
    try {
      await set(ref(database, 'control'), settings);
      return true;
    } catch (err) {
      console.error('Error updating control settings:', err);
      return false;
    }
  };

  const getHistoricalData = async (duration) => {
    try {
      const sensorRef = ref(database, 'sensor_readings');
      const snapshot = await get(sensorRef);
      const data = snapshot.val();
      
      if (!data) return [];

      const now = Date.now();
      const cutoff = now - duration;
      
      return Object.entries(data)
        .filter(([_, reading]) => reading.timestamp * 1000 > cutoff)
        .map(([_, reading]) => reading)
        .sort((a, b) => a.timestamp - b.timestamp);
    } catch (err) {
      console.error('Error fetching historical data:', err);
      return [];
    }
  };

  return {
    sensorData,
    systemStatus,
    isConnected,
    error,
    updateControlSettings,
    getHistoricalData
  };
};
