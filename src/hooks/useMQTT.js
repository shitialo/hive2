import { useState, useEffect, useCallback } from 'react';
import mqtt from 'mqtt';

export const useMQTT = (brokerUrl, username, password, topic) => {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [currentReadings, setCurrentReadings] = useState({ temperature: null, humidity: null });

  const connect = useCallback(() => {
    try {
      const mqttClient = mqtt.connect(brokerUrl, {
        username,
        password,
        protocol: 'wss',
        reconnectPeriod: 5000,
      });

      mqttClient.on('connect', () => {
        console.log('Connected to MQTT broker');
        setIsConnected(true);
        setError(null);
        mqttClient.subscribe(topic);
      });

      mqttClient.on('error', (err) => {
        console.error('MQTT error:', err);
        setError('Failed to connect to MQTT broker');
        setIsConnected(false);
      });

      mqttClient.on('message', (_, message) => {
        try {
          const parsedData = JSON.parse(message.toString());
          setCurrentReadings({
            temperature: parsedData.temperature,
            humidity: parsedData.humidity,
          });
          
          setData(prevData => {
            const newData = [...prevData, {
              ...parsedData,
              time: new Date().toLocaleTimeString(),
            }];
            return newData.slice(-20); // Keep last 20 readings
          });
        } catch (err) {
          console.error('Error parsing message:', err);
          setError('Failed to parse sensor data');
        }
      });

      mqttClient.on('disconnect', () => {
        setIsConnected(false);
        setError('Disconnected from MQTT broker');
      });

      mqttClient.on('offline', () => {
        setIsConnected(false);
        setError('MQTT client is offline');
      });

      setClient(mqttClient);

      return () => {
        if (mqttClient) {
          console.log('Cleaning up MQTT client');
          mqttClient.end();
        }
      };
    } catch (err) {
      console.error('Failed to create MQTT client:', err);
      setError('Failed to create MQTT client');
    }
  }, [brokerUrl, username, password, topic]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  return {
    isConnected,
    error,
    data,
    currentReadings,
  };
};
