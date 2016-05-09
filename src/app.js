'use strict';

const Ravel = require('ravel');

const app = new Ravel();

app.registerSimpleParameter('rethink host', true);
app.registerSimpleParameter('rethink port', true);
app.registerSimpleParameter('rethink db name', true);
app.registerSimpleParameter('max package size bytes', true, 10*1024*1024);

app.modules('./modules');
app.resources('./resources');

app.start();
