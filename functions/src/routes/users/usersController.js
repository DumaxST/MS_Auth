const { createDocument } = require ("../../../generalFunctions");
const { response, cachedAsync } = require("../../middlewares");


const postUser = async (req, res) => {
    const user = req.body;

    await createDocument("users", user);
    return response(res, req, 201, user);
}

module.exports = {
    postUser: cachedAsync(postUser)
}