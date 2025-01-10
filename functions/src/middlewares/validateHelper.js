const { validationResult } = require("express-validator");

const validateResult = (req, res, next) => {
  try {
    validationResult(req).throw();
    return next();
  } catch (error) {

    res.status(422).send({
      meta: {
        error: true,
        status: res.statusCode,
        url: req.protocol + "://" + req.get("host") + req.url,
        message: error.array().map((e) => {
          return {
            ...e,
            msg: req.t(e.msg.message),
            status: e.msg.statusCode,
          };
        }),
      },
    });
  }
};

module.exports = { validateResult };
