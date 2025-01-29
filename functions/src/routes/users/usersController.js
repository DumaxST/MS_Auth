const { response, cachedAsync } = require("../../middlewares");
const bucket = require("../../../index").bucket;
const admin = require("firebase-admin");
const CryptoJS = require("crypto-js");
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
const accountCreated = require("../../../templates/accountCreated");

const postUser = async (req, res) => {
  const { user, auth } = req.body;

  const decryptedAuth = CryptoJS.AES.decrypt(auth, "your-secret-key").toString(
    CryptoJS.enc.Utf8
  );

  const newUser = await admin.auth().createUser({
    email: user.email,
    password: decryptedAuth,
    displayName: `${user.firstName} ${user.lastName}`,
    phoneNumber: user.phone
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
  const user = req.body;
  const tempUser = await getDocument("users", user.id);

  // Actualizar el nombre en Firebase Auth
  let displayNameUpdated = false;

  if (
    (user.firstName || tempUser.firstName) &&
    (user.lastName || tempUser.lastName)
  ) {
    user.fullName = `${user.firstName || tempUser.firstName} ${
      user.lastName || tempUser.lastName
    }`;
    displayNameUpdated = true;
  }

  if (displayNameUpdated) {
    await admin.auth().updateUser(user.id, { displayName: user.fullName });
  }

  // Actualizar el telefono en Firebase Auth
  if (tempUser.phone !== user.phone) {
    await admin.auth().updateUser(user.id, { phoneNumber: user.phone });
  }

  // Actualizar el role del custom claims
  if (typeof user.role !== "undefined" && tempUser.role !== user.role) {
    await admin.auth().setCustomUserClaims(user.id, { role: user.role });
  }

  // Actualizar la URL de la imagen de perfil en Firebase Auth
  if (
    user?.profilePicture?.url &&
    tempUser?.profilePicture?.url !== user?.profilePicture?.url
  ) {
    await admin
      .auth()
      .updateUser(user.id, { photoURL: user?.profilePicture?.url });
  }

  // Eliminar imagen de perfil si se actualiza del firebase storage y auth
  if (
    user?.profilePicture?.fileName === "" &&
    user?.profilePicture?.fileName !== tempUser?.profilePicture?.fileName
  ) {
    const filePath = `users/${user?.id}/profilePicture`;
    const [files] = await bucket.getFiles({ prefix: filePath });
    await Promise.all(files.map((file) => file.delete()));

    // Actualizar el photoURL a null en Firebase Auth
    await admin.auth().updateUser(user.id, { photoURL: null });
  }

  const updated = await updateDocument("users", user.id, user);
  return response(res, req, 200, updated);
};

const getUser = async (req, res) => {
  const { id, lastDocId, itemsPerPage, role } = req.query;
  if (id) {
    const user = await getDocument("users", id);
    return response(res, req, 200, user);
  }

  if (itemsPerPage) {
    const itemsPerPageNumber = parseInt(itemsPerPage, 10);
    let filters = [];
    if (role) {
      filters.push(["role", "==", role]);
    }
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

  const user = await getDocument("users", id);

  // Eliminar usuario de Firebase Auth
  await admin.auth().deleteUser(id);

  // Eliminar usuario de Firestore
  await deleteDocument("users", id);

  // Eliminar foto de perfil de Firebase Storage
  const folderPath = `users/${id}/profilePicture`;
  const [files] = await bucket.getFiles({ prefix: folderPath });
  await Promise.all(files.map((file) => file.delete()));

  // Enviar email de cuenta eliminada
  const emailDataTemp = {
    to: [user.email],
    message: {
      subject: "Cuenta eliminada",
      html: `
        <h1>Hola ${user.firstName} ${user.lastName}</h1>
        <p>Lamentamos informarle que su cuenta ha sido eliminada.</p>
        <p>Le agradecemos por usar nuestras aplicaciones y esperamos verlo nuevamente.</p>
      `,
    },
    attachments: [],
  };

  await sendFirebaseEmail(emailDataTemp);

  return response(res, req, 200, { message: req.t("UserDeleted") });
};

//Public user
const postPublicUser = async (req, res) => {
  const {user, auth} = req.body;

  const decryptedAuth = CryptoJS.AES.decrypt(auth, "your-secret-key").toString(
    CryptoJS.enc.Utf8
  );

  const newUser = await admin.auth().createUser({
    email: user.email,
    password: decryptedAuth,
    displayName: `${user.firstName} ${user.lastName}`,
  });

  await createDocument("users", user, newUser.uid);

  const passwordResetLink = await admin
    .auth()
    .generatePasswordResetLink(user.email);

  const emailDataTemp = accountCreated(user, passwordResetLink);

  await sendFirebaseEmail(emailDataTemp);

  return response(res, req, 201, { ...user, id: newUser.uid });

}

module.exports = {
  postUser: cachedAsync(postUser),
  putUser: cachedAsync(putUser),
  getUser: cachedAsync(getUser),
  deleteUser: cachedAsync(deleteUser),
  postPublicUser: cachedAsync(postPublicUser),
};
