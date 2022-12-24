import qrcode from "qrcode-terminal";
import wwb from "whatsapp-web.js";
import { measureToxicity } from "../toxcity/toxicity.js";

const { Client } = wwb;

export default function generateClient({ phone, admin }) {
  const state = { haltNewQrs: false };

  const client = new Client({
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("message", (message) => {
    if (message.body === "ping") {
      client.sendMessage(message.from, "pong");
    }
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
        client.once("qr", (qr) => {
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
          }, 15000);
          client.once("ready", () => {
            state.haltNewQrs = false;
            clearTimeout(clearId);
            resolve(true);
          });
        }
      }),
  };
}
