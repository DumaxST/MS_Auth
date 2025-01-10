module.exports = (err, req, res, next) => {
  res.status(err.statusCode || 500).send({
    meta: {
      error: true,
      status: err.statusCode,
      url: req.protocol + "://" + req.get("host") + req.url,
      message: req.t(err.message),
    },
  });
};
