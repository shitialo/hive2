import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Paper, Typography } from '@mui/material';
import { ThermostatAuto, WaterDrop } from '@mui/icons-material';

export const SensorReadings = ({ temperature, humidity }) => (
  <>
    <Grid item xs={12} md={6}>
      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <ThermostatAuto sx={{ fontSize: 40, color: 'primary.main' }} />
        <div>
          <Typography variant="h6" gutterBottom>
            Temperature
          </Typography>
          <Typography variant="h3">
            {temperature ? `${temperature.toFixed(1)}°C` : '--'}
          </Typography>
        </div>
      </Paper>
    </Grid>
    <Grid item xs={12} md={6}>
      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <WaterDrop sx={{ fontSize: 40, color: 'primary.main' }} />
        <div>
          <Typography variant="h6" gutterBottom>
            Humidity
          </Typography>
          <Typography variant="h3">
            {humidity ? `${humidity.toFixed(1)}%` : '--'}
          </Typography>
        </div>
      </Paper>
    </Grid>
  </>
);

SensorReadings.propTypes = {
  temperature: PropTypes.number,
  humidity: PropTypes.number,
};
