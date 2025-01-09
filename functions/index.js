// Dependencias Firebase
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Dependencias de 18next
const languageMiddleware = require("./src/middlewares/language");
const middleware = require("i18next-http-middleware");
const Backend = require("i18next-fs-backend");
const i18next = require("i18next");

// Otras dependencias
const express = require("express");
const cors = require("cors");

// Configuración de serviceAccount
const serviceAccount = require("./serviceAccount.json");

// Inicializar Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Inicializar i18next
i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: "en",
    backend: { loadPath: "./dictionary/{{lng}}.json" },
  });

// Intancia de Express (users)
const users = express();
users.use(cors({ origin: true }));
users.use(middleware.handle(i18next));
users.use(languageMiddleware);
users.use(require("./src/routes/users/users.routes"));

// Intancia de Express (auth)
const auth = express();
auth.use(cors({ origin: true }));
auth.use(middleware.handle(i18next));
auth.use(languageMiddleware);
auth.use(require("./src/routes/auth/auth.routes"));

// Exporta las funciones de Firebase
exports.users = functions.https.onRequest(users);
exports.auth = functions.https.onRequest(auth);
