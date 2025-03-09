const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const { time } = require('console');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let ledStatus = 'off';
let sensorData = { temperature: 0, humidity: 0, lightIntensity: 0 };
let prevtemperature = 0;
let notifications = []; // To store notifications

// Middleware to parse JSON data
app.use(bodyParser.json());

// Serve static files
app.use(express.static('public'));

// Serve the notifications page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html'); // Serve the new notifications page
});


// Serve the notifications page
app.get('/notifications', (req, res) => {
    res.sendFile(__dirname + '/public/notifications.html'); // Serve the new notifications page
});


// Endpoint to receive data from Arduino (sensor data)
app.post('/data', (req, res) => {
    console.log('Data from Arduino:', req.body);

    // Update LED status if it changes
    if (req.body.ledStatus && req.body.ledStatus !== ledStatus) {
        ledStatus = req.body.ledStatus;
        io.emit('ledStatus', ledStatus); // Broadcast the LED status to the dashboard
    }

    // Update sensor data (temperature, humidity, light intensity) from Arduino
    if (req.body.temperature !== undefined && req.body.humidity !== undefined && req.body.lightIntensity !== undefined) {
        sensorData = {
            temperature: req.body.temperature,
            humidity: req.body.humidity,
            lightIntensity: req.body.lightIntensity
        };

        // Broadcast the sensor data to the clients
        io.emit('sensorData', sensorData); 


        // Check for temperature alert (if temperature >= 30)
        if (sensorData.temperature >= 30 && prevtemperature < 30) {
            io.emit('temperatureAlert', sensorData.temperature);  // Pass the actual temperature value
            console.log(`Temperature Alert: ${sensorData.temperature}`);
        }

        prevtemperature = sensorData.temperature;

    }

    res.sendStatus(200); // Respond with status OK (200)
});

// Endpoint to send current LED status to Arduino
app.get('/ledStatus', (req, res) => {
    res.json({ status: ledStatus });
});




// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log('New client connected');

    // Send the current LED status and sensor data to the newly connected client
    socket.emit('ledStatus', ledStatus); 
    socket.emit('sensorData', sensorData); 

    // Send the notifications to the newly connected client
    // Send the current notifications to the newly connected client
    notifications.forEach((notification, index) => {
      socket.emit('newNotification', { ...notification, index });  // Include the index in the notification data
    });


    // Listen for LED status change
    socket.on('ledStatus', (status) => {
        if (status !== ledStatus) {  // Only update if the status has changed
            
          socket.emit('ledStatusNoti', status); //Send Notification to all clients only when the status changes

          ledStatus = status; // Update the status
          io.emit('ledStatus', status); // Broadcast the new status to all clients
        }
    });

    // Listen for temperature alerts
    socket.on('temperatureAlert', (temperature) => {
        //console.log(`Temperature Alert: ${temperature}`);
    });

    // Listen for new notifications and broadcast to all clients
    socket.on('createNotification', (notification) => {
        notifications.push(notification); // Store the notification
        io.emit('newNotification', notification); // Broadcast the new notification to all clients
    });


    // Listen for the event to remove a notification
    socket.on('removeNotification', (index) => {
        notifications.splice(index, 1); // Remove the notification from the array
        io.emit('updateNotifications', notifications); // Broadcast updated notifications to all clients
    });


    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});



// Start the server on port 3000
server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
