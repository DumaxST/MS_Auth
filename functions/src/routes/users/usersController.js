const {
  createDocument,
  updateDocument,
  getDocument,
  deleteDocument,
  getDocuments,
  getTotalDocumentsWithFilters,
  getPaginatedFilteredDocuments,
  sendFirebaseEmail,
} = require("../../../generalFunctions");
const { response, cachedAsync } = require("../../middlewares");
const admin = require("firebase-admin");
const CryptoJS = require("crypto-js");

const postUser = async (req, res) => {
  const { user, auth } = req.body;

  const decryptedAuth = CryptoJS.AES.decrypt(auth, "your-secret-key").toString(
    CryptoJS.enc.Utf8
  );

  const newUser = await admin.auth().createUser({
    email: user.email,
    password: decryptedAuth,
    displayName: `${user.firstName} ${user.lastName}`,
  });

  // Asignar custom claims (por ejemplo, rol)
  await admin.auth().setCustomUserClaims(newUser.uid, { role: user.role });

  await createDocument("users", user, newUser.uid);

  const passwordResetLink = await admin
    .auth()
    .generatePasswordResetLink(user.email);

  const emailDataTemp = {
    to: [user.email],
    message: {
      subject: "Cuenta creada",
      html: `
        <h1>Bienvenido</h1>
        <p>Estos son tus datos:</p>
        <p>Nombre: ${user.firstName} ${user.lastName}</p>
        <p>Email: ${user.email}</p>
        <p>Rol: ${user.role}</p>
        <p>Estado: ${user.status}</p>
        <p>Imagen de perfil: <img src="${user.profilePicture.url}" alt="${user.profilePicture.fileName}" /></p>
        <p>Para cambiar tu contraseña, haz clic en el siguiente enlace:</p>
        <a href="${passwordResetLink}">Cambiar contraseña</a>
      `,
    },
    attachments: [],
  };

  await sendFirebaseEmail(emailDataTemp);

  return response(res, req, 201, { ...user, id: newUser.uid });
};

const putUser = async (req, res) => {
  const { user } = req.body;

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
  const { id } = req.query;

  await admin.auth().deleteUser(id);
  await deleteDocument("users", id);
  return response(res, req, 200, { message: "User deleted" });
};

module.exports = {
  postUser: cachedAsync(postUser),
  putUser: cachedAsync(putUser),
  getUser: cachedAsync(getUser),
  deleteUser: cachedAsync(deleteUser),
};
