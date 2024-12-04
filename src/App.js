import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Container, Box, Grid, Typography, CircularProgress } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

import { theme } from './theme';
import { useMQTT } from './hooks/useMQTT';
import { SensorReadings } from './components/SensorReadings';
import { ConnectionStatus } from './components/ConnectionStatus';
import { SensorChart } from './components/SensorChart';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const {
    isConnected,
    error,
    data,
    currentReadings,
  } = useMQTT(
    process.env.REACT_APP_MQTT_URL,
    process.env.REACT_APP_MQTT_USERNAME,
    process.env.REACT_APP_MQTT_PASSWORD,
    'hydroponic/data' // Updated to match ESP32's topic
  );

  // Subscribe to status messages as well
  const {
    isConnected: statusConnected,
    data: statusData,
  } = useMQTT(
    process.env.REACT_APP_MQTT_URL,
    process.env.REACT_APP_MQTT_USERNAME,
    process.env.REACT_APP_MQTT_PASSWORD,
    'hydroponic/status'
  );

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {error.message}</Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Hydroponic Monitoring System
          </Typography>
          
          <ErrorBoundary>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ConnectionStatus 
                  isConnected={isConnected} 
                  deviceStatus={statusConnected ? statusData : null}
                />
              </Grid>
              
              {!isConnected ? (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                </Grid>
              ) : (
                <>
                  <Grid item xs={12}>
                    <SensorReadings data={currentReadings} />
                  </Grid>
                  <Grid item xs={12}>
                    <SensorChart data={data} />
                  </Grid>
                </>
              )}
            </Grid>
          </ErrorBoundary>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
