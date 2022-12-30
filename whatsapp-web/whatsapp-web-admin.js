import { resolve } from "path";
import qrcode from "qrcode-terminal";
import wwb from "whatsapp-web.js";

const { Client, RemoteAuth } = wwb;

const generateAdmin = ({ store }) => {
  const state = { haltNewQrs: false };

  const admin = new Client({
    /*   authStrategy: new RemoteAuth({
      clientId: "Admin",
      store: store,
      backupSyncIntervalMs: 60000,
    }), */
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });
  admin.initialize();

  return {
    getQr: () =>
      new Promise((resolve, reject) => {
        const clearId = setTimeout(() => {
          reject(new Error("QR event wasn't emitted in 60 seconds."));
        }, 60000);

        admin.once("authenticated", () => {
          console.log("already authenticated");
          resolve(false);
        });

        admin.once("qr", (qr) => {
          if (state.isAuthenticated) {
            reject(new Error("Admin aready exists!"));
          }
          qrcode.generate(qr, { small: true }, (qr) => {
            clearTimeout(clearId);
            resolve(qr);
          });
        });
      }),
    createAdmin: () =>
      new Promise((resolve) => {
        if (!state.haltNewQrs) {
          state.haltNewQrs = true;
          const clearId = setTimeout(() => {
            resolve({ isConnected: false, admin: null });
          }, 60000);

          admin.on("ready", () => {
            console.log("ready");
            state.haltNewQrs = false;
            clearTimeout(clearId);
            resolve({ isConnected: true, admin });
          });
        }
      }),
  };
};

export const connectAdmin = async () => {
  {
    if (server.admin) {
      console.log("already connected");
      return;
    }
    const initAdmin = async () => {
      const { getQr, createAdmin } = await generateAdmin({ store: null });
      const authData = await getQr();

      if (authData) {
        console.log({ qr: authData });
      }

      const { isConnected, admin } = await createAdmin();

      server.isAdminConnected = isConnected;
      if (server.isAdminConnected) {
        console.log("admin connected!");

        return admin;
      }
    };

    server.admin = await initAdmin();
  }
};
export default generateAdmin;
