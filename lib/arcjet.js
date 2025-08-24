import Arcjet, { detectBot } from "@arcjet/next";

const aj = Arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    // ❌ Block all automated bots
    detectBot({
      mode: "LIVE",
      deny: ["automated"],
    }),

    // ✅ Allow Googlebot
    detectBot({
      mode: "LIVE",
      allow: ["google"],
    }),
  ],
});

export default aj;



