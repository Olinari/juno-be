import qrcode from "qrcode-terminal";
import wwb from "whatsapp-web.js";
import { measureToxicity } from "../toxcity/toxicity.js";

const { Client, Buttons } = wwb;

export default function generateAdmin() {
  const state = { haltNewQrs: false };

  const admin = new Client({
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  admin.on("create_warning", async (data) => {
    client.sendMessage(data.to, `Message contains ${data.severity}`);
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
    authenticateClient: () =>
      new Promise((resolve) => {
        if (!state.haltNewQrs) {
          state.haltNewQrs = true;
          const clearId = setTimeout(() => {
            resolve(false);
          }, 60000);
          admin.once("ready", () => {
            state.haltNewQrs = false;
            clearTimeout(clearId);
            resolve(true);
          });
        }
      }),
  };
}
