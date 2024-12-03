import React from 'react';
import PropTypes from 'prop-types';
import { Paper, Typography, Alert } from '@mui/material';
import { CloudDone, CloudOff } from '@mui/icons-material';

export const ConnectionStatus = ({ isConnected, error }) => (
  <Paper sx={{ p: 2, mb: 2 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {isConnected ? (
        <CloudDone color="success" sx={{ fontSize: 30 }} />
      ) : (
        <CloudOff color="error" sx={{ fontSize: 30 }} />
      )}
      <Typography variant="h6">
        {isConnected ? 'Connected to MQTT' : 'Disconnected'}
      </Typography>
    </div>
    {error && (
      <Alert severity="error" sx={{ mt: 1 }}>
        {error}
      </Alert>
    )}
  </Paper>
);

ConnectionStatus.propTypes = {
  isConnected: PropTypes.bool.isRequired,
  error: PropTypes.string,
};
