import { openDB, type DBSchema } from "idb";

interface MimdokkDB extends DBSchema {
  templates: {
    key: number;
    value: {
      name: string;
      buffer: ArrayBuffer;
      tags: string[];
      createdAt: Date;
    };
  };
  sessions: {
    key: number;
    value: {
      templateId: number;
      formData: Record<string, string>;
      updatedAt: Date;
    };
    indexes: { "by-template": number };
  };
}

const DB_NAME = "mimdokk-db";
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB<MimdokkDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("templates")) {
        db.createObjectStore("templates", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains("sessions")) {
        const sessionStore = db.createObjectStore("sessions", {
          keyPath: "id",
          autoIncrement: true,
        });
        sessionStore.createIndex("by-template", "templateId");
      }
    },
  });
};

export const saveTemplate = async (
  name: string,
  buffer: ArrayBuffer,
  tags: string[]
) => {
  const db = await initDB();
  return db.add("templates", {
    name,
    buffer,
    tags,
    createdAt: new Date(),
  });
};

export const getTemplates = async () => {
  const db = await initDB();
  return db.getAll("templates");
};

export const saveSession = async (
  templateId: number,
  formData: Record<string, string>,
  sessionId?: number
) => {
  const db = await initDB();
  const session = {
    templateId,
    formData,
    updatedAt: new Date(),
  };

  if (sessionId) {
    return db.put("sessions", { ...session, id: sessionId });
  } else {
    return db.add("sessions", session);
  }
};

export const getSessionsByTemplate = async (templateId: number) => {
  const db = await initDB();
  return db.getAllFromIndex("sessions", "by-template", templateId);
};

export const getSession = async (id: number) => {
  const db = await initDB();
  return db.get("sessions", id);
};

export const getTemplate = async (id: number) => {
  const db = await initDB();
  return db.get("templates", id);
};

export const getAllSessions = async () => {
  const db = await initDB();
  const sessions = await db.getAll("sessions");
  // We might want to join with templates to get names, but for now let's just return sessions
  // and maybe fetch templates separately or store templateName in session for easier display
  return sessions;
};
