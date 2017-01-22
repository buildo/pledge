import 'babel-core/register';
import 'babel-polyfill';
import express from 'express';
import router from './routes';

const app = express();
app.use('/', router);

module.exports = app;