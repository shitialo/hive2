import { useState, useEffect, useCallback, useRef } from 'react';
import mqtt from 'mqtt';

export const useMQTT = (brokerUrl, username, password, topic) => {
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
  });

  // Use ref to maintain data between renders
  const dataRef = useRef([]);

  const connect = useCallback(() => {
    try {
      const brokerUrl = process.env.REACT_APP_MQTT_BROKER_URL;
      const username = process.env.REACT_APP_MQTT_USERNAME;
      const password = process.env.REACT_APP_MQTT_PASSWORD;
      const topic = window.location.pathname.includes('status') 
        ? process.env.REACT_APP_MQTT_TOPIC_STATUS 
        : process.env.REACT_APP_MQTT_TOPIC_DATA;

      console.log('Connecting to MQTT broker:', brokerUrl);
      console.log('Using topic:', topic);
      
      const mqttClient = mqtt.connect(brokerUrl, {
        username,
        password,
        protocol: 'wss',
        reconnectPeriod: 5000,
        keepalive: 60,
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
        console.error('MQTT error:', err);
        setError('Failed to connect to MQTT broker');
        setIsConnected(false);
      });

      mqttClient.on('offline', () => {
        console.log('MQTT client offline');
        setIsConnected(false);
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
      console.error('MQTT connection error:', err);
      setError('Failed to establish MQTT connection');
    }
  }, [brokerUrl, username, password, topic]);

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
