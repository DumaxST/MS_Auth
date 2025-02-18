const { response, cachedAsync } = require("../../utils");
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
const accountCreated = require("../../../templates/accountCreated");

const postProject = async (req, res) => {
    const { project, company, auth } = req.body;

    // Validar clave de autenticación
    // if (auth !== process.env.AUTH_KEY) {
    //     return res.status(401).json({ message: 'Clave de autenticación inválida.' });
    // }

    // Crear el proyecto en Firestore
    const projectData = {
        ...project,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const projectCreated = await createDocument('projects', projectData);

    // Crear la empresa dentro del proyecto (siempre presente, aunque sea el mismo proyecto en B2C)

    let companyForCreation;

    if (!company) {
        companyForCreation = {
            name: project.name,
            state: project.state,
            address: project.address,
            roles: project.roles,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    } else {
        companyForCreation = {
            ...company,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }

    const companyCreated = await createDocument(`projects/${projectCreated.id}/companies`, companyForCreation);

    // Crear el superusuario del proyecto
    const superUserEmail = `admin_${projectCreated.id}@example.com`;
    const superUserPassword = "123456789";

    const userRecord = await admin.auth().createUser({
        email: superUserEmail,
        password: superUserPassword,
        displayName: 'Super Admin'
    });

    const superUserData = {
        name: 'Super Admin Default',
        email: superUserEmail,
        role: 'admin',
        projectId: projectCreated.id,
        companyId: companyCreated.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await createDocument('users', superUserData, userRecord.uid);

    // Asignar custom claims al usuario en Firebase Authentication
    await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: 'admin',
        projectId: projectCreated.id,
        companyId: companyCreated.id
    });

    const data = {
        message: 'Proyecto registrado con éxito.',
        project: projectCreated,
        company: companyCreated,
        superUser: { email: superUserEmail, password: superUserPassword }
    }

    return response(res, req, 201, data);
};



// const putProject = async (req, res) => {

// }

// const getProjects = async (req, res) => {

// }

// const getProject = async (req, res) => {

// }

// const deleteProject = async (req, res) => {

// }


module.exports = {
  postProject: cachedAsync(postProject),
//   putProject: cachedAsync(putProject),
//   getProjects: cachedAsync(getProjects),
//   getProject: cachedAsync(getProject),
//   deleteProject: cachedAsync(deleteProject),
}
