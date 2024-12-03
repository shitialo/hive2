import { useState, useEffect, useCallback } from 'react';
import mqtt from 'mqtt';

export const useMQTT = (brokerUrl, username, password, topic) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
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

  const connect = useCallback(() => {
    try {
      console.log('Connecting to MQTT broker:', brokerUrl);
      console.log('Topic:', topic);
      
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

      mqttClient.on('reconnect', () => {
        console.log('Attempting to reconnect to MQTT broker');
      });

      mqttClient.on('message', (receivedTopic, message) => {
        console.log('Received message on topic:', receivedTopic);
        console.log('Message:', message.toString());
        
        try {
          const parsedData = JSON.parse(message.toString());
          
          // Update current readings with all sensor data
          setCurrentReadings(parsedData);
          
          // Add timestamp and update historical data
          setData(prevData => {
            const newData = [...prevData, {
              ...parsedData,
              timestamp: parsedData.timestamp || Date.now(),
            }];
            return newData.slice(-100); // Keep last 100 readings
          });
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
    data,
    currentReadings,
  };
};
