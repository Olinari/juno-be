import express from "express";
import generateClient from "./whatsapp-web/whatsapp-web-client.js";
import generateAdmin from "./whatsapp-web/whatsapp-web-admin.js";
import cors from "cors";

const session = { isAdminConnected: false, isUserConnected: false };

const initAdmin = async () => {
  const { getQr, authenticateClient } = generateAdmin();
  const authData = await getQr();

  if (authData) {
    console.log({ qr: authData });
    session.isAdminConnected = await authenticateClient();
    if (session.isAdminConnected) {
      console.log("Admin connected!");
    }
  }
};

const app = express();
app.use(cors());

initAdmin();

app.get("/", (req, res) => {
  res.send("JUNO server online");
});

app.get("/auth", async (req, res) => {
  if (session.isAdminConnected) {
    try {
      session.isConnected = false;
      const { getQr, authenticateClient } = generateClient();
      const authData = await getQr();

      if (authData) {
        res.send({ qr: authData });
        session.isConnected = await authenticateClient();
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    res.status(500).json({ message: "Server not initialized" });
  }
});

app.get("/secure-connection", async (req, res) => {
  res.send({ connected: session.isConnected });
});

const PORT = process.env.PORT || 5501;

app.listen(PORT, console.log(`Server started on port ${PORT}`));
