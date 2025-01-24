// Dependencias Firebase
require("dotenv").config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Dependencias de 18next
const middleware = require("i18next-http-middleware");
const Backend = require("i18next-fs-backend");
const i18next = require("i18next");

// Otras dependencias
const express = require("express");
const cors = require("cors");

// Middlewares
const ErrorHandler = require("./src/middlewares/errorHandler");
const { languageTranslation } = require("./src/middlewares");

// Configuración de serviceAccount
const serviceAccount = require("./serviceAccount.json");
const cookieParser = require("cookie-parser");

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

// Orígenes permitidos
const origins = [process.env.ORIGIN1, process.env.ORIGIN2];

// Intancia de Express (users)
const users = express();
// Middleware de CORS
users.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new ClientError("Not allowed by CORS", 403));
      }
    },
    credentials: true,
  })
);
users.use(express.json());
users.use(cookieParser());
//obtener ip del request
users.use((req, res, next) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ??
    req.connection.remoteAddress?.split(`:`).pop() ??
    req.connection.remoteAddress ?? 
    req.socket.remoteAddress ?? 
    req.connection.socket?.remoteAddress ??
    "0.0.0.0";

  req.clientIp = ip;
  next();
});
// Middleware de i18next
users.use(middleware.handle(i18next));
users.use(languageTranslation);
// Rutas de usuarios
users.use(require("./src/routes/users/users.routes"));
// Middleware de errores
users.use(ErrorHandler);

// Intancia de Express (auth)
const auth = express();
// Middleware de CORS
auth.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new ClientError("Not allowed by CORS", 403));
      }
    },
    credentials: true,
  })
);
auth.use(express.json());
auth.use(cookieParser());
//obtener ip del request
auth.use((req, res, next) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ??
    req.connection.remoteAddress?.split(`:`).pop() ??
    req.connection.remoteAddress ?? 
    req.socket.remoteAddress ?? 
    req.connection.socket?.remoteAddress ??
    "0.0.0.0";

  req.clientIp = ip;
  next();
});
// Middleware de i18next
auth.use(middleware.handle(i18next));
auth.use(languageTranslation);
// Rutas de autenticación
auth.use(require("./src/routes/auth/auth.routes"));
// Middleware de errores
auth.use(ErrorHandler);

// Exporta las funciones de Firebase
exports.users = functions.https.onRequest(users);
exports.auth = functions.https.onRequest(auth);
