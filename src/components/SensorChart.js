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
  temperature: { color: '#ff4444', label: 'Temperature (°C)' },
  humidity: { color: '#33b5e5', label: 'Humidity (%)' },
  vpd: { color: '#8884d8', label: 'VPD (kPa)' },
  ph: { color: '#82ca9d', label: 'pH' },
  waterLevel: { color: '#ffc658', label: 'Water Level (cm)' },
  reservoirVolume: { color: '#ff7300', label: 'Reservoir Volume (L)' },
  lightIntensity: { color: '#0088fe', label: 'Light Intensity (lux)' },
};

export const SensorChart = ({ data }) => {
  const [timeRange, setTimeRange] = useState('1H');
  const [selectedMetrics, setSelectedMetrics] = useState(['temperature', 'humidity', 'vpd']);

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
    if (!data || !Array.isArray(data)) return [];
    
    const now = Date.now();
    const cutoff = now - timeRanges[timeRange];
    
    return data
      .filter(point => point && typeof point.timestamp === 'number' && point.timestamp > cutoff)
      .map(point => ({
        ...point,
        timestamp: typeof point.timestamp === 'number' ? point.timestamp : now,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  const formatValue = (value, metric) => {
    if (typeof value !== 'number') return '--';
    return value.toFixed(2);
  };

  const filteredData = filterData();

  if (!filteredData.length) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Sensor Readings Over Time
        </Typography>
        <Typography color="text.secondary">
          No data available for the selected time range
        </Typography>
      </Paper>
    );
  }

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
          multiple
        >
          {Object.entries(metrics).map(([key, { label }]) => (
            <ToggleButton key={key} value={key}>
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
            formatter={(value, name) => [formatValue(value, name), metrics[name]?.label || name]}
          />
          <Legend />
          {selectedMetrics.map((metric) => (
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              stroke={metrics[metric].color}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
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
      temperature: PropTypes.number,
      humidity: PropTypes.number,
      vpd: PropTypes.number,
      ph: PropTypes.number,
      waterLevel: PropTypes.number,
      reservoirVolume: PropTypes.number,
      lightIntensity: PropTypes.number,
    })
  ),
};
