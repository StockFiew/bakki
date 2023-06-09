const swaggerAutogen = require('swagger-autogen')();
const doc = {
  info: {
    title: 'StockFiew',
    version: '1.0.0',
  },
  securityDefinitions: {
    jwt: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
    },
  },
  security: [
    {
      jwt: [],
    },
  ],
};
const outputFile = './swagger-output.json';
const endpointsFiles = ['./app.js']; // Replace this with the path to your Express app file

swaggerAutogen(outputFile, endpointsFiles, doc);
