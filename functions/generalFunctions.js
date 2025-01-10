const admin = require("firebase-admin");
const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");

module.exports = {
  getDocument: async (ref, id) => {
    try {
      const query = db.collection(ref).doc(id);
      const item = await query.get();

      if (!item.exists) {
        return null;
      }

      const itemToReturn = item.data();
      itemToReturn.id = id;
      itemToReturn.collections = await module.exports.getDocumentCollections(
        ref,
        id
      );

      return itemToReturn;
    } catch (error) {
      console.error(`Error getting document: ${error}`);
      throw new Error("Error getting document");
    }
  },
  getDocuments: async (ref, qry, order) => {
    try {
      let query = db.collection(ref);

      if (qry) {
        query = query.where(qry[0], qry[1], qry[2]);
      }

      if (order) {
        query = query.orderBy(order.var, order.type ? "asc" : "desc");
      }

      const items = await query.get();
      const list = items.docs;
      const array = list.map((el) => ({ ...el.data(), id: el.id }));

      const promises = array.map(async (element) => {
        const collections = await module.exports.getDocumentCollections(
          ref,
          element.id
        );
        return { ...element, collections };
      });

      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error("Error en getDocuments:", error);
      throw new Error("Error getting documents");
    }
  },
  getDocumentCollections: async (ref, id) => {
    try {
      const query = db.collection(ref).doc(id);
      const collections = await query.listCollections();
      return collections.map((collection) => collection.id);
    } catch (error) {
      console.error(
        `Error getting document collections for ${ref}/${id}:`,
        error
      );
      throw new Error("Error getting document collections");
    }
  },
  getUserByEmail: async (email) => {
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      return userRecord;
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        // El usuario no existe
        return null;
      }
      // Otro error ocurrió
      throw error;
    }
  },
  createDocument: async (ref, obj, id) => {
    try {
      if (obj.test) {
        return { ...obj, id: "TESTID-XKAhEeCFDm" };
      }

      const data = {
        ...obj,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (id === undefined) {
        const docRef = await db.collection(ref).add(data);
        return { ...data, id: docRef.id };
      } else {
        await db.collection(ref).doc(id).set(data);
        return { ...data, id };
      }
    } catch (error) {
      console.error("Error creating document:", error);
      throw new Error("Error creating document");
    }
  },
  updateDocument: async (ref, id, obj) => {
    try {
      if (obj.test) {
        return { ...obj, id: "TESTID-XKAhEeCFDm" };
      }

      await db
        .collection(ref)
        .doc(id)
        .update({
          ...obj,
          updatedAt: FieldValue.serverTimestamp(),
        });

      return await module.exports.getDocument(ref, id);
    } catch (error) {
      console.error(`Error updating document ${id} in ${ref}:`, error);
      throw new Error("Error updating document");
    }
  },
  deleteDocument: async (ref, id) => {
    try {
      await db.collection(ref).doc(id).delete();
      return true;
    } catch (error) {
      console.error(`Error deleting document ${id} in ${ref}:`, error);
      throw new Error("Error deleting document");
    }
  },
  sendFirebaseEmail: async (emailData) => {
    console.log("holis")
    try {
      await module.exports.createDocument(`mail`, {
        from: "notreply@mi-oasis.com",
        to: emailData.to,
        message: {
          subject: emailData.message.subject,
          html: emailData.message.html,
          attachments: emailData?.attachments,
        },
      });
      return true;
    } catch (error) {
      console.error("Error sending Firebase email:", error);
      throw new Error("Error sending Firebase email");
    }
  },

  // Numero total de elementos de una coleccion sin filtros (Se utiliza para saber el numero total de paginas)
  getTotalDocuments: async (collectionPath) => {
    try {
      const snapshot = await db.collection(collectionPath).get();
      return snapshot.size;
    } catch (error) {
      console.error(
        `Error getting document count for ${collectionPath}:`,
        error
      );
      throw new Error("Error getting document count");
    }
  },

  // Numero total de elementos de una coleccion con filtros (Se utiliza para saber el numero total de paginas)
  getTotalDocumentsWithFilters: async (
    collectionPath,
    filters,
    excludeTypes
  ) => {
    try {
      let query = db.collection(collectionPath);

      // Aplicar filtros
      if (filters && filters.length > 0) {
        filters.forEach((filter) => {
          query = query.where(filter[0], filter[1], filter[2]);
        });
      }

      // Excluir tipos específicos
      if (excludeTypes && excludeTypes.length > 0) {
        query = query.where("type", "not-in", excludeTypes);
      }

      const snapshot = await query.get();
      return snapshot.size;
    } catch (error) {
      console.error(
        `Error getting filtered document count for ${collectionPath}:`,
        error
      );
      throw new Error("Error getting filtered document count");
    }
  },

  // Paginado de colecciones sin filtros
  getPaginatedDocuments: async (
    collectionPath,
    itemsPerPageNumber,
    lastDocId,
    orderBy
  ) => {
    try {
      let query = db
        .collection(collectionPath)
        .orderBy(orderBy[0], orderBy[1])
        .limit(itemsPerPageNumber);

      if (lastDocId) {
        const lastDoc = await db
          .collection(collectionPath)
          .doc(lastDocId)
          .get();
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      const documents = [];
      let newLastDocId = null;

      snapshot.forEach((doc) => {
        const docData = doc.data();
        documents.push({ ...docData, id: doc.id }); // Agregando la propiedad "id"
        newLastDocId = doc.id;
      });

      return { documents, newLastDocId };
    } catch (error) {
      console.error(
        `Error getting paginated documents for ${collectionPath}:`,
        error
      );
      throw new Error("Error getting paginated documents");
    }
  },

  // Paginado de colecciones con filtros
  getPaginatedFilteredDocuments: async (
    collectionPath,
    filters,
    excludeFilters,
    orderBy,
    itemsPerPageNumber,
    lastDocId
  ) => {
    try {
      let query = db.collection(collectionPath);

      // Aplicar filtros
      if (filters && filters.length > 0) {
        filters.forEach((filter) => {
          query = query.where(filter[0], filter[1], filter[2]);
        });
      }

      // Excluir filtros específicos
      if (excludeFilters && excludeFilters.length > 0) {
        excludeFilters.forEach((excludeFilter) => {
          query = query.where(excludeFilter[0], "not-in", excludeFilter[1]);
        });
      }

      // Ordenar
      if (orderBy) {
        query = query.orderBy(orderBy[0], orderBy[1]);
      } else {
        query = query.orderBy("updatedAt", "desc");
      }

      query = query.limit(itemsPerPageNumber);

      // Aplicar paginación
      if (lastDocId) {
        const lastDoc = await db
          .collection(collectionPath)
          .doc(lastDocId)
          .get();
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      const documents = [];
      let newLastDocId = null;

      snapshot.forEach((doc) => {
        const docData = doc.data();
        documents.push({ ...docData, id: doc.id }); // Agregando la propiedad "id"
        newLastDocId = doc.id;
      });

      return { documents, newLastDocId };
    } catch (error) {
      console.error(
        `Error getting paginated filtered documents for ${collectionPath}:`,
        error
      );
      throw new Error("Error getting paginated filtered documents", error);
    }
  },

  //Ejemplo de paginado aplicado en OASIS

  //   // Define los filtros y exclusiones
  //   const itemsPerPageNumber = parseInt(itemsPerPage, 10); (Se define la cantidad de elementos por pagina)
  //   const filters = [["propertyID", "==", propertyID]]; (Se define un filtro)
  //   const excludeFilters = ["type", ["user", "collaborator", "admin", "guard", "vehicle"]]; (Se define un filtro de exclusion, osea que no se mostraran los elementos que tengan estos "types")
  //   const orderBy = ["inviteDetails.name", "asc"]; (Se define el orden de los elementos)

  //   // Obtén el total de documentos filtrados para calcular el total de páginas (si es necesario)
  //   const totalDocuments = await getTotalDocumentsWithFilters(
  //     `residentials/${residentialID}/access`,
  //     filters,
  //     excludeFilters
  //   );
  //   const totalPages = Math.ceil(totalDocuments / itemsPerPageNumber);

  //   // Suponiendo que tienes variables `itemsPerPage` y `lastDocId` para la paginación
  //   const { documents, newLastDocId } = await getPaginatedFilteredDocuments(
  //     `residentials/${residentialID}/access`,
  //     filters,
  //     excludeFilters,
  //     orderBy,
  //     itemsPerPageNumber, // Asegúrate de que esta variable esté definida y sea un número
  //     lastDocId // Asegúrate de que esta variable esté definida o sea null si es la primera página
  //   );

  //   // Construye la respuesta con los documentos filtrados y paginados
  //   return res.status(200).json({
  //     page: documents,
  //     totalPages: totalPages,
  //     lastDocId: newLastDocId,
  //   });
  // }
};
