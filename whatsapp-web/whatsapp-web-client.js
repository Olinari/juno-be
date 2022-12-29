import qrcode from "qrcode-terminal";
import wwb from "whatsapp-web.js";
import { measureToxicity } from "../toxcity/toxicity.js";

const { Client, RemoteAuth } = wwb;

export default function generateClient({ phone, admin, store }) {
  const state = { haltNewQrs: false };

  const client = new Client({
    /*     authStrategy: new RemoteAuth({
      clientId: phone,
      store: store,
      backupSyncIntervalMs: 60000,
    }),
 */
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("message_create", async (message) => {
    const { offensiveMessage, labels } = await measureToxicity(message.body);
    if (offensiveMessage) {
      admin.sendMessage(
        `${phone}@c.us`,
        `Ariel's phone sent messages you should know about.`
      );
      labels.forEach((label) => {
        admin.sendMessage(`${phone}@c.us`, `Message contains ${label}`);
      });
    }
  });

  client.initialize();

  return {
    getQr: () =>
      new Promise((resolve) => {
        const clearId = setTimeout(() => {
          resolve(false);
        }, 60000);

        client.on("authenticated", () => {
          console.log("already authenticated");
          resolve(false);
        });

        client.once("qr", (qr) => {
          if (state.isAuthenticated) {
            resolve(false);
          }
          qrcode.generate(qr, { small: true }, (qr) => {
            clearTimeout(clearId);
            resolve(qr);
          });
        });
      }),
    createClient: () =>
      new Promise((resolve) => {
        if (!state.haltNewQrs) {
          state.haltNewQrs = true;
          const clearId = setTimeout(() => {
            resolve({ isConnected: false, client: null });
          }, 60000);

          client.on("ready", () => {
            console.log("ready");
            state.haltNewQrs = false;
            clearTimeout(clearId);
            resolve({ isConnected: true, client });
          });
        }
      }),
  };
}
