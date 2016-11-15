'use strict';

const Ravel = require('ravel');

const app = new Ravel();

app.registerParameter('rethink host', true);
app.registerParameter('rethink port', true);
app.registerParameter('rethink db name', true);
app.registerParameter('max package size bytes', true, 10*1024*1024);

app.modules(__dirname + '/modules');
app.resources(__dirname + '/resources');

app.start();
