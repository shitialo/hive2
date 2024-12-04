import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Slider,
  Button,
  Grid,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useFirebase } from '../hooks/useFirebase';

const ControlPanel = () => {
  const { updateControlSettings } = useFirebase();
  const [lightThreshold, setLightThreshold] = useState(500);
  const [pHTarget, setPHTarget] = useState(6.0);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLightThresholdChange = (event, newValue) => {
    setLightThreshold(newValue);
  };

  const handlePHTargetChange = (event, newValue) => {
    setPHTarget(newValue);
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateControlSettings({
        lightThreshold,
        pHTarget,
        lightThresholdUpdate: true,
        pHTargetUpdate: true
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
    setIsUpdating(false);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Control Panel
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography gutterBottom>
            Light Threshold: {lightThreshold}
          </Typography>
          <Slider
            value={lightThreshold}
            onChange={handleLightThresholdChange}
            min={0}
            max={1000}
            step={10}
            marks={[
              { value: 0, label: '0' },
              { value: 500, label: '500' },
              { value: 1000, label: '1000' },
            ]}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography gutterBottom>
            pH Target: {pHTarget.toFixed(1)}
          </Typography>
          <Slider
            value={pHTarget}
            onChange={handlePHTargetChange}
            min={5.0}
            max={7.0}
            step={0.1}
            marks={[
              { value: 5.0, label: '5.0' },
              { value: 6.0, label: '6.0' },
              { value: 7.0, label: '7.0' },
            ]}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpdate}
            disabled={isUpdating}
            fullWidth
          >
            {isUpdating ? 'Updating...' : 'Update Settings'}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ControlPanel;
