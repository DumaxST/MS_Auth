const request = require("supertest");
const jwt = require("jsonwebtoken");
const { usersApp } = require("../../../index");
const secretKeyJWT = process.env.JWT_SECRET;
const { getDocuments, getUserByEmail } = require("../../../generalFunctions");

// Mocks de las funciones generales
jest.mock("../../../generalFunctions", () => ({
  ...jest.requireActual("../../../generalFunctions"),
  getDocuments: jest.fn(),
  getUserByEmail: jest.fn(),
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

  it("Should respond with a valid array of users if a correct token is sent", async () => {
    const validToken = token;
    const res = await request(usersApp)
      .get("/get/user")
      .set("Authorization", `Bearer ${validToken}`);
    expect(res.status).toBe(200);
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
          test: true,
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

  it("Should respond with a 400 error if a required field is missing", async () => {
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
          test: true,
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

  it("Should respond with a 422 error if a field has an invalid format", async () => {
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
          test: true,
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

  it("Should respond with a 409 error if the email is already registered", async () => {
    getUserByEmail.mockResolvedValue(true);

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
          test: true,
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
          id: "TkT2w1rSyAQQmr6x0SsXeA1Yo7B2",
          firstName: "John",
          lastName: "Doe",
          phone: "1234567890",
          role: "user",
          email: "john.doe@example.com",
          status: "active",
          test: true,
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

  it("Should respond with 200 and an object with the updated user if all data is valid", async () => {
    const res = await request(usersApp)
      .put("/update/user")
      .set("Authorization", `Bearer ${token}`)
      .send({
        user: {
          id: "TkT2w1rSyAQQmr6x0SsXeA1Yo7B2",
          firstName: "John",
          lastName: "Doe",
          phone: "1234567890",
          role: "user",
          email: "john.doe@example.com",
          status: "active",
          test: true,
        },
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
  it("Should respond with a 401 error if no token is sent", async () => {
    const res = await request(usersApp).delete("/delete/user").query({
      id: "TkT2w1rSyAQQmr6x0SsXeA1Yo7B2",
      lang: lang,
      test: true,
    });

    expect(res.status).toBe(401);
    expect(res.body.meta.message).toBe(
      lang === "en" ? "Token not found" : "Token no encontrado"
    );
  });

  it("Should respond with a 200 status if the user was successfully deleted", async () => {
    const res = await request(usersApp)
      .delete("/delete/user")
      .set("Authorization", `Bearer ${token}`)
      .query({
        lang: lang,
        id: "TkT2w1rSyAQQmr6x0SsXeA1Yo7B2",
        test: true,
      });

    expect(res.status).toBe(201);
  });
});
