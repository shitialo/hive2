import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Paper, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useFirebase } from '../hooks/useFirebase';

const SensorChart = () => {
  const theme = useTheme();
  const { getHistoricalData } = useFirebase();
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState(3600000); // 1 hour in milliseconds

  useEffect(() => {
    const fetchData = async () => {
      const data = await getHistoricalData(timeRange);
      setChartData(data);
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [timeRange, getHistoricalData]);

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Sensor History
      </Typography>
      <FormControl sx={{ mb: 2, minWidth: 120 }}>
        <InputLabel>Time Range</InputLabel>
        <Select
          value={timeRange}
          label="Time Range"
          onChange={handleTimeRangeChange}
        >
          <MenuItem value={900000}>15 Minutes</MenuItem>
          <MenuItem value={1800000}>30 Minutes</MenuItem>
          <MenuItem value={3600000}>1 Hour</MenuItem>
          <MenuItem value={7200000}>2 Hours</MenuItem>
          <MenuItem value={14400000}>4 Hours</MenuItem>
          <MenuItem value={28800000}>8 Hours</MenuItem>
        </Select>
      </FormControl>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(unixTime) => new Date(unixTime * 1000).toLocaleTimeString()}
          />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip
            labelFormatter={(unixTime) => new Date(unixTime * 1000).toLocaleString()}
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="temperature"
            stroke={theme.palette.primary.main}
            name="Temperature (°C)"
            dot={false}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="humidity"
            stroke={theme.palette.secondary.main}
            name="Humidity (%)"
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="vpd"
            stroke={theme.palette.success.main}
            name="VPD (kPa)"
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="ph"
            stroke={theme.palette.warning.main}
            name="pH"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default SensorChart;
