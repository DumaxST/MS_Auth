const request = require("supertest");
const jwt = require("jsonwebtoken");
const { usersApp } = require("../../../index");
const secretKeyJWT = process.env.JWT_SECRET;
const {
  getDocuments,
  getUserByEmail,
  updateDocument,
  deleteDocument,
  getDocument,
  getTotalDocumentsWithFilters,
  getPaginatedFilteredDocuments,
} = require("../../../generalFunctions");
const { get } = require("./users.routes");

jest.mock("firebase-admin", () => {
  const actualAdmin = jest.requireActual("firebase-admin");
  return {
    ...actualAdmin,
    initializeApp: jest.fn(),
    auth: jest.fn().mockReturnValue({
      createUser: jest.fn().mockResolvedValue({ uid: "testUserId" }),
      setCustomUserClaims: jest.fn().mockResolvedValue(),
      generatePasswordResetLink: jest
        .fn()
        .mockResolvedValue("http://reset-link"),
      deleteUser: jest.fn().mockResolvedValue(true),
      updateUser: jest.fn().mockResolvedValue(true),
    }),
    credential: {
      cert: jest.fn(),
    },
    firestore: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            docs: [],
          }),
        }),
        add: jest.fn().mockResolvedValue(true),
        doc: jest.fn().mockReturnValue({
          update: jest.fn().mockResolvedValue(true),
          delete: jest.fn().mockResolvedValue(true),
        }),
      }),
    }),
    storage: jest.fn().mockReturnValue({
      bucket: jest.fn().mockReturnValue({
        file: jest.fn().mockReturnValue({
          save: jest.fn().mockResolvedValue(true),
          delete: jest.fn().mockResolvedValue(true),
        }),
        getFiles: jest.fn().mockResolvedValue([
          // Mock de getFiles
          [{ delete: jest.fn().mockResolvedValue(true) }],
        ]),
      }),
    }),
  };
});

// Mocks de las funciones generales
jest.mock("../../../generalFunctions", () => ({
  ...jest.requireActual("../../../generalFunctions"),
  createDocument: jest.fn(),
  sendFirebaseEmail: jest.fn(),
  getUserByEmail: jest.fn(),
  getDocuments: jest.fn(),
  updateDocument: jest.fn(),
  deleteDocument: jest.fn(),
  getDocument: jest.fn().mockImplementation((collection, id) => {
    if (id === "testUserId") {
      return {
        id: "testUserId",
        firstName: "John",
        lastName: "Doe",
        phone: "1234567890",
        role: "user",
        email: "john.doe@example.com",
        status: "active",
      };
    }
    return null;
  }),
  getTotalDocumentsWithFilters: jest.fn(),
  getPaginatedFilteredDocuments: jest.fn(),
}));

//lenguajes disponibles
const languages = ["es", "en"];
let lang = languages[Math.floor(Math.random() * languages.length)];

// Función para generar un token válido
const generateTestToken = () => {
  const payload = {
    id: "testUserId",
    role: "admin",
  };
  return jwt.sign(payload, secretKeyJWT, { expiresIn: "1h" });
};
const token = generateTestToken();

beforeAll(() => {
  jest.clearAllMocks();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /get/user", () => {
  it("Should respond with a 401 error if no token is sent", async () => {
    const res = await request(usersApp).get("/get/user").query({
      lang: lang,
    });
    expect(res.status).toBe(401);
    expect(res.body.meta.message).toBe(
      lang === "en" ? "Token not found" : "Token no encontrado"
    );
  });

  it("Should respond with a 404 error if an invalid user ID is provided", async () => {
    getDocument.mockResolvedValue(null);

    const res = await request(usersApp)
      .get("/get/user")
      .set("Authorization", `Bearer ${token}`)
      .query({
        id: "invalidUserId",
        lang: lang,
      });

    expect(res.status).toBe(404);
    expect(res.body.meta.message["404"][0].msg).toBe(
      lang === "en" ? "UserID invalid" : "ID de usuario inválido"
    );
  });

  it("Should respond with a 404 error if an invalid lastDocId is provided", async () => {
    getDocument.mockResolvedValue(null);

    const res = await request(usersApp)
      .get("/get/user")
      .set("Authorization", `Bearer ${token}`)
      .query({
        lastDocId: "invalidLastDocId",
        lang: lang,
      });

    expect(res.status).toBe(404);
    expect(res.body.meta.message["404"][0].msg).toBe(
      lang === "en" ? "UserID invalid" : "ID de usuario inválido"
    );
  });

  it("Should respond with a 422 error if id has an invalid format", async () => {
    const res = await request(usersApp)
      .get("/get/user")
      .set("Authorization", `Bearer ${token}`)
      .query({
        id: null,
        lang: lang,
      });

    expect(res.body.meta.message["422"][0].status).toBe(422);
    expect(res.body.meta.message["422"][0].msg).toBe(
      lang === "en" ? "Must be alphanumeric" : "Debe ser alfanumérico"
    );
  });

  it("Should respond with a 422 error if itemsPerPage has an invalid format", async () => {
    const res = await request(usersApp)
      .get("/get/user")
      .set("Authorization", `Bearer ${token}`)
      .query({
        itemsPerPage: "invalid",
        lang: lang,
      });

    expect(res.status).toBe(422);
    expect(res.body.meta.message["422"][0].msg).toBe(
      lang === "en" ? "Must be numeric" : "Debe ser numérico"
    );
  });

  it("Should respond with a 422 error if lastDocId has an invalid format", async () => {
    const res = await request(usersApp)
      .get("/get/user")
      .set("Authorization", `Bearer ${token}`)
      .query({
        lastDocId: null,
        lang: lang,
      });

    expect(res.body.meta.message["422"][0].status).toBe(422);
    expect(res.body.meta.message["422"][0].msg).toBe(
      lang === "en" ? "Must be alphanumeric" : "Debe ser alfanumérico"
    );
  });

  it("Should respond with a valid array of users if a correct token is sent", async () => {
    getDocuments.mockResolvedValue([{ id: "user1" }, { id: "user2" }]);

    const res = await request(usersApp)
      .get("/get/user")
      .set("Authorization", `Bearer ${token}`)
      .query({
        lang: lang,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(2);
  });

  it("Should respond with a specific user if an ID is provided", async () => {
    getDocument.mockResolvedValue({ id: "user1", firstName: "John" });

    const res = await request(usersApp)
      .get("/get/user")
      .set("Authorization", `Bearer ${token}`)
      .query({
        id: "user1",
        lang: lang,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("id", "user1");
    expect(res.body.data).toHaveProperty("firstName", "John");
  });

  it("Should respond with paginated users if itemsPerPage is provided", async () => {
    getTotalDocumentsWithFilters.mockResolvedValue(10);
    getPaginatedFilteredDocuments.mockResolvedValue({
      documents: [{ id: "user1" }, { id: "user2" }],
      newLastDocId: "user2",
    });

    const res = await request(usersApp)
      .get("/get/user")
      .set("Authorization", `Bearer ${token}`)
      .query({
        itemsPerPage: 2,
        lang: lang,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("page");
    expect(res.body.data.page).toBeInstanceOf(Array);
    expect(res.body.data.page.length).toBe(2);
    expect(res.body.data).toHaveProperty("totalPages", 5);
    expect(res.body.data).toHaveProperty("lastDocId", "user2");
  });

  it("Should respond with paginated users filtered by role if role is provided", async () => {
    getTotalDocumentsWithFilters.mockResolvedValue(5);
    getPaginatedFilteredDocuments.mockResolvedValue({
      documents: [
        { id: "user1", role: "admin" },
        { id: "user2", role: "admin" },
      ],
      newLastDocId: "user2",
    });

    const res = await request(usersApp)
      .get("/get/user")
      .set("Authorization", `Bearer ${token}`)
      .query({
        itemsPerPage: 2,
        role: "admin",
        lang: lang,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("page");
    expect(res.body.data.page).toBeInstanceOf(Array);
    expect(res.body.data.page.length).toBe(2);
    expect(res.body.data.page[0]).toHaveProperty("role", "admin");
    expect(res.body.data.page[1]).toHaveProperty("role", "admin");
    expect(res.body.data).toHaveProperty("totalPages", 3);
    expect(res.body.data).toHaveProperty("lastDocId", "user2");
  });
});

describe("POST /create/user", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("Should respond with a 401 error if no token is sent", async () => {
    const res = await request(usersApp)
      .post("/create/user")
      .send({
        auth: "U2FsdGVkX18pdoGSdzYjxnpugfJg+xEq+NzL87KOB1c=",
        user: {
          firstName: "John",
          lastName: "Doe",
          phone: "1234567890",
          role: "user",
          email: "john.doe@example.com",
          status: "active",
        },
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(401);
    expect(res.body.meta.message).toBe(
      lang === "en" ? "Token not found" : "Token no encontrado"
    );
  });

  it("Should respond with a 400 error if a required firstName is missing", async () => {
    const res = await request(usersApp)
      .post("/create/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        auth: "U2FsdGVkX18pdoGSdzYjxnpugfJg+xEq+NzL87KOB1c=",
        user: {
          lastName: "Doe",
          phone: "1234567890",
          role: "user",
          email: "john.doe@example.com",
          status: "active",
        },
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(400);
    expect(res.body.meta.message["400"][0].msg).toBe(
      lang === "en" ? "Must not be empty" : "No debe estar vacío"
    );
  });

  it("Should respond with a 400 error if a required lastName is missing", async () => {
    const res = await request(usersApp)
      .post("/create/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        auth: "U2FsdGVkX18pdoGSdzYjxnpugfJg+xEq+NzL87KOB1c=",
        user: {
          firstName: "John",
          phone: "1234567890",
          role: "user",
          email: "john.doe@example.com",
          status: "active",
        },
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(400);
    expect(res.body.meta.message["400"][0].msg).toBe(
      lang === "en" ? "Must not be empty" : "No debe estar vacío"
    );
  });

  it("Should respond with a 400 error if a required phone is missing", async () => {
    const res = await request(usersApp)
      .post("/create/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        auth: "U2FsdGVkX18pdoGSdzYjxnpugfJg+xEq+NzL87KOB1c=",
        user: {
          firstName: "John",
          lastName: "Doe",
          role: "user",
          email: "john.doe@example.com",
          status: "active",
        },
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(400);
    expect(res.body.meta.message["400"][0].msg).toBe(
      lang === "en" ? "Must not be empty" : "No debe estar vacío"
    );
  });

  it("Should respond with a 400 error if a required role is missing", async () => {
    const res = await request(usersApp)
      .post("/create/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        auth: "U2FsdGVkX18pdoGSdzYjxnpugfJg+xEq+NzL87KOB1c=",
        user: {
          firstName: "John",
          lastName: "Doe",
          phone: "1234567890",
          email: "john.doe@example.com",
          status: "active",
        },
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(400);
    expect(res.body.meta.message["400"][0].msg).toBe(
      lang === "en" ? "Must not be empty" : "No debe estar vacío"
    );
  });

  it("Should respond with a 400 error if a required email is missing", async () => {
    const res = await request(usersApp)
      .post("/create/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        auth: "U2FsdGVkX18pdoGSdzYjxnpugfJg+xEq+NzL87KOB1c=",
        user: {
          firstName: "John",
          lastName: "Doe",
          phone: "1234567890",
          role: "user",
          status: "active",
        },
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(400);
    expect(res.body.meta.message["400"][0].msg).toBe(
      lang === "en" ? "Must not be empty" : "No debe estar vacío"
    );
  });

  it("Should respond with a 400 error if a required status is missing", async () => {
    const res = await request(usersApp)
      .post("/create/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        auth: "U2FsdGVkX18pdoGSdzYjxnpugfJg+xEq+NzL87KOB1c=",
        user: {
          firstName: "John",
          lastName: "Doe",
          phone: "1234567890",
          role: "user",
          email: "john.doe@example.com",
        },
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(400);
    expect(res.body.meta.message["400"][0].msg).toBe(
      lang === "en" ? "Must not be empty" : "No debe estar vacío"
    );
  });

  it("Should respond with a 400 error if auth is missing", async () => {
    const res = await request(usersApp)
      .post("/create/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        user: {
          firstName: "John",
          lastName: "Doe",
          phone: "1234567890",
          role: "user",
          email: "john.doe@example.com",
          status: "active",
        },
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(400);
    expect(res.body.meta.message["400"][0].msg).toBe(
      lang === "en" ? "Must not be empty" : "No debe estar vacío"
    );
  });

  it("Should respond with a 422 error if email has an invalid format", async () => {
    getDocuments.mockResolvedValue([]);

    const res = await request(usersApp)
      .post("/create/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        auth: "U2FsdGVkX18pdoGSdzYjxnpugfJg+xEq+NzL87KOB1c=",
        user: {
          firstName: "John",
          lastName: "Doe",
          phone: "1234567890",
          role: "user",
          email: "invalid_email_format",
          status: "active",
        },
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(422);
    expect(res.body.meta.message["422"][0].msg).toBe(
      lang === "en"
        ? "Must be a valid email"
        : "Debe ser un correo electrónico válido"
    );
  });

  it("Should respond with a 422 error if auth has an invalid format", async () => {
    getDocuments.mockResolvedValue([]);

    const res = await request(usersApp)
      .post("/create/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        auth: 1234567890,
        user: {
          firstName: "John",
          lastName: "Doe",
          phone: "1234567890",
          role: "user",
          email: "john.doe@example.com",
          status: "active",
        },
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(422);
    expect(res.body.meta.message["422"][0].msg).toBe(
      lang === "en" ? "Must be a string" : "Debe ser una cadena de caracteres"
    );
  });

  it("Should respond with a 422 error if firstName has an invalid format", async () => {
    getDocuments.mockResolvedValue([]);

    const res = await request(usersApp)
      .post("/create/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        auth: "U2FsdGVkX18pdoGSdzYjxnpugfJg+xEq+NzL87KOB1c=",
        user: {
          firstName: 1234567890,
          lastName: "Doe",
          phone: "1234567890",
          role: "user",
          email: "john.doe@example.com",
          status: "active",
        },
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(422);
    expect(res.body.meta.message["422"][0].msg).toBe(
      lang === "en" ? "Must be a string" : "Debe ser una cadena de caracteres"
    );
  });

  it("Should respond with a 422 error if lastName has an invalid format", async () => {
    getDocuments.mockResolvedValue([]);

    const res = await request(usersApp)
      .post("/create/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        auth: "U2FsdGVkX18pdoGSdzYjxnpugfJg+xEq+NzL87KOB1c=",
        user: {
          firstName: "John",
          lastName: 1234567890,
          phone: "1234567890",
          role: "user",
          email: "john.doe@example.com",
          status: "active",
        },
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(422);
    expect(res.body.meta.message["422"][0].msg).toBe(
      lang === "en" ? "Must be a string" : "Debe ser una cadena de caracteres"
    );
  });

  it("Should respond with a 422 error if phone has an invalid format", async () => {
    getDocuments.mockResolvedValue([]);

    const res = await request(usersApp)
      .post("/create/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        auth: "U2FsdGVkX18pdoGSdzYjxnpugfJg+xEq+NzL87KOB1c=",
        user: {
          firstName: "John",
          lastName: "Doe",
          phone: 1234567890,
          role: "user",
          email: "john.doe@example.com",
          status: "active",
        },
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(422);
    expect(res.body.meta.message["422"][0].msg).toBe(
      lang === "en" ? "Must be a string" : "Debe ser una cadena de caracteres"
    );
  });

  it("Should respond with a 422 error if role has an invalid format", async () => {
    getDocuments.mockResolvedValue([]);

    const res = await request(usersApp)
      .post("/create/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        auth: "U2FsdGVkX18pdoGSdzYjxnpugfJg+xEq+NzL87KOB1c=",
        user: {
          firstName: "John",
          lastName: "Doe",
          phone: "1234567890",
          role: 1234567890,
          email: "john.doe@example.com",
          status: "active",
        },
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(422);
    expect(res.body.meta.message["422"][0].msg).toBe(
      lang === "en" ? "Must be a string" : "Debe ser una cadena de caracteres"
    );
  });

  it("Should respond with a 422 error if status has an invalid format", async () => {
    getDocuments.mockResolvedValue([]);

    const res = await request(usersApp)
      .post("/create/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        auth: "U2FsdGVkX18pdoGSdzYjxnpugfJg+xEq+NzL87KOB1c=",
        user: {
          firstName: "John",
          lastName: "Doe",
          phone: "1234567890",
          role: "user",
          email: "john.doe@example.com",
          status: 1234567890,
        },
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(422);
    expect(res.body.meta.message["422"][0].msg).toBe(
      lang === "en" ? "Must be a string" : "Debe ser una cadena de caracteres"
    );
  });

  it("Should respond with a 422 error if profilePicture has an invalid format", async () => {
    getDocuments.mockResolvedValue([]);

    const res = await request(usersApp)
      .post("/create/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        auth: "U2FsdGVkX18pdoGSdzYjxnpugfJg+xEq+NzL87KOB1c=",
        user: {
          firstName: "John",
          lastName: "Doe",
          phone: "1234567890",
          role: "user",
          email: "john.doe@example.com",
          status: "active",
          profilePicture: "invalid_format",
        },
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(422);
    expect(res.body.meta.message["422"][0].msg).toBe(
      lang === "en" ? "Must be an object" : "Debe ser un objeto"
    );
  });

  it("Should respond with a 409 error if the phone is already registered", async () => {
    getDocuments.mockResolvedValue([{ phone: "1234567890" }]);

    const res = await request(usersApp)
      .post("/create/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        auth: "U2FsdGVkX18pdoGSdzYjxnpugfJg+xEq+NzL87KOB1c=",
        user: {
          firstName: "John",
          lastName: "Doe",
          phone: "1234567890",
          role: "user",
          email: "john.doe@example.com",
          status: "active",
        },
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(409);
    expect(res.body.meta.message["409"][0].msg).toBe(
      lang === "en"
        ? "This phone number is already associated with an existing account."
        : "Este número de teléfono ya está asociado con una cuenta existente"
    );
  });

  it("Should respond with a 409 error if the email is already registered", async () => {
    getDocuments.mockResolvedValue([]);
    getUserByEmail.mockResolvedValue({ email: "existing.email@example.com" });

    const res = await request(usersApp)
      .post("/create/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        auth: "U2FsdGVkX18pdoGSdzYjxnpugfJg+xEq+NzL87KOB1c=",
        user: {
          firstName: "John",
          lastName: "Doe",
          phone: "1234567890",
          role: "user",
          email: "existing.email@example.com",
          status: "active",
          test: true,
        },
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(409);
    expect(res.body.meta.message["409"][0].msg).toBe(
      lang === "en"
        ? "This email is already associated with an existing account"
        : "Este correo electrónico ya está asociado con una cuenta existente"
    );

    jest.restoreAllMocks();
  });

  it("Should respond with a successfully created user if all data is valid", async () => {
    getUserByEmail.mockResolvedValue(null);
    getDocuments.mockResolvedValue([]);

    const res = await request(usersApp)
      .post("/create/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        auth: "U2FsdGVkX18pdoGSdzYjxnpugfJg+xEq+NzL87KOB1c=",
        user: {
          firstName: "John",
          lastName: "Doe",
          phone: "1234567890",
          role: "user",
          email: "john.doe@example.com",
          status: "active",
          profilePicture: {
            url: "https://firebasestorage.googleapis.com/v0/b/example.appspot.com/o/profile.jpg",
            fileName: "profile.jpg",
          },
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeInstanceOf(Object);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data).toHaveProperty("firstName");
    expect(res.body.data).toHaveProperty("lastName");
    expect(res.body.data).toHaveProperty("phone");
    expect(res.body.data).toHaveProperty("role");
    expect(res.body.data).toHaveProperty("email");
    expect(res.body.data).toHaveProperty("status");
  });
});

describe("PUT /update/user", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("Should respond with a 401 error if no token is sent", async () => {
    const res = await request(usersApp)
      .put("/update/user")
      .send({
        user: {
          id: "testUserId",
          firstName: "John",
          lastName: "Doe",
          phone: "1234567890",
          role: "user",
          email: "john.doe@example.com",
          status: "active",
        },
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(401);
    expect(res.body.meta.message).toBe(
      lang === "en" ? "Token not found" : "Token no encontrado"
    );
  });

  it("Should respond with a 400 error if a required id is missing", async () => {
    const res = await request(usersApp)
      .put("/update/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        user: {
          firstName: "John",
          lastName: "Doe",
          phone: "1234567890",
          role: "user",
          email: "john.doe@example.com",
          status: "active",
        },
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(400);
    expect(res.body.meta.message["400"][0].msg).toBe(
      lang === "en" ? "Must not be empty" : "No debe estar vacío"
    );
  });

  it("Should respond with a 404 error if an invalid user ID is provided", async () => {
    getDocument.mockResolvedValue(null);

    const res = await request(usersApp)
      .put("/update/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: "invalidUserId",
        firstName: "John",
        lastName: "Doe",
        phone: "1234567890",
        role: "user",
        email: "john.doe@example.com",
        status: "active",
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(404);
    expect(res.body.meta.message["404"][0].msg).toBe(
      lang === "en" ? "UserID invalid" : "ID de usuario inválido"
    );
  });

  it("Should respond with a 422 error if id has an invalid format", async () => {
    getDocuments.mockResolvedValue([]);
    const res = await request(usersApp)
      .put("/update/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: null,
        firstName: "John",
        lastName: "Doe",
        phone: "1234567890",
        role: "user",
        email: "john.doe@example.com",
        status: "active",
      })
      .query({
        lang: lang,
      });

    expect(res.body.meta.message["422"][0].status).toBe(422);
    expect(res.body.meta.message["422"][0].msg).toBe(
      lang === "en" ? "Must be alphanumeric" : "Debe ser alfanumérico"
    );
  });

  it("Should respond with a 422 error if firstName has an invalid format", async () => {
    getDocuments.mockResolvedValue([{ id: "testUserId" }]);
    const res = await request(usersApp)
      .put("/update/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: "testUserId",
        firstName: 1234567890,
        lastName: "Doe",
        phone: "1234567890",
        role: "user",
        email: "john.doe@example.com",
        status: "active",
      })
      .query({
        lang: lang,
      });

    expect(res.body.meta.message["422"][0].status).toBe(422);
    expect(res.body.meta.message["422"][0].msg).toBe(
      lang === "en" ? "Must be a string" : "Debe ser una cadena de caracteres"
    );
  });

  it("Should respond with a 422 error if lastName has an invalid format", async () => {
    getDocuments.mockResolvedValue([]);
    const res = await request(usersApp)
      .put("/update/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: "testUserId",
        firstName: "John",
        lastName: 1234567890,
        phone: "1234567890",
        role: "user",
        email: "john.doe@example.com",
        status: "active",
      })
      .query({
        lang: lang,
      });

    expect(res.body.meta.message["422"][0].status).toBe(422);
    expect(res.body.meta.message["422"][0].msg).toBe(
      lang === "en" ? "Must be a string" : "Debe ser una cadena de caracteres"
    );
  });

  it("Should respond with a 422 error if phone has an invalid format", async () => {
    getDocuments.mockResolvedValue([]);
    const res = await request(usersApp)
      .put("/update/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: "testUserId",
        firstName: "John",
        lastName: "Doe",
        phone: 1234567890,
        role: "user",
        email: "john.doe@example.com",
        status: "active",
      })
      .query({
        lang: lang,
      });

    expect(res.body.meta.message["422"][0].status).toBe(422);
    expect(res.body.meta.message["422"][0].msg).toBe(
      lang === "en" ? "Must be a string" : "Debe ser una cadena de caracteres"
    );
  });

  it("Should respond with a 422 error if role has an invalid format", async () => {
    getDocuments.mockResolvedValue([]);
    const res = await request(usersApp)
      .put("/update/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: "testUserId",
        firstName: "John",
        lastName: "Doe",
        phone: "1234567890",
        role: 1234567890,
        email: "john.doe@example.com",
        status: "active",
      })
      .query({
        lang: lang,
      });

    expect(res.body.meta.message["422"][0].status).toBe(422);
    expect(res.body.meta.message["422"][0].msg).toBe(
      lang === "en" ? "Must be a string" : "Debe ser una cadena de caracteres"
    );
  });

  it("Should respond with a 422 error if email has an invalid format", async () => {
    getDocuments.mockResolvedValue([]);
    const res = await request(usersApp)
      .put("/update/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: "testUserId",
        firstName: "John",
        lastName: "Doe",
        phone: "1234567890",
        role: "user",
        email: "invalid_email_format",
        status: "active",
      })
      .query({
        lang: lang,
      });

    expect(res.body.meta.message["422"][0].status).toBe(422);
    expect(res.body.meta.message["422"][0].msg).toBe(
      lang === "en"
        ? "Must be a valid email"
        : "Debe ser un correo electrónico válido"
    );
  });

  it("Should respond with a 422 error if status has an invalid format", async () => {
    getDocuments.mockResolvedValue([]);
    const res = await request(usersApp)
      .put("/update/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: "testUserId",
        firstName: "John",
        lastName: "Doe",
        phone: "1234567890",
        role: "user",
        email: "john.doe@example.com",
        status: 1234567890,
      })
      .query({
        lang: lang,
      });

    expect(res.body.meta.message["422"][0].status).toBe(422);
    expect(res.body.meta.message["422"][0].msg).toBe(
      lang === "en" ? "Must be a string" : "Debe ser una cadena de caracteres"
    );
  });

  it("Should respond with a 422 error if profilePicture has an invalid format", async () => {
    getDocuments.mockResolvedValue([]);
    const res = await request(usersApp)
      .put("/update/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: "testUserId",
        firstName: "John",
        lastName: "Doe",
        phone: "1234567890",
        role: "user",
        email: "john.doe@example.com",
        status: "active",
        profilePicture: "invalid_format",
      })
      .query({
        lang: lang,
      });

    expect(res.body.meta.message["422"][0].status).toBe(422);
    expect(res.body.meta.message["422"][0].msg).toBe(
      lang === "en" ? "Must be an object" : "Debe ser un objeto"
    );
  });

  it("Should respond with a 409 error if the phone is already registered", async () => {
    getDocuments.mockResolvedValue([{ phone: "1234567890" }]);

    const res = await request(usersApp)
      .put("/update/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: "testUserId",
        firstName: "John",
        lastName: "Doe",
        phone: "1234567890",
        role: "user",
        email: "john.doe@example.com",
        status: "active",
      })
      .query({
        lang: lang,
      });

    expect(res.body.meta.message["409"][0].status).toBe(409);
    expect(res.body.meta.message["409"][0].msg).toBe(
      lang === "en"
        ? "This phone number is already associated with an existing account."
        : "Este número de teléfono ya está asociado con una cuenta existente"
    );
  });

  it("Should respond with a 409 error if the email is already registered", async () => {
    getDocuments.mockResolvedValue([]);
    getUserByEmail.mockResolvedValue({
      email: "john.doe@example.com",
      id: "testUserId",
    });

    const res = await request(usersApp)
      .put("/update/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: "testUserId",
        firstName: "John",
        lastName: "Doe",
        phone: "1234567890",
        role: "user",
        email: "john.doe@example.com",
        status: "active",
      })
      .query({
        lang: lang,
      });

    expect(res.body.meta.message["409"][0].status).toBe(409);
    expect(res.body.meta.message["409"][0].msg).toBe(
      lang === "en"
        ? "This email is already associated with an existing account"
        : "Este correo electrónico ya está asociado con una cuenta existente"
    );
  });

  it("Should respond with 200 and an object with the updated user if all data is valid", async () => {
    updateDocument.mockResolvedValue({
      id: "testUserId",
      firstName: "John",
      lastName: "Doe",
      phone: "1234567890",
      role: "user",
      email: "john.doe@example.com",
      status: "active",
    });
    getUserByEmail.mockResolvedValue(null);
    getDocuments.mockResolvedValue([]);
    getDocument.mockResolvedValue({
      id: "testUserId",
      firstName: "John",
      lastName: "Doe",
      phone: "1234567890",
      role: "user",
      email: "john.doe@example.com",
      status: "active",
    });

    const res = await request(usersApp)
      .put("/update/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: "testUserId",
        firstName: "John",
        lastName: "Doe",
        phone: "1234567890",
        role: "user",
        email: "john.doe@example.com",
        status: "active",
      })
      .query({
        lang: lang,
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Object);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data).toHaveProperty("firstName");
    expect(res.body.data).toHaveProperty("lastName");
    expect(res.body.data).toHaveProperty("phone");
    expect(res.body.data).toHaveProperty("role");
    expect(res.body.data).toHaveProperty("email");
    expect(res.body.data).toHaveProperty("status");
  });
});

describe("DELETE /delete/user", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("Should respond with a 401 error if no token is sent", async () => {
    const res = await request(usersApp).delete("/delete/user").query({
      id: "testUserId",
      lang: lang,
    });

    expect(res.status).toBe(401);
    expect(res.body.meta.message).toBe(
      lang === "en" ? "Token not found" : "Token no encontrado"
    );
  });

  it("Should respond with a 400 error if a required id is missing", async () => {
    const res = await request(usersApp)
      .delete("/delete/user")
      .set("Authorization", `Bearer ${token}`)
      .query({
        lang: lang,
      });

    expect(res.status).toBe(400);
    expect(res.body.meta.message["400"][0].msg).toBe(
      lang === "en" ? "Must not be empty" : "No debe estar vacío"
    );
  });

  it("Should respond with a 404 error if an invalid user ID is provided", async () => {
    getDocument.mockResolvedValue(null);

    const res = await request(usersApp)
      .delete("/delete/user")
      .set("Authorization", `Bearer ${token}`)
      .query({
        id: "invalidUserId",
        lang: lang,
      });

    expect(res.status).toBe(404);
    expect(res.body.meta.message["404"][0].msg).toBe(
      lang === "en" ? "UserID invalid" : "ID de usuario inválido"
    );
  });

  it("Should respond with a 422 error if id has an invalid format", async () => {
    const res = await request(usersApp)
      .delete("/delete/user")
      .set("Authorization", `Bearer ${token}`)
      .query({
        id: null,
        lang: lang,
      });

    expect(res.body.meta.message["422"][0].status).toBe(422);
    expect(res.body.meta.message["422"][0].msg).toBe(
      lang === "en" ? "Must be alphanumeric" : "Debe ser alfanumérico"
    );
  });

  it("Should respond with a 200 status if the user was successfully deleted", async () => {
    deleteDocument.mockResolvedValue(true);
    getDocument.mockResolvedValue({
      id: "testUserId",
      firstName: "John",
      lastName: "Doe",
      phone: "1234567890",
      role: "user",
      email: "john.doe@example.com",
      status: "active",
    });

    const res = await request(usersApp)
      .delete("/delete/user")
      .set("Authorization", `Bearer ${token}`)
      .query({
        lang: lang,
        id: "testUserId",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe(
      lang === "en" ? "User deleted" : "Usuario eliminado"
    );
  });
});
