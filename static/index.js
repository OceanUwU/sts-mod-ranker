console.log('hi');

const socket = io();
socket.on('connect', () => console.log('connected to socket.io'));
//socket.on('disconnect', () => window.location.reload());