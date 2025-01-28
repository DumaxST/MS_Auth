const { validateResult } = require("../../middlewares/validateHelper");
const { ClientError } = require("../../middlewares/errors/index");
const { check } = require("express-validator");
const {
  getDocuments,
  getUserByEmail,
  getDocument,
} = require("../../../generalFunctions");

const userSchema = {
  getUser: [
    check("id")
      .optional()
      .isString()
      .withMessage(() => new ClientError("MustBeAString", 422))
      .custom(async (value) => {
        const existingUser = await getDocument(`/users`, value);

        if (!existingUser) {
          throw () => new ClientError("InvalidUserID", 404);
        }

        return true;
      }),
    check("itemsPerPage")
      .optional()
      .isNumeric()
      .withMessage(() => new ClientError("MustBeNumeric", 422)),
    check("lastDocId")
      .optional()
      .isString()
      .withMessage(() => new ClientError("MustBeAString", 422))
      .custom(async (value) => {
        const existingUser = await getDocument(`/users`, value);

        if (!existingUser) {
          throw () => new ClientError("InvalidUserID", 404);
        }

        return true;
      }),
    (req, res, next) => {
      validateResult(req, res, next);
    },
  ],
  postUser: [
    check("auth")
      .notEmpty()
      .withMessage(() => new ClientError("MustNotBeEmpty", 400))
      .isString()
      .withMessage(() => new ClientError("MustBeAString", 422)),
    check("user.firstName")
      .notEmpty()
      .withMessage(() => new ClientError("MustNotBeEmpty", 400))
      .isString()
      .withMessage(() => new ClientError("MustBeAString", 422))
      .isLength({ max: 20 })
      .withMessage(() => new ClientError("MustBe20CharactersMax", 422)),
    check("user.lastName")
      .notEmpty()
      .withMessage(() => new ClientError("MustNotBeEmpty", 400))
      .isString()
      .withMessage(() => new ClientError("MustBeAString", 422))
      .isLength({ max: 20 })
      .withMessage(() => new ClientError("MustBe20CharactersMax", 422)),
    check("user.phone")
      .notEmpty()
      .withMessage(() => new ClientError("MustNotBeEmpty", 400))
      .isString()
      .withMessage(() => new ClientError("MustBeAString", 422))
      .custom(async (value) => {
        const existingUser = await getDocuments("users", [
          "phone",
          "==",
          value,
        ]);
        if (existingUser.length > 0) {
          throw () => new ClientError("PhoneAlreadyRegistered", 409);
        }
      }),
    check("user.role")
      .notEmpty()
      .withMessage(() => new ClientError("MustNotBeEmpty", 400))
      .isString()
      .withMessage(() => new ClientError("MustBeAString", 422)),
    check("user.email")
      .notEmpty()
      .withMessage(() => new ClientError("MustNotBeEmpty", 400))
      .isEmail()
      .withMessage(() => new ClientError("MustBeAValidEmail", 422))
      .custom(async (value) => {
        const existingUser = await getUserByEmail(value);
        if (existingUser) {
          throw () => new ClientError("EmailAlreadyRegistered", 409);
        }
      }),
    check("user.status")
      .notEmpty()
      .withMessage(() => new ClientError("MustNotBeEmpty", 400))
      .isString()
      .withMessage(() => new ClientError("MustBeAString", 422)),
    check("user.profilePicture")
      .optional()
      .custom((value) => {
        if (typeof value !== "object") {
          throw () => new ClientError("MustBeAnObject", 422);
        }

        const { url, fileName, ...rest } = value;

        if (Object.keys(rest).length > 0) {
          throw () => new ClientError("InvalidProfilePictureKey", 400);
        }

        if (url === "" && fileName === "") {
          return true;
        }

        if (url && url !== "" && fileName && fileName !== "") {
          if (typeof url !== "string") {
            throw () => new ClientError("UrlMustBeAString", 422);
          }

          if (!url.startsWith("https://firebasestorage.googleapis.com")) {
            throw () => new ClientError("InvalidUrl", 400);
          }

          if (typeof fileName !== "string") {
            throw () => new ClientError("FileNameMustBeAString", 422);
          }
        } else if (url || fileName) {
          if (!url) {
            throw () => new ClientError("UrlIsRequired", 400);
          }
          if (!fileName) {
            throw () => new ClientError("FileNameIsRequired", 400);
          }
        }

        return true;
      }),
    (req, res, next) => {
      validateResult(req, res, next);
    },
  ],
  putUser: [
    check("id")
      .notEmpty()
      .withMessage(() => new ClientError("MustNotBeEmpty", 400))
      .isString()
      .withMessage(() => new ClientError("MustBeAString", 422))
      .custom(async (value) => {
        if (value) {
          const existingUser = await getDocument(`/users`, value);

          if (!existingUser) {
            throw () => new ClientError("InvalidUserID", 404);
          }
        }
        return true;
      }),
    check("firstName")
      .optional()
      .isString()
      .withMessage(() => new ClientError("MustBeAString", 422))
      .isLength({ max: 20 })
      .withMessage(() => new ClientError("MustBe20CharactersMax", 422)),
    check("lastName")
      .optional()
      .isString()
      .withMessage(() => new ClientError("MustBeAString", 422))
      .isLength({ max: 20 })
      .withMessage(() => new ClientError("MustBe20CharactersMax", 422)),
    check("phone")
      .optional()
      .isString()
      .withMessage(() => new ClientError("MustBeAString", 422))
      .custom(async (value) => {
        if (value) {
          const existingUser = await getDocuments("users", [
            "phone",
            "==",
            value,
          ]);
          if (existingUser.length > 0) {
            throw () => new ClientError("PhoneAlreadyRegistered", 409);
          }
        }
      }),
    check("role")
      .optional()
      .isString()
      .withMessage(() => new ClientError("MustBeAString", 422)),
    check("email")
      .optional()
      .isEmail()
      .withMessage(() => new ClientError("MustBeAValidEmail", 422))
      .custom(async (value) => {
        if (value) {
          const existingUser = await getUserByEmail(value);
          if (existingUser) {
            throw () => new ClientError("EmailAlreadyRegistered", 409);
          }
        }
      }),
    check("status")
      .optional()
      .isString()
      .withMessage(() => new ClientError("MustBeAString", 422)),
    check("profilePicture")
      .optional()
      .custom((value) => {
        if (typeof value !== "object") {
          throw () => new ClientError("MustBeAnObject", 422);
        }

          const { url, fileName, ...rest } = value;

          if (Object.keys(rest).length > 0) {
            throw () => new ClientError("InvalidProfilePictureKey", 400);
          }

          if (url === "" && fileName === "") {
            return true;
          }

          if (url && url !== "" && fileName && fileName !== "") {
            if (typeof url !== "string") {
              throw () => new ClientError("UrlMustBeAString", 422);
            }

            if (!url.startsWith("https://firebasestorage.googleapis.com")) {
              throw () => new ClientError("InvalidUrl", 400);
            }

            if (typeof fileName !== "string") {
              throw () => new ClientError("FileNameMustBeAString", 422);
            }
          } else if (url || fileName) {
            if (!url) {
              throw () => new ClientError("UrlIsRequired", 400);
            }
            if (!fileName) {
              throw () => new ClientError("FileNameIsRequired", 400);
            }
          }

          return true;
        } else {
          return true;
        }
      }),
    (req, res, next) => {
      validateResult(req, res, next);
    },
  ],
  deleteUser: [
    check("id")
      .notEmpty()
      .withMessage(() => new ClientError("MustNotBeEmpty", 400))
      .isString()
      .withMessage(() => new ClientError("MustBeAString", 422))
      .custom(async (value) => {
        console.log("value", value);

        const existingUser = await getDocument(`/users`, value);

        if (!existingUser) {
          throw () => new ClientError("InvalidUserID", 404);
        }

        return true;
      }),
    (req, res, next) => {
      validateResult(req, res, next);
    },
  ],
  deleteUser: [
    check("id")
      .notEmpty()
      .withMessage(() => new ClientError("MustNotBeEmpty", 400))
      .isString()
      .withMessage(() => new ClientError("MustBeAString", 422))
      .custom(async (value) => {
        console.log("value", value);

        const existingUser = await getDocument(`/users`, value);

        if (!existingUser) {
          throw () => new ClientError("InvalidUserID", 404);
        }

        return true;
      }),
    (req, res, next) => {
      validateResult(req, res, next);
    },
  ],
};

module.exports = userSchema;
