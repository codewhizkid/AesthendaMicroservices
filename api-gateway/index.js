const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Proxy routes to respective microservices
app.use('/user', createProxyMiddleware({ target: 'http://user-service:5001', changeOrigin: true }));
app.use('/appointment', createProxyMiddleware({ target: 'http://appointment-service:5002', changeOrigin: true }));
app.use('/notification', createProxyMiddleware({ target: 'http://notification-service:5003', changeOrigin: true }));
app.use('/payment', createProxyMiddleware({ target: 'http://payment-service:5004', changeOrigin: true }));

app.listen(4000, () => {
    console.log('API Gateway is running on port 4000');
});
