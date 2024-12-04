import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Container, Box, Grid, Typography } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

import { theme } from './theme';
import SensorReadings from './components/SensorReadings';
import ConnectionStatus from './components/ConnectionStatus';
import SensorChart from './components/SensorChart';
import ControlPanel from './components/ControlPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useFirebase } from './hooks/useFirebase';

function App() {
  const {
    sensorData,
    systemStatus,
    isConnected,
    error
  } = useFirebase();

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {error}</Typography>
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
          <ConnectionStatus isConnected={isConnected} />
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ErrorBoundary>
                <SensorReadings />
              </ErrorBoundary>
            </Grid>
            <Grid item xs={12} md={8}>
              <ErrorBoundary>
                <SensorChart />
              </ErrorBoundary>
            </Grid>
            <Grid item xs={12} md={4}>
              <ErrorBoundary>
                <ControlPanel />
              </ErrorBoundary>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
