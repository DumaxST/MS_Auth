const admin = require("firebase-admin");
const { response, cachedAsync } = require("../../middlewares");
const { ClientError } = require("../../middlewares/errors");
const axios = require("axios");
const {
  getDocument,
  generateRefreshToken,
  generateToken,
  updateDocument,
  getDocuments,
  destroyToken,
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

module.exports = {
  authLogin: cachedAsync(authLogin),
  refreshToken: cachedAsync(refreshToken),
  logout: cachedAsync(logout),
};
