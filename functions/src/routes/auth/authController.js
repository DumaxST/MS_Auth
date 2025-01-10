const admin = require("firebase-admin");
const { response, cachedAsync } = require("../../middlewares");
const { ClientError } = require("../../middlewares/errors");
const axios = require("axios");
const { getDocument } = require("../../../generalFunctions");

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

module.exports = { 
    authLogin: cachedAsync(authLogin)
 };