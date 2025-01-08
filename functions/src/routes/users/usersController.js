const {
  createDocument,
  updateDocument,
  getDocument,
  deleteDocument,
  getDocuments,
  getTotalDocumentsWithFilters,
  getPaginatedFilteredDocuments,
} = require("../../../generalFunctions");
const { response, cachedAsync } = require("../../middlewares");

const postUser = async (req, res) => {
  const user = req.body;

  await createDocument("users", user);
  return response(res, req, 201, user);
};

const putUser = async (req, res) => {
  const user = req.body;

  const updated = await updateDocument("users", user.id, user);
  return response(res, req, 200, updated);
};

const getUser = async (req, res) => {
  const { id, lastDocId, itemsPerPage } = req.query;
  if (id) {
    const user = await getDocument("users", id);
    return response(res, req, 200, user);
  }

  //Ejemplo de paginado
  if (itemsPerPage) {
    const itemsPerPageNumber = parseInt(itemsPerPage, 10);
    const filters = [["status", "==", "active"]];
    const orderBy = ["createdAt", "asc"];

    const totalDocuments = await getTotalDocumentsWithFilters("users", filters);
    const totalPages = Math.ceil(totalDocuments / itemsPerPageNumber);

    const { documents, newLastDocId } = await getPaginatedFilteredDocuments(
      "users",
      filters,
      [],
      orderBy,
      itemsPerPageNumber,
      lastDocId
    );

    return response(res, req, 200, {
      page: documents,
      totalPages,
      lastDocId: newLastDocId,
    });
  }

  const users = await getDocuments("users");
  return response(res, req, 200, users);
};

const deleteUser = async (req, res) => {
  const id = req.query.id;

  await deleteDocument("users", id);
  return response(res, req, 200, { message: "User deleted" });
};

module.exports = {
  postUser: cachedAsync(postUser),
  putUser: cachedAsync(putUser),
  getUser: cachedAsync(getUser),
  deleteUser: cachedAsync(deleteUser),
};
