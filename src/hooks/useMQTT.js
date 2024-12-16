import { useState, useEffect, useCallback, useRef } from 'react';
import mqtt from 'mqtt';

const DATA_TIMEOUT = 10000; // 10 seconds timeout for data freshness

export const useMQTT = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [currentReadings, setCurrentReadings] = useState({
    temperature: null,
    humidity: null,
    vpd: null,
    ph: null,
    waterLevel: null,
    reservoirVolume: null,
    lightIntensity: null,
    vpdPumpRunning: false,
    phAdjusting: false,
    lastUpdate: null,
    status: 'No Data',
  });

  // Use ref to maintain data between renders
  const dataRef = useRef([]);
  const timeoutRef = useRef(null);

  // Function to clear readings
  const clearReadings = useCallback(() => {
    setCurrentReadings(prev => ({
      temperature: null,
      humidity: null,
      vpd: null,
      ph: null,
      waterLevel: null,
      reservoirVolume: null,
      lightIntensity: null,
      vpdPumpRunning: false,
      phAdjusting: false,
      lastUpdate: prev.lastUpdate,
      status: 'No Data',
    }));
  }, []);

  // Check data freshness
  useEffect(() => {
    const checkDataFreshness = () => {
      const now = Date.now();
      if (currentReadings.lastUpdate && (now - currentReadings.lastUpdate) > DATA_TIMEOUT) {
        clearReadings();
      }
    };

    // Set up interval to check data freshness
    const interval = setInterval(checkDataFreshness, 1000);

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentReadings.lastUpdate, clearReadings]);

  const connect = useCallback(() => {
    try {
      const brokerUrl = process.env.REACT_APP_MQTT_BROKER_URL;
      const username = process.env.REACT_APP_MQTT_USERNAME;
      const password = process.env.REACT_APP_MQTT_PASSWORD;
      const topic = process.env.REACT_APP_MQTT_TOPIC;

      console.log('Connecting to MQTT broker:', brokerUrl);
      
      const mqttClient = mqtt.connect(brokerUrl, {
        username,
        password,
        protocol: 'wss',
        reconnectPeriod: 5000,
        keepalive: 60,
        rejectUnauthorized: false, // Add this to bypass SSL certificate validation if needed
        clientId: `hydroponic_dashboard_${Math.random().toString(16).slice(2, 10)}`, // Add unique client ID
      });

      mqttClient.on('connect', () => {
        console.log('Connected to MQTT broker');
        setIsConnected(true);
        setError(null);
        mqttClient.subscribe(topic, (err) => {
          if (err) {
            console.error('Subscription error:', err);
            setError('Failed to subscribe to topic');
          } else {
            console.log('Subscribed to:', topic);
          }
        });
      });

      mqttClient.on('error', (err) => {
        console.error('MQTT connection error:', err);
        setError(`MQTT Connection Error: ${err.message}`);
        setIsConnected(false);
        clearReadings();
      });

      mqttClient.on('offline', () => {
        console.log('MQTT client offline');
        setIsConnected(false);
        setError('MQTT broker is offline');
        clearReadings();
      });

      mqttClient.on('message', (receivedTopic, message) => {
        try {
          const parsedData = JSON.parse(message.toString());
          
          // Convert timestamp to milliseconds if needed
          const timestamp = parsedData.timestamp * (parsedData.timestamp < 1000000000000 ? 1000 : 1);
          
          // Create data point
          const dataPoint = {
            ...parsedData,
            timestamp,
            lastUpdate: Date.now(),
            status: 'Active',
          };
          
          // Update current readings
          setCurrentReadings(dataPoint);
          
          // Update historical data using ref and state
          dataRef.current = [...dataRef.current, dataPoint]
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(-1000); // Keep last 1000 readings
          
          setHistoricalData(dataRef.current);
          
          console.log('Data point added:', dataPoint);
          console.log('Total data points:', dataRef.current.length);
          
          // Reset timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(clearReadings, DATA_TIMEOUT);
          
        } catch (err) {
          console.error('Error parsing message:', err);
          setError('Failed to parse sensor data');
        }
      });

      return () => {
        console.log('Cleaning up MQTT connection');
        mqttClient.end();
      };
    } catch (err) {
      console.error('MQTT connection setup error:', err);
      setError('Failed to establish MQTT connection');
    }
  }, [clearReadings]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      if (cleanup) cleanup();
    };
  }, [connect]);

  return {
    isConnected,
    error,
    data: historicalData,
    currentReadings,
  };
};
