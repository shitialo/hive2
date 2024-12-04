import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useFirebase } from '../hooks/useFirebase';
import PropTypes from 'prop-types';

const SensorReadings = () => {
  const theme = useTheme();
  const { sensorData, systemStatus } = useFirebase();

  if (!sensorData) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography>Loading sensor data...</Typography>
      </Paper>
    );
  }

  const isDataStale = sensorData.status === 'timeout';

  const readings = [
    { label: 'Temperature', value: sensorData.temperature?.toFixed(1) || 'N/A', unit: '°C' },
    { label: 'Humidity', value: sensorData.humidity?.toFixed(1) || 'N/A', unit: '%' },
    { label: 'VPD', value: sensorData.vpd?.toFixed(2) || 'N/A', unit: 'kPa' },
    { label: 'pH', value: sensorData.ph?.toFixed(2) || 'N/A', unit: '' },
    { label: 'Water Level', value: sensorData.waterLevel?.toFixed(1) || 'N/A', unit: 'cm' },
    { label: 'Reservoir Volume', value: sensorData.reservoirVolume?.toFixed(1) || 'N/A', unit: 'L' },
    { label: 'Light Intensity', value: sensorData.lightIntensity || 'N/A', unit: '' }
  ];

  const getStatusColor = (reading) => {
    if (isDataStale) return theme.palette.error.main;
    
    switch (reading.label) {
      case 'Temperature':
        return sensorData.temperature > 30 || sensorData.temperature < 20 
          ? theme.palette.warning.main 
          : theme.palette.success.main;
      case 'Humidity':
        return sensorData.humidity > 80 || sensorData.humidity < 40
          ? theme.palette.warning.main
          : theme.palette.success.main;
      case 'pH':
        return sensorData.ph > 6.5 || sensorData.ph < 5.5
          ? theme.palette.warning.main
          : theme.palette.success.main;
      case 'Water Level':
        return sensorData.waterLevel < 10
          ? theme.palette.error.main
          : theme.palette.success.main;
      default:
        return theme.palette.success.main;
    }
  };

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Sensor Readings {isDataStale && <span style={{ color: theme.palette.error.main }}>(Stale)</span>}
      </Typography>
      <Grid container spacing={2}>
        {readings.map((reading) => (
          <Grid item xs={6} sm={4} md={3} key={reading.label}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                borderLeft: 3,
                borderColor: getStatusColor(reading)
              }}
            >
              <Typography variant="subtitle2" color="textSecondary">
                {reading.label}
              </Typography>
              <Typography variant="h6">
                {reading.value} {reading.unit}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      {systemStatus && (
        <Typography 
          variant="body2" 
          color="textSecondary" 
          sx={{ mt: 2 }}
        >
          System Status: {systemStatus.status}
          {systemStatus.vpdPumpRunning && ' | VPD Pump Active'}
          {systemStatus.phAdjusting && ' | pH Adjusting'}
        </Typography>
      )}
    </Paper>
  );
};

SensorReadings.propTypes = {
  theme: PropTypes.object
};

export default SensorReadings;
