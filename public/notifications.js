// Connect to Socket.io
const socket = io();

// Function to create and add a notification card dynamically
function createNotificationCard(iconClass, title, description, time, notificationIndex) {
    const notificationCard = document.createElement('div');
    notificationCard.classList.add('notification-card', 'alert', 'alert-info', 'mb-3');
    
    notificationCard.innerHTML = `
        <i class="fas ${iconClass} notification-icon"></i>
        <div class="notification-content">
            <h3>${title}</h3>
            <p>${description}</p>
            <span class="notification-time">${time}</span>
        </div>
        <button class="close-btn">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Select the notifications container
    const notificationsContainer = document.getElementById('notifications-container');
    notificationsContainer.prepend(notificationCard);

    // Add event listener to the close button
    const closeButton = notificationCard.querySelector('.close-btn');
    closeButton.addEventListener('click', () => {
        // Emit event to remove the notification from the server-side array
        socket.emit('removeNotification', notificationIndex);

        // Remove the notification from the page
        notificationCard.remove();
    });
}

// Listen for new notifications from the server
socket.on('newNotification', (notification) => {
    const { iconClass, title, description, time, index } = notification;
    createNotificationCard(iconClass, title, description, time, index);
});