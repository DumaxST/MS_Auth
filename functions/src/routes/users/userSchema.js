const { check } = require("express-validator");
const { validateResult } = require("../../middlewares/validateHelper");

const userSchema = {
    postUser: [
        check('firstName')
            .notEmpty().withMessage('First name is required')
            .isString().withMessage('First name must be a string')
            .isLength({ max: 20 }).withMessage('First name cannot be longer than 20 characters'),
        check('lastName')
            .notEmpty().withMessage('Last name is required')
            .isString().withMessage('Last name must be a string')
            .isLength({ max: 20 }).withMessage('Last name cannot be longer than 20 characters'),
        check('phone')
            .notEmpty().withMessage('Phone is required')
            .isString().withMessage('Phone must be a string'),
        check('role')
            .notEmpty().withMessage('Role is required')
            .isString().withMessage('Role must be a string'),
        check('email')
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Email must be valid'),
        check('status')
            .notEmpty().withMessage('Status is required')
            .isString().withMessage('Status must be a string'),
            (req, res, next) => {
                validateResult(req, res, next);
            }
    ],
}

module.exports = userSchema;