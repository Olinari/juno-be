import express from "express";
import { MongoStore } from "wwebjs-mongo";
import mongoose from "mongoose";
import { ServerApiVersion } from "mongodb";
import generateClient from "./whatsapp-web/whatsapp-web-client.js";
import generateAdmin from "./whatsapp-web/whatsapp-web-admin.js";
import * as dotenv from "dotenv";
import cors from "cors";

const server = { isAdminConnected: false };
dotenv.config();

await mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const store = new MongoStore({ mongoose: mongoose });

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("JUNO server online");
});

app.get("/admin", async (req, res) => {
  const initAdmin = async () => {
    const { getQr, createAdmin } = await generateAdmin({ store });
    const authData = await getQr();

    if (authData) {
      console.log({ qr: authData });
      const { isConnected, admin } = await createAdmin();
      server.isAdminConnected = isConnected;
      if (server.isAdminConnected) {
        console.log("Admin connected!");

        return admin;
      }
    }
  };

  server.admin = await initAdmin();
});

app.get("/connect-client", async (req, res) => {
  if (server.isAdminConnected && server.admin) {
    try {
      const phone = req.query.phone;
      server.isConnected = false;
      const { getQr, authenticateClient } = generateClient({
        phone,
        store,
        admin: server.admin,
      });
      const authData = await getQr();

      if (authData) {
        res.send({ qr: authData });
        server.isConnected = await authenticateClient();
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    res.status(500).json({ message: "Server not initialized" });
  }
});

app.get("/secure-connection", async (req, res) => {
  const phone = req.query.phone;
  res.send({ connected: server.isConnected });
});

const PORT = process.env.PORT || 5501;

app.listen(PORT, console.log(`Server started on port ${PORT}`));
