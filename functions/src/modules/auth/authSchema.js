const { check } = require("express-validator");
const { validateResult } = require("../../middlewares/validateHelper");
const { getUserByEmail } = require("../../../generalFunctions");
const { ClientError } = require("../../utils/errors");

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
    passwordCode: [
        check("email")
          .notEmpty()
          .withMessage(() => new ClientError("MustNotBeEmpty", 400))
          .isEmail()
          .withMessage(() => new ClientError("MustBeAValidEmail", 422))
          .custom(async (value, { req }) => {
            if (value) {
              const existingUser = await getUserByEmail(value);
              //si no existe el usuario arrojar error
              if (!existingUser) {
                throw () => new ClientError("UserNotFound", 404);
              }
            }
          }),
          (req, res, next) => {
            validateResult(req, res, next);
          },
    ],
    validateCode: [
      check("code")
        .notEmpty()
        .withMessage(() => new ClientError("MustNotBeEmpty", 400))
        .isString()
        .withMessage(() => new ClientError("MustBeAString", 422)),
    ]
};

module.exports = authSchema;