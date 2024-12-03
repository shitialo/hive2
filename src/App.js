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
    'sensor/sht31'
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Container maxWidth="lg">
          <Box sx={{ my: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom align="center">
              ESP32 Sensor Dashboard
            </Typography>

            <ConnectionStatus isConnected={isConnected} error={error} />

            {!isConnected && !error && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            )}

            <Grid container spacing={3}>
              <SensorReadings
                temperature={currentReadings.temperature}
                humidity={currentReadings.humidity}
              />

              <Grid item xs={12}>
                <SensorChart data={data} />
              </Grid>
            </Grid>
          </Box>
        </Container>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
