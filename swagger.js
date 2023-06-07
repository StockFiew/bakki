const swaggerAutogen = require('swagger-autogen')();
const outputFile = './swagger-output.json';
const endpointsFiles = ['./app.js']; // Replace this with the path to your Express app file

swaggerAutogen(outputFile, endpointsFiles);