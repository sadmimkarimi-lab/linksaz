// api/eitaa.js
// ربات «لینک شیشه‌ای‌ساز تاویتا»
// روی Vercel متغیر محیطی زیر را ست کن:
// EITAA_BOT_TOKEN = bot123:ABC...

const BOT_TOKEN = process.env.EITAA_BOT_TOKEN;
const API_BASE = BOT_TOKEN
  ? `https://api.eitaa.com/bot${BOT_TOKEN}`
  : null;

// -----------------------------------------------------
// ارسال پیام به ایتا
// -----------------------------------------------------
async function sendMessage(chat_id, text, options = {}) {
  if (!API_BASE) {
    console.error("EITAA_BOT_TOKEN is missing");
    return;
  }

  const payload = {
    chat_id,
    text,
    parse_mode: "HTML",
  };

  if (options.reply_markup) {
    payload.reply_markup = options.reply_markup;
  }

  try {
    const response = await fetch(`${API_BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error("Eitaa sendMessage error:", data);
    }
  } catch (err) {
    console.error("Error sending message:", err);
  }
}

// -----------------------------------------------------
// ساخت JSON دکمه شیشه‌ای
// -----------------------------------------------------
function buildInlineKeyboardJson(buttonText, buttonUrl) {
  return JSON.stringify({
    inline_keyboard: [
      [
        {
          text: buttonText,
          url: buttonUrl,
        },
      ],
    ],
  });
}

// -----------------------------------------------------
// پیام راهنما
// -----------------------------------------------------
const HELP_TEXT =
  "سلام 👋\n\n" +
  "من ربات «لینک شیشه‌ای‌ساز تاویتا» هستم.\n" +
  "با من می‌تونی خیلی راحت دکمه شیشه‌ای بسازی ✨\n\n" +
  "فقط یک پیام بفرست به این شکل:\n" +
  "<code>متن دکمه | لینک</code>\n\n" +
  "مثال:\n" +
  "<code>عضویت در تاویتا | https://eitaa.com/tavita</code>\n\n" +
  "اگر راهنما خواستی دستور /help رو بفرست 🌸";

// -----------------------------------------------------
// منطق اصلی ربات
// -----------------------------------------------------
async function handleMessage(message) {
  if (!message || !message.chat) return;

  const chatId = message.chat.id;
  const text = (message.text || "").trim();

  // شروع / راهنما
  if (text === "/start" || text === "/help" || text === "راهنما") {
    await sendMessage(chatId, HELP_TEXT);
    return;
  }

  // انتظار داریم متن دکمه | لینک باشد
  const parts = text.split("|");

  if (parts.length < 2) {
    await sendMessage(
      chatId,
      "فرمت پیام درست نیست 😅\n\n" +
        "لطفاً این‌طوری بفرست:\n" +
        "<code>متن دکمه | لینک</code>\n\n" +
        "مثال:\n" +
        "<code>دنبال کردن کانال | https://eitaa.com/yourchannel</code>"
    );
    return;
  }

  const buttonText = parts[0].trim();
  const buttonUrl = parts.slice(1).join("|").trim();

  if (!buttonText || !buttonUrl) {
    await sendMessage(
      chatId,
      "متن دکمه یا لینک خالیه 🧐\n\n" +
        "مثال:\n" +
        "<code>عضویت در کانال | https://eitaa.com/yourpage</code>"
    );
    return;
  }

  // ساخت دکمه شیشه‌ای
  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: buttonText,
          url: buttonUrl,
        },
      ],
    ],
  };

  // ارسال پیش‌نمایش دکمه
  await sendMessage(
    chatId,
    "پیش‌نمایش دکمه شیشه‌ای 👇\n\n" +
      "این پیام را می‌تونی مستقیم توی کانالت فوروارد کنی ✨",
    { reply_markup: replyMarkup }
  );

  // ارسال JSON دکمه
  const jsonCode = buildInlineKeyboardJson(buttonText, buttonUrl);

  await sendMessage(
    chatId,
    "کد JSON دکمه شیشه‌ای:\n\n" +
      `<code>${jsonCode}</code>`
  );
}

// -----------------------------------------------------
// هندلر Vercel برای وبهوک ایتا
// -----------------------------------------------------
export default async function handler(req, res) {
  if (req.method === "POST") {
    const update = req.body || {};
    const message =
      update.message ||
      update.edited_message ||
      update.channel_post ||
      update.edited_channel_post;

    try {
      await handleMessage(message);
    } catch (err) {
      console.error("handleMessage error:", err);
    }

    res.status(200).json({ ok: true });
    return;
  }

  res.status(200).send("OK");
}
