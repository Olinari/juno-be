import express from "express";
import { MongoStore } from "wwebjs-mongo";
import mongoose from "mongoose";
import { ServerApiVersion } from "mongodb";
import generateClient from "./whatsapp-web/whatsapp-web-client.js";
import generateAdmin from "./whatsapp-web/whatsapp-web-admin.js";
import * as dotenv from "dotenv";
import cors from "cors";

const server = { isAdminConnected: false, connectedUsers: {} };
dotenv.config();

try {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  });
  console.log("Mongo Connected");
} catch (error) {
  console.log(error);
}

const store = new MongoStore({ mongoose });

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("JUNO server online");
});

app.get("/admin", async (req, res) => {
  try {
    if (server.admin) {
      return;
    }
    const initAdmin = async () => {
      const { getQr, createAdmin } = await generateAdmin({ store });
      const authData = await getQr();

      if (authData) {
        console.log({ qr: authData });
        res.send({ qr: authData });
      }

      const { isConnected, admin } = await createAdmin();

      server.isAdminConnected = isConnected;
      if (server.isAdminConnected) {
        console.log("admin connected!");

        return admin;
      }
    };

    server.admin = await initAdmin();
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

app.get("/connect-client", async (req, res) => {
  if (server.isAdminConnected && server.admin) {
    try {
      const phone = req.query.phone;
      const { getQr, createClient } = generateClient({
        phone,
        store,
        admin: server.admin,
      });
      const authData = await getQr();
      if (authData) {
        res.send({ qr: authData });
        const { isConnected, client } = await createClient();
        server.connectedUsers[phone] = { isConnected, client };
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  } else {
    res.status(500).json({ message: "Server not initialized" });
  }
});

app.get("/secure-connection", async (req, res) => {
  const phone = req.query.phone;

  res.send({ connected: server.connectedUsers[phone]?.isConnected });
});

app.get("/secure-admin", async (req, res) => {
  res.send({ connected: server.isAdminConnected });
});

app.get("/get-user-groups", async (req, res) => {
  const phone = req.query.phone;
  if (!server.connectedUsers[phone]) {
    res.status(500).json({ message: "No such user" });
    return;
  }
  try {
    const chats = await server.connectedUsers[phone].client.getChats();

    const groups = chats.filter((chat) => chat.isGroup);

    res.send({ data: groups });
  } catch (error) {
    res.status(500).json({ message: "err" });
  }
});

const PORT = process.env.PORT || 5501;

app.listen(PORT, console.log(`Server started on port ${PORT}`));
