const { validationResult } = require("express-validator")
// const {
//   lang,
// } = require("../routes/CC_DB");
const { ClientError } = require('./errors/index');

const validateResult = (req, res, next) =>{
  // let language = 'Eng';
  // if(req.body.lang && (req.body.lang == 'Esp' || req.body.lang == 'Eng')){
  //   language = req.body.lang;
  // }
  // if(req.query.lang && (req.query.lang == 'Esp' || req.query.lang == 'Eng')){
  //   language = req.query.lang;
  // }
  
  try {
    validationResult(req).throw();
    return next();
  } catch (error) {

    res.status(422).send({
      "meta": {
        "error": true,
        "status": res.statusCode,
        "url": req.protocol + '://' + req.get('host') + req.url,
        "message": error.array().map(e => {
          return {
            ...e,
            //msg: lang(language, e.msg)
          }
        })
      }
    });
  }
}

module.exports = {validateResult}

