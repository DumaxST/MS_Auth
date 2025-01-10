const { check } = require("express-validator");
const { validateResult } = require("../../middlewares/validateHelper");

const authSchema = {
    //schema inicial, se irán agregando datos y validaciones en cuanto se vayan necesitando
    postLogin: [
        check('tokenAuth')
            .notEmpty().withMessage('Token is required')
            .isString().withMessage('Token must be a string'),
        (req, res, next) => {
            validateResult(req, res, next);
        }
    ],
};

module.exports = authSchema;