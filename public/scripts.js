// Socket.io Connection
const socket = io();







// Toggle LED Functionality
function toggleLED() {
    const ledStatus = document.getElementById('ledToggle').checked ? 'on' : 'off';
    //const ledStatusText = document.getElementById('ledStatus');
    
    // Send the new LED status to the server
    socket.emit('ledStatus', ledStatus);

    // Update the text based on the LED status
    /*
    if (ledStatus === 'on') {
        ledStatusText.textContent = 'LED is on';
    } else {
        ledStatusText.textContent = 'LED is off';
    }*/
}

// Listen for LED status updates from the server
socket.on('ledStatus', (status) => {
    const ledToggle = document.getElementById('ledToggle');
    const ledStatusText = document.getElementById('ledStatus');

    if (status === 'on') {
        ledToggle.checked = true;
        ledStatusText.textContent = 'LED is on';
    } else {
        ledToggle.checked = false;
        ledStatusText.textContent = 'LED is off';
    }
});





// Emit notification to the server
function sendNotificationToServer(iconClass, title, description, time) {
    socket.emit('createNotification', { iconClass, title, description, time });
}

// Example usage: Create and send a notification when the temperature alert occurs
socket.on('temperatureAlert', (temperature) => {
        const timeAgo = formatTimeAgo();
        sendNotificationToServer('fa-thermometer-half', 'Temperature Alert', `The temperature reached ${temperature}°C.`, timeAgo);
});



// Example usage for LED control notifications
socket.on('ledStatusNoti', (status) => {
    const timeAgo = formatTimeAgo();
    const action = status === 'on' ? 'turned on' : 'turned off';
    sendNotificationToServer('fa-lightbulb', `LED ${action}`, `The LED was ${action}.`, timeAgo);
});





// Helper function to format time for notifications (simple example)
function formatTimeAgo() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeString = `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
    return timeString;
}












// Function to Create a Gauge Chart
function createGauge(canvasId, color) {
    return new Chart(document.getElementById(canvasId), {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [0, 100],
                backgroundColor: [color, '#cccccc'],
                borderWidth: 1
            }]
        },
        options: {
            circumference: 180,
            rotation: 270,
            cutout: '75%',
            responsive: false,
            plugins: {
                tooltip: { enabled: false },
                legend: { display: false }
            }
        }
    });
}


// Create Gauges for Temperature, Humidity, and Light Intensity
const temperatureGauge = createGauge('temperatureGauge', '#ff0000');
const humidityGauge = createGauge('humidityGauge', '#00ff00');
const lightIntensityGauge = createGauge('lightIntensityGauge', '#ffff00');

// Update Sensor Data via Socket
socket.on('sensorData', (data) => {
    // Update temperature
    const temperatureElement = document.getElementById('temperatureReading');
    temperatureElement.innerHTML = `<i class="fas fa-thermometer-half"></i> Temperature: ${data.temperature} °C`;

    // Update humidity
    const humidityElement = document.getElementById('humidityReading');
    humidityElement.innerHTML = `<i class="fas fa-tint"></i> Humidity: ${data.humidity} %`;

    // Update light intensity
    const lightIntensityElement = document.getElementById('lightIntensityReading');
    lightIntensityElement.innerHTML = `<i class="fas fa-lightbulb"></i> Light Intensity: ${data.lightIntensity}`;
    
    // Update Gauge Data
    temperatureGauge.data.datasets[0].data[0] = data.temperature;
    temperatureGauge.update();

    humidityGauge.data.datasets[0].data[0] = data.humidity;
    humidityGauge.update();

    lightIntensityGauge.data.datasets[0].data[0] = data.lightIntensity;
    lightIntensityGauge.update();
});

// Data for Electricity Consumption Line Chart
const electricityConsumptionData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [{
        label: "Electricity Consumption (kWh)",
        data: [120, 150, 180, 200, 240, 300, 270, 250, 230, 210, 190, 170],
        borderColor: "#306daa",
        backgroundColor: "rgba(48, 109, 170, 0.2)",
        borderWidth: 2,
        tension: 0.3,
        fill: true
    }]
};

const config = {
    type: "line",
    data: electricityConsumptionData,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: "top",
                labels: {
                    color: "#cccccc",
                },
            }
        },
        scales: {
            x: {
                title: { display: true },
                ticks: {
                    color: "#cccccc",
                },
            },
            y: {
                title: {
                    display: true,
                    text: "kWh",
                    color: "#cccccc",
                },
                ticks: {
                    color: "#cccccc",
                },
                beginAtZero: true,
                grid: {
                    color: "rgba(255, 255, 255, 0.1)",
                },
            }
        }
    }
};

// Render the Electricity Consumption Line Chart
window.onload = function () {
    const ctx = document.getElementById("electricityLineChart").getContext("2d");
    new Chart(ctx, config);
};




// Update Date and Time
function updateDateTime() {
    const dateElement = document.getElementById("currentDate");
    const timeElement = document.getElementById("currentTime");
    const now = new Date();

    // Format options for the date
    const dateOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    dateElement.textContent = now.toLocaleDateString("en-US", dateOptions);

    // Format the time
    const timeOptions = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true };
    timeElement.textContent = now.toLocaleTimeString("en-US", timeOptions);
}

// Update the time every second
setInterval(updateDateTime, 1000);
updateDateTime();
