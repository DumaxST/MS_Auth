const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { getDocument } = require("../../generalFunctions");
const { ClientError } = require("./errors/index");
require("dotenv").config();
const secretKeyJWT = process.env.JWT_SECRET;
const secretKeyRefresh = process.env.JWT_REFRESH_SECRET;
const modo = process.env.MODO;
const key = process.env.KEY;

const validateToken = (req, res, next) => {
  console.log(req.headers, "req.headers");
  const token =
    req.headers["authorization"] && req.headers["authorization"].split(" ")[1];

  try {
    if (!token) {
      throw new ClientError(req.t("TokenNotFound"), 401);
    }
    jwt.verify(token, secretKeyJWT, (err, decoded) => {
      if (err) {
        throw new ClientError(req.t("InvalidOrExpiredToken"), 401);
      }
      req.user = decoded;
      next();
    });
  } catch (err) {
    next(err);
  }
};

const validateRefreshToken = (req, res, next) => {
  const refreshTokenCookie = req.cookies?.refreshToken;

  try {
    if (!refreshTokenCookie) {
      throw new ClientError(req.t("RefreshTokenNotFound"), 401);
    }

    jwt.verify(refreshTokenCookie, secretKeyRefresh, (err, decoded) => {
      if (err) {
        throw new ClientError(req.t("InvalidOrExpiredToken"), 401);
      }
      req.user = decoded;
      next();
    });
  } catch (err) {
    next(err);
  }
};

const validateAuthTokenFirebase = async (req, res, next) => {
  try {
    //para simular front descomentar para pruebas y comentar también schema en ruta
    // const auth = await axios.post(
    //   `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`,
    //   {
    //     email: "sofiadubrowsky@gmail.com",
    //     password: "123456789",
    //     returnSecureToken: true,
    //   }
    // );

    // const tokenAuth = auth.data.idToken;

    // Info del cliente
    const tokenAuth = req.body.tokenAuth;

    const decodedToken = await admin.auth().verifyIdToken(tokenAuth);

    if (!decodedToken) {
      throw new ClientError(req.t("InvalidTokenOrPwdEmail"), 401);
    }

    const user = await admin.auth().getUser(decodedToken.uid);

    if (!user) {
      throw new ClientError(req.t("UserNotFound"), 404);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

//   const authorize = (roles) => {
//     return async (req, res, next) => {
//       try {

//         const user = req.user;
//         const { id, role, paramID } = user;

//         // Primera validación del Rol que vino en el Token
//         if (!roles.includes(role)) {
//           throw new ClientError('Unauthorized', 403);
//         }
//         // Segunda validación del Rol del usuario en la Base de Datos
//         if (role == DUMAX_ADMIN) {
//           const dumaxAdmin = await getDocument('dumaxAdmins', id);
//           if (dumaxAdmin != false && dumaxAdmin.role == DUMAX_ADMIN) {
//             next();
//             return
//           }
//         }
//         if (role == RESELLER_ADMIN) {
//           const resellerID = paramID;
//           const resellerAdmin = await getDocument(`resellers/${resellerID}/users`, id);
//           if (resellerAdmin != false && resellerAdmin.role == RESELLER_ADMIN) {
//             next();
//             return
//           }
//         }
//         if (role == CARRIER_ADMIN) {
//           const carrierID  = paramID;
//           const carrierAdmin = await getDocument(`carriers/${carrierID}/users`, id);
//           if (carrierAdmin != false && carrierAdmin.role == CARRIER_ADMIN) {
//             next();
//             return
//           }
//         }
//         if (role == SUPPORT) {
//           const carrierID  = paramID;
//           const support = await getDocument(`carriers/${carrierID}/support`, id);
//           if (support != false && support.role == SUPPORT) {
//             next();
//             return
//           }
//         }
//         if (role == DRIVER) {
//           const carrierID  = paramID;
//           const driver = await getDocument(`carriers/${carrierID}/drivers`, id);
//           if (driver != false && driver.role == DRIVER) {
//             next();
//             return
//           }
//         }

//         throw new ClientError('Unauthorized', 403);

//       } catch (err) {
//         next(err);
//       }
//     };
//   }

module.exports = {
  validateToken,
  validateRefreshToken,
  validateAuthTokenFirebase,
};
