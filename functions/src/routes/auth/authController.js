const admin = require("firebase-admin");
const { response, cachedAsync } = require("../../middlewares");
const { ClientError } = require("../../middlewares/errors");
const axios = require("axios");
const { getDocument, sendFirebaseEmail } = require("../../../generalFunctions");
const crypto = require('crypto');
const { FieldValue } = require("firebase-admin/firestore");
const { generateVerificationEmailEn, generateVerificationEmailEs } = require("../../../templates/codePassword");
const { resetPasswordEs, resetPasswordEn } = require("../../../templates/resetPassword");

const authLogin = async (req, res) => {

        //para simular front descomentar para pruebas y comentar también schema en ruta
        // const auth = await axios.post(
        //     `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyAXTFZWSbPn_PQveOLp1D8l_pht9VGY6nA`,
        //     {
        //         email: "nulmi@dumaxst.com",
        //         password: "123456789",
        //         returnSecureToken: true,
        //     }
        // );
        
        // const tokenAuth = auth.data.idToken;
        //para simular front

        const {tokenAuth} = req.body; //se ira agregando mas información a medida que estructuremos el front
        const decodedToken = await admin.auth().verifyIdToken(tokenAuth)
        if (!decodedToken) {
            throw new ClientError(req.t("invalidToken"), 401);
        }else{
            const user = await getDocument("users", decodedToken?.uid)
            if(user){
                const newStructure ={
                    id: user.id,
                    email: user.email,
                    displayName: `${user.firstName} ${user.lastName}`,
                    role: user.role,
                    status: user.status,
                }
                return response(res, req, 200, newStructure);
            }else{
                throw new ClientError(req.t("UserNotFound"), 404);
            }
        }
   
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
    validateVerificationCode: cachedAsync(validateVerificationCode)
 };