const languageMiddleware = (req, res, next) => {
  const lang = req?.query?.lang || "en";
  req.i18n.changeLanguage(lang);
  next();
};

module.exports = languageMiddleware;
