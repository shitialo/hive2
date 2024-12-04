import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Box,
} from '@mui/material';
import {
  WaterDrop,
  Science,
  PlayArrow,
  Stop,
  Settings,
} from '@mui/icons-material';

const ControlButton = ({ label, icon: Icon, onClick, color = 'primary', disabled }) => (
  <Button
    variant="contained"
    color={color}
    onClick={onClick}
    disabled={disabled}
    startIcon={<Icon />}
    sx={{ width: '100%', mt: 1 }}
  >
    {label}
  </Button>
);

ControlButton.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  onClick: PropTypes.func.isRequired,
  color: PropTypes.string,
  disabled: PropTypes.bool,
};

const ControlSection = ({ title, children }) => (
  <Grid item xs={12} sm={6} md={4}>
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {children}
    </Paper>
  </Grid>
);

ControlSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export const ControlPanel = ({
  autoMode,
  pumpRunning,
  phAdjustment,
  onAutoModeToggle,
  onStartPump,
  onStopPump,
  onStartPhAdjustment,
  onStopPhAdjustment,
  onCalibrateSensors,
}) => (
  <Grid container spacing={3}>
    <ControlSection title="Operation Mode">
      <FormControlLabel
        control={
          <Switch
            checked={autoMode}
            onChange={onAutoModeToggle}
            color="primary"
          />
        }
        label={autoMode ? "Automatic Mode" : "Manual Mode"}
      />
    </ControlSection>

    <ControlSection title="Pump Control">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <ControlButton
          label={pumpRunning ? "Stop Pump" : "Start Pump"}
          icon={pumpRunning ? Stop : PlayArrow}
          onClick={pumpRunning ? onStopPump : onStartPump}
          color={pumpRunning ? "error" : "success"}
          disabled={autoMode}
        />
        <Typography variant="caption" color="text.secondary">
          {autoMode ? "Pump control disabled in auto mode" : "Manual pump control active"}
        </Typography>
      </Box>
    </ControlSection>

    <ControlSection title="pH Control">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <ControlButton
          label={phAdjustment ? "Stop pH Adjustment" : "Start pH Adjustment"}
          icon={Science}
          onClick={phAdjustment ? onStopPhAdjustment : onStartPhAdjustment}
          color={phAdjustment ? "error" : "success"}
          disabled={autoMode}
        />
      </Box>
    </ControlSection>

    <ControlSection title="System Maintenance">
      <ControlButton
        label="Calibrate Sensors"
        icon={Settings}
        onClick={onCalibrateSensors}
        color="info"
      />
    </ControlSection>
  </Grid>
);

ControlPanel.propTypes = {
  autoMode: PropTypes.bool.isRequired,
  pumpRunning: PropTypes.bool.isRequired,
  phAdjustment: PropTypes.bool.isRequired,
  onAutoModeToggle: PropTypes.func.isRequired,
  onStartPump: PropTypes.func.isRequired,
  onStopPump: PropTypes.func.isRequired,
  onStartPhAdjustment: PropTypes.func.isRequired,
  onStopPhAdjustment: PropTypes.func.isRequired,
  onCalibrateSensors: PropTypes.func.isRequired,
};
