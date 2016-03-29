'use strict';

const Ravel = require('ravel');

const app = new Ravel();

app.modules('./modules');
app.resources('./resources');

app.start();
