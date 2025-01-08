const functions = require("firebase-functions");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

// Configuración de serviceAccount
const serviceAccount = require("./serviceAccount.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// CRUD users
const users = express();
users.use(cors({ origin: true }));
users.use(require("./src/routes/users/users.routes"));

exports.users = functions.https.onRequest(users);
