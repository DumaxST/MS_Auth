const admin = require("firebase-admin");
const { response, cachedAsync } = require("../../utils");
const { ClientError } = require("../../utils/errors");
const axios = require("axios");
const crypto = require('crypto');
const { FieldValue } = require("firebase-admin/firestore");
const { generateVerificationEmailEn, generateVerificationEmailEs } = require("../../../templates/codePassword");
const { resetPasswordEs, resetPasswordEn } = require("../../../templates/resetPassword");
const {
  getDocument,
  generateRefreshToken,
  generateToken,
  updateDocument,
  getDocuments,
  destroyToken,
  sendFirebaseEmail
} = require("../../../generalFunctions");


const authLogin = async (req, res) => {
  const user = req.user;
  const language = req.body?.lang || req.param?.lang || "en";

  const ip =
    req.clientIp ||
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress;
  const userAgent = req.headers["user-agent"];

  const userFromDB = await getDocument("users", user.uid);

  if (!userFromDB) {
    throw new ClientError("User not found", 404);
  }

  const newStatus = "active";
  const tokenInfo = await generateToken({
    id: userFromDB.id,
    // role: role,
    metaData: {
      registeredIP: ip,
      userAgent,
    },
    // paramID: paramID,
  });
  await generateRefreshToken(
    {
      id: userFromDB.id,
      // role: role,
      metaData: {
        registeredIP: ip,
        userAgent,
      },
      // paramID: paramID,
    },
    res,
    `users/${user.uid}/authentication`
  );
  delete userFromDB.id;
  delete userFromDB.collections;
  await updateDocument("users", user.uid, { ...userFromDB, status: newStatus });
  return response(res, req, 200, { tokenInfo });
};

const logout = async (req, res) => {
  const user = req.user;
  const firstToken = req.cookies.refreshToken;
  const userFromDB = await getDocument("users", user.id);
  const allTokens = await getDocuments(`users/${user.id}/authentication`);
  const token = allTokens.find(token => token.refreshToken === firstToken);
  const newStatus = "inactive";
  let newUserData = { ...userFromDB, status: newStatus };
  delete newUserData.id;
  delete newUserData.collections;
  await updateDocument("users", user.id, newUserData);
  destroyToken(`users/${user.id}/authentication`, token.id, res);
  return response(res, req, 200, { message: req.t("UserLoggedOut") });
}

const refreshToken = async (req, res) => {
  const {id, role, metaData, paramID} = req.user;
  
  const token = await generateToken({id , role, metaData, paramID});

  return response(res, req, 200, token);
};


const generateVerificationCode = () => {
  return crypto.randomBytes(3).toString('hex'); 
};

const passwordCode = async (req, res) => {
    const { email, lang } = req.body;
  
    const user = await admin.auth().getUserByEmail(email);
    
    const verificationCode = generateVerificationCode(); 
  
    emailCodeTemp = lang === "es" ? generateVerificationEmailEs(email, user, verificationCode) : generateVerificationEmailEn(email, user, verificationCode);
  
    await sendFirebaseEmail(emailCodeTemp);
  
    // Guarda el código como clave con el email asociado
    await admin.firestore().collection("verificationCodes").doc(verificationCode).set({
      email: email, 
      createdAt: FieldValue.serverTimestamp(),
    });
  
    return response(res, req, 200, { message: req.t("codeSent") });
};
  
  
const validateVerificationCode = async (req, res) => {
    const { code, lang } = req.body;
  
      const doc = await admin.firestore().collection("verificationCodes").doc(code).get();
  
      if (!doc.exists) {
        throw new ClientError(req.t("codeDoesNotExist"), 404);
      }
  
      const data = doc.data();
      const now = new Date();
      const expirationTime = 10 * 60 * 1000; // 10 minutos
  
      if (now - data.createdAt.toDate() > expirationTime) {
        throw new ClientError(req.t("invalidOrExpiredCode"), 400);
      }
  
      const passwordResetLink = await admin.auth().generatePasswordResetLink(data.email);
  
      const emailResetTemp = lang === "es" ? resetPasswordEs(data.email, passwordResetLink) : resetPasswordEn(data.email, passwordResetLink);
  
      await sendFirebaseEmail(emailResetTemp);
  
      // Elimina el código después de usarlo
      await admin.firestore().collection("verificationCodes").doc(code).delete();
  
      return response(res, req, 200, { message: req.t("emailSent") });
};

module.exports = { 
    authLogin: cachedAsync(authLogin),
    passwordCode: cachedAsync(passwordCode),
    validateVerificationCode: cachedAsync(validateVerificationCode),
    refreshToken: cachedAsync(refreshToken),
    logout: cachedAsync(logout),
 };


