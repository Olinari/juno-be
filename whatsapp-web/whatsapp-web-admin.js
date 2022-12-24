import qrcode from "qrcode-terminal";
import wwb from "whatsapp-web.js";

const { Client, RemoteAuth } = wwb;

const generateAdmin = ({ store }) => {
  const state = { haltNewQrs: false };

  const admin = new Client({
    authStrategy: new RemoteAuth({
      clientId: "Admin",
      store: store,
      backupSyncIntervalMs: 60000,
    }),

    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  admin.on("authenticated", () => {
    console.log("Admin Connected");
  });

  admin.initialize();

  return {
    getQr: () =>
      new Promise((resolve) => {
        const clearId = setTimeout(() => {
          resolve(false);
        }, 60000);
        admin.once("qr", (qr) => {
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

          admin.once("ready", () => {
            state.haltNewQrs = false;
            clearTimeout(clearId);
            resolve({ isConnected: true, admin });
          });
        }
      }),
  };
};
export default generateAdmin;
