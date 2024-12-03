import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Box, Typography, Paper, Grid } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import mqtt from 'mqtt';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const [sensorData, setSensorData] = useState([]);
  const [currentTemp, setCurrentTemp] = useState(null);
  const [currentHumidity, setCurrentHumidity] = useState(null);
  const [client, setClient] = useState(null);

  useEffect(() => {
    // MQTT Connection setup
    const mqttClient = mqtt.connect(process.env.REACT_APP_MQTT_URL, {
      username: process.env.REACT_APP_MQTT_USERNAME,
      password: process.env.REACT_APP_MQTT_PASSWORD,
      protocol: 'wss',
    });

    mqttClient.on('connect', () => {
      console.log('Connected to MQTT broker');
      mqttClient.subscribe('sensor/sht31');
    });

    mqttClient.on('message', (topic, message) => {
      const data = JSON.parse(message.toString());
      setCurrentTemp(data.temperature);
      setCurrentHumidity(data.humidity);
      
      setSensorData(prevData => {
        const newData = [...prevData, {
          time: new Date().toLocaleTimeString(),
          temperature: data.temperature,
          humidity: data.humidity
        }];
        // Keep last 20 readings
        return newData.slice(-20);
      });
    });

    setClient(mqttClient);

    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            ESP32 Sensor Dashboard
          </Typography>

          <Grid container spacing={3}>
            {/* Current Readings */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Current Temperature
                </Typography>
                <Typography variant="h3">
                  {currentTemp ? `${currentTemp.toFixed(1)}°C` : '--'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Current Humidity
                </Typography>
                <Typography variant="h3">
                  {currentHumidity ? `${currentHumidity.toFixed(1)}%` : '--'}
                </Typography>
              </Paper>
            </Grid>

            {/* Charts */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Temperature & Humidity History
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={sensorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone"
                      dataKey="temperature"
                      stroke="#ff7300"
                      name="Temperature (°C)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="humidity"
                      stroke="#82ca9d"
                      name="Humidity (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
