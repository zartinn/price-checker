import * as mongoose from 'mongoose';
import * as express from 'express';
import bodyParser = require('body-parser');
import { Api } from './api/api';
import { config } from './database';
const cors = require("cors");
const firebase = require("firebase-admin");
const serviceAccount = require('./assets/firebase-admin.json');
const firebaseUrl = require('./assets/firebase-url.json');

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: firebaseUrl.url;
});


const server = express();
server.use(cors());
server.use(bodyParser.json())

mongoose.connect(config.database, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
const port = 5678;
db.on('open', () => {
    server.listen(port, () => {
        console.log('server running on port ' + port);
    });
    new Api(server, firebase);
});




