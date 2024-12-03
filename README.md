# ESP32 Sensor Dashboard

A real-time dashboard that displays temperature and humidity data from an ESP32 with SHT31 sensor.

## Features

- Real-time temperature and humidity monitoring
- Historical data visualization using charts
- Dark theme UI
- Responsive design
- Secure MQTT communication

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with your MQTT credentials:
```
REACT_APP_MQTT_URL=wss://your-hivemq-url:8884/mqtt
REACT_APP_MQTT_USERNAME=your-username
REACT_APP_MQTT_PASSWORD=your-password
```

3. Run the development server:
```bash
npm start
```

## Deployment to Netlify

1. Push your code to a GitHub repository

2. Connect your repository to Netlify:
   - Log in to Netlify
   - Click "New site from Git"
   - Choose your repository
   - Build command: `npm run build`
   - Publish directory: `build`

3. Add environment variables in Netlify:
   - Go to Site settings > Build & deploy > Environment
   - Add the same variables as in your `.env` file

## ESP32 Configuration

Make sure your ESP32 is configured with the correct MQTT broker details and is publishing to the topic `sensor/sht31`.
