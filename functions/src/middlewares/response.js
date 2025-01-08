module.exports = (res, req, statusCode, data, error = false) => {
  res.status(statusCode).json({
    meta: {
      error: error,
      count: Array.isArray(data) ? data.length : 1,
      status: statusCode,
      url: req.protocol + '://' + req.get('host') + req.originalUrl,
    },
    data: data || [],
  })
}