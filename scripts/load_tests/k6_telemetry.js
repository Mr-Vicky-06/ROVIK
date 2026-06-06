import ws from 'k6/ws';
import { check } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
    vus: 1000, // Simulate 1000 concurrent riders
    duration: '1m', // Run test for 1 minute
};

export default function () {
    const tenantId = 'local-dev';
    const riderId = `rider-load-${__VU}`;
    const url = `ws://localhost:8000/api/v1/ws/${tenantId}?token=local-dev`;

    const res = ws.connect(url, {}, function (socket) {
        socket.on('open', () => {
            // Send telemetry every 1 second to simulate high-frequency tracking
            socket.setInterval(() => {
                const payload = JSON.stringify({
                    rider_id: riderId,
                    lat: 34.0522 + (Math.random() * 0.01), // Simulate movement
                    lng: -118.2437 + (Math.random() * 0.01),
                    speed: randomIntBetween(10, 60),
                    timestamp: Date.now() / 1000
                });
                socket.send(payload);
            }, 1000);
        });

        socket.on('error', (e) => {
            if (e.error() != "websocket: close sent") {
                console.log('An unexpected error occurred: ', e.error());
            }
        });

        // Close socket after the test duration
        socket.setTimeout(function () {
            socket.close();
        }, 60000);
    });

    check(res, { 'status is 101': (r) => r && r.status === 101 });
}
