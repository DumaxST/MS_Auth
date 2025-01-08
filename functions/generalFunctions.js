const admin = require("firebase-admin");
const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");

module.exports = {
  getDocument: async (ref, id) => {
    const query = db.collection(ref).doc(id);
    let item = await query.get();
    if (item.exists) {
      const itemToReturn = item.data();
      itemToReturn.id = id;
      const collections = await module.exports.getDocumentCollections(ref, id);
      itemToReturn.collections = collections;
      return itemToReturn;
    } else {
      return false;
    }
  },
  getDocuments: async (ref, qry, order) => {
    let query = "";
    if (qry == undefined && order == undefined) {
      query = db.collection(ref);
    } else if (qry != undefined && order == undefined) {
      query = db.collection(ref).where(qry[0], qry[1], qry[2]);
    } else if (order != undefined && qry == undefined) {
      query = db
        .collection(ref)
        .orderBy(order.var, order.type ? "asc" : "desc");
    } else if (qry != undefined && order != undefined) {
      console.error(
        "getDocuments function accepts only one parameter, either qry or order"
      );
      return [];
    }
    try {
      const items = await query.get();

      const list = items.docs;
      let array = list.reduce((acc, el) => {
        return acc.concat({ ...el.data(), id: el.id });
      }, []);

      const promises = array.map(async (element) => {
        const collections = await module.exports.getDocumentCollections(
          ref,
          element.id
        );
        return { ...element, collections };
      });

      // Esperar a que todas las llamadas a la base de datos se completen
      const results = await Promise.all(promises);

      return results;
    } catch (error) {
      console.error("Error en getDocuments:", error);
      return [];
    }
  },
  getDocumentCollections: async (ref, id) => {
    const query = db.collection(ref).doc(id);
    let collections = await query.listCollections();
    return collections.map((collection) => collection.id);
  },
  createDocument: async (ref, obj, id) => {
    if (obj.test) {
      return { ...obj, id: "TESTID-XKAhEeCFDm" };
    }

    if (id == undefined) {
      return await db.collection(ref).add({
        ...obj,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      return await db
        .collection(ref)
        .doc(id)
        .set({
          ...obj,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
    }
  },
  updateDocument: async (ref, id, obj) => {
    if (obj.test) {
      return { ...obj, id: "TESTID-XKAhEeCFDm" };
    }

    return await db
      .collection(ref)
      .doc(id)
      .update({ ...obj, updatedAt: FieldValue.serverTimestamp() })
      .then(async () => {
        return await module.exports.getDocument(ref, id);
      });
  },
  deleteDocument: async (ref, id) => {
    try {
      await db.collection(ref).doc(id).delete();
      return true;
    } catch (error) {
      console.error("Error deleting document: ", error);
      return false;
    }
  },
};
