const { validationResult } = require("express-validator");

const validateResult = (req, res, next) => {
  try {
    validationResult(req).throw();
    return next();
  } catch (error) {
    // Array de errores capturados por express-validator
    const errorArray = error.array().map((e) => {
      return {
        ...e,
        msg: req.t(e.msg.message || e.msg),
        status: e.msg.statusCode,
      };
    });

    // Agrupar errores por status code
    const groupedErrors = errorArray.reduce((acc, curr) => {
      const status = curr.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(curr);
      return acc;
    }, {});

    const priorityOrder = [500, 401, 403, 400, 404, 409, 422];
    const sortedGroupedErrors = {};

    // Ordenar errores por prioridad
    priorityOrder.forEach((status) => {
      if (groupedErrors[status]) {
        sortedGroupedErrors[status] = groupedErrors[status];
      }
    });

    // Enviar respuesta con el error de mayor prioridad
    const highestPriorityStatus =
      priorityOrder.find((status) => sortedGroupedErrors[status]) || 422;

    res.status(highestPriorityStatus).send({
      meta: {
        error: true,
        status: res.statusCode,
        url: req.protocol + "://" + req.get("host") + req.url,
        message: sortedGroupedErrors,
      },
    });
  }
};

module.exports = { validateResult };
