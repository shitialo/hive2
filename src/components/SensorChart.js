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
  Stack,
} from '@mui/material';

const timeRanges = {
  '5M': 300000,
  '15M': 900000,
  '1H': 3600000,
  '6H': 21600000,
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
  const [timeRange, setTimeRange] = useState('15M');
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
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('No data available');
      return [];
    }
    
    const now = Date.now();
    const cutoff = now - timeRanges[timeRange];
    
    const filteredData = data
      .filter(point => {
        if (!point || typeof point.timestamp !== 'number') {
          console.log('Invalid data point:', point);
          return false;
        }
        return point.timestamp > cutoff;
      })
      .map(point => ({
        ...point,
        timestamp: point.timestamp,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
    
    console.log(`Filtered ${filteredData.length} data points`);
    return filteredData;
  };

  const formatValue = (value, metric) => {
    if (typeof value !== 'number') return '--';
    return value.toFixed(2);
  };

  const filteredData = filterData();

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">
          Sensor Readings Over Time
        </Typography>
        
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="subtitle1" sx={{ minWidth: 100 }}>
            Time Range:
          </Typography>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={handleTimeRangeChange}
            size="small"
          >
            {Object.entries(timeRanges).map(([range]) => (
              <ToggleButton key={range} value={range}>
                {range}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="subtitle1" sx={{ minWidth: 100 }}>
            Metrics:
          </Typography>
          <ToggleButtonGroup
            value={selectedMetrics}
            onChange={handleMetricToggle}
            size="small"
            multiple
          >
            {Object.entries(metrics).map(([key, { label }]) => (
              <ToggleButton key={key} value={key}>
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        {filteredData.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 8, textAlign: 'center' }}>
            No data available for the selected time range
          </Typography>
        ) : (
          <Box sx={{ height: 400, width: '100%' }}>
            <ResponsiveContainer>
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(ts) => new Date(ts).toLocaleString()}
                  formatter={(value, name) => [
                    formatValue(value, name),
                    metrics[name]?.label || name,
                  ]}
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
          </Box>
        )}
      </Stack>
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
