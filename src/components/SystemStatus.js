import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Paper, Typography, Box } from '@mui/material';
import {
  Opacity,
  Science,
  WaterDrop,
  WbSunny,
  Speed,
  Warning,
} from '@mui/icons-material';

const StatusCard = ({ title, value, unit, icon: Icon, color = 'primary' }) => (
  <Grid item xs={12} sm={6} md={4}>
    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Icon sx={{ fontSize: 40, color: `${color}.main` }} />
      <Box>
        <Typography variant="subtitle1" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4">
          {typeof value === 'number' ? value.toFixed(2) : value}
          {unit && <Typography component="span" variant="h6"> {unit}</Typography>}
        </Typography>
      </Box>
    </Paper>
  </Grid>
);

StatusCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  unit: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string,
};

export const SystemStatus = ({
  vpd,
  pH,
  waterLevel,
  reservoirVolume,
  lightIntensity,
  isVPDPumping,
  isPHAdjusting,
}) => (
  <Grid container spacing={3}>
    <StatusCard
      title="VPD"
      value={vpd}
      unit="kPa"
      icon={Opacity}
      color={vpd > 1.2 || vpd < 0.8 ? 'error' : 'success'}
    />
    <StatusCard
      title="pH Level"
      value={pH}
      icon={Science}
      color={pH > 6.5 || pH < 5.5 ? 'error' : 'success'}
    />
    <StatusCard
      title="Water Level"
      value={waterLevel}
      unit="cm"
      icon={WaterDrop}
      color={waterLevel < 10 ? 'warning' : 'success'}
    />
    <StatusCard
      title="Reservoir Volume"
      value={reservoirVolume}
      unit="L"
      icon={Speed}
      color={reservoirVolume < 1000 ? 'warning' : 'success'}
    />
    <StatusCard
      title="Light Intensity"
      value={lightIntensity}
      icon={WbSunny}
      color={lightIntensity < 500 ? 'warning' : 'success'}
    />
    <StatusCard
      title="System Status"
      value={
        isVPDPumping
          ? 'VPD Adjusting'
          : isPHAdjusting
          ? 'pH Adjusting'
          : 'Normal'
      }
      icon={Warning}
      color={isVPDPumping || isPHAdjusting ? 'warning' : 'success'}
    />
  </Grid>
);

SystemStatus.propTypes = {
  vpd: PropTypes.number.isRequired,
  pH: PropTypes.number.isRequired,
  waterLevel: PropTypes.number.isRequired,
  reservoirVolume: PropTypes.number.isRequired,
  lightIntensity: PropTypes.number.isRequired,
  isVPDPumping: PropTypes.bool.isRequired,
  isPHAdjusting: PropTypes.bool.isRequired,
};
