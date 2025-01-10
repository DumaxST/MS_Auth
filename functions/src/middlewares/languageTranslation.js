module.exports = (req, res, next) => {
  let lang = req?.query?.lang || "en";
  const validLangs = ["en", "es"];

  if (!validLangs.includes(lang)) {
    lang = "en";
  }

  req.i18n.changeLanguage(lang, (err, t) => {
    if (err) return next(err);
    next();
  });
};
