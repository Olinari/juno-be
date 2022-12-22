/* import { ChatGPTAPI, getOpenAIAuth } from "chatgpt";

export default async function example() {
  // use puppeteer to bypass cloudflare (headful because of captchas)
  const openAIAuth = await getOpenAIAuth({
    email: "",
    password: "",
  });

  const api = new ChatGPTAPI({ ...openAIAuth });
  await api.ensureAuth();

  return api;
}
 */
