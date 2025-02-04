import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Paper, Typography, Box } from '@mui/material';
import {
  ThermostatAuto,
  WaterDrop,
  Opacity,
  Science,
  WbSunny,
  Speed,
  Warning,
} from '@mui/icons-material';

const ReadingCard = ({ title, value, unit, icon: Icon, color = 'primary', precision = 1 }) => (
  <Grid item xs={12} sm={6} md={4}>
    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Icon sx={{ fontSize: 40, color: `${color}.main` }} />
      <Box>
        <Typography variant="subtitle1" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4">
          {typeof value === 'number'
            ? `${Number(value).toFixed(precision)}${unit}`
            : typeof value === 'string'
            ? value
            : '--'}
        </Typography>
      </Box>
    </Paper>
  </Grid>
);

ReadingCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  unit: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string,
  precision: PropTypes.number,
};

const SensorReadings = ({ data }) => {
  if (!data) {
    return null;
  }

  const {
    temperature,
    humidity,
    vpd,
    ph,
    waterLevel,
    reservoirVolume,
    lightIntensity,
    vpdPumpRunning,
    phAdjusting,
  } = data;

  // Define warning thresholds
  const isVpdWarning = vpd > 1.2 || vpd < 0.8;
  const isPhWarning = ph > 6.5 || ph < 5.5;
  const isWaterLevelWarning = waterLevel < 10;

  // Calculate system status
  const systemStatus = vpdPumpRunning 
    ? "VPD Adjusting" 
    : phAdjusting 
    ? "pH Adjusting" 
    : "Normal";

  return (
    <Grid container spacing={3}>
      <ReadingCard
        title="Temperature"
        value={temperature}
        unit="°C"
        icon={ThermostatAuto}
      />
      <ReadingCard
        title="Humidity"
        value={humidity}
        unit="%"
        icon={WaterDrop}
      />
      <ReadingCard
        title="VPD"
        value={vpd}
        unit=" kPa"
        icon={Opacity}
        color={isVpdWarning ? 'error' : 'success'}
      />
      <ReadingCard
        title="pH Level"
        value={ph}
        unit=""
        icon={Science}
        color={isPhWarning ? 'error' : 'success'}
        precision={2}
      />
      <ReadingCard
        title="Water Level"
        value={waterLevel}
        unit=" cm"
        icon={Speed}
        color={isWaterLevelWarning ? 'warning' : 'success'}
      />
      <ReadingCard
        title="Reservoir Volume"
        value={reservoirVolume}
        unit=" L"
        icon={Speed}
      />
      <ReadingCard
        title="Light Intensity"
        value={lightIntensity}
        unit=" lux"
        icon={WbSunny}
      />
      <ReadingCard
        title="System Status"
        value={systemStatus}
        unit=""
        icon={Warning}
        color={systemStatus !== "Normal" ? 'warning' : 'success'}
      />
    </Grid>
  );
};

SensorReadings.propTypes = {
  data: PropTypes.shape({
    temperature: PropTypes.number,
    humidity: PropTypes.number,
    vpd: PropTypes.number,
    ph: PropTypes.number,
    waterLevel: PropTypes.number,
    reservoirVolume: PropTypes.number,
    lightIntensity: PropTypes.number,
    vpdPumpRunning: PropTypes.bool,
    phAdjusting: PropTypes.bool,
  }),
};

export { SensorReadings };
