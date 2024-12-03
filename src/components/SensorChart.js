import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Box,
} from '@mui/material';

const timeRanges = {
  '1H': 3600000,
  '6H': 21600000,
  '24H': 86400000,
  '7D': 604800000,
};

const metrics = {
  vpd: { color: '#8884d8', label: 'VPD (kPa)' },
  ph: { color: '#82ca9d', label: 'pH' },
  waterLevel: { color: '#ffc658', label: 'Water Level (cm)' },
  reservoirVolume: { color: '#ff7300', label: 'Reservoir Volume (L)' },
  lightIntensity: { color: '#0088fe', label: 'Light Intensity' },
};

export const SensorChart = ({ data }) => {
  const [timeRange, setTimeRange] = useState('1H');
  const [selectedMetrics, setSelectedMetrics] = useState(['vpd', 'ph']);

  const handleTimeRangeChange = (event, newRange) => {
    if (newRange !== null) {
      setTimeRange(newRange);
    }
  };

  const handleMetricToggle = (event, newMetrics) => {
    if (newMetrics.length) {
      setSelectedMetrics(newMetrics);
    }
  };

  const filterData = () => {
    const cutoff = Date.now() - timeRanges[timeRange];
    return data.filter((point) => point.timestamp > cutoff);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Sensor Readings Over Time
        </Typography>
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={handleTimeRangeChange}
          size="small"
          sx={{ mb: 2 }}
        >
          {Object.keys(timeRanges).map((range) => (
            <ToggleButton key={range} value={range}>
              {range}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <ToggleButtonGroup
          value={selectedMetrics}
          onChange={handleMetricToggle}
          size="small"
          sx={{ ml: 2 }}
        >
          {Object.entries(metrics).map(([key, { label }]) => (
            <ToggleButton key={key} value={key}>
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={filterData()}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
          />
          <Legend />
          {selectedMetrics.map((metric) => (
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              stroke={metrics[metric].color}
              name={metrics[metric].label}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
};

SensorChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      timestamp: PropTypes.number.isRequired,
      vpd: PropTypes.number,
      ph: PropTypes.number,
      waterLevel: PropTypes.number,
      reservoirVolume: PropTypes.number,
      lightIntensity: PropTypes.number,
    })
  ).isRequired,
};
