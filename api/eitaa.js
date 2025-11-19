// api/eitaa.js
// ربات «لینک شیشه‌ای‌ساز تاویتا» برای ایتا
// حتماً روی Vercel متغیر محیطی EITAA_BOT_TOKEN را ست کن

const BOT_TOKEN = process.env.EITAA_BOT_TOKEN;
const API_BASE = BOT_TOKEN ? `https://api.eitaa.com/bot${BOT_TOKEN}` : null;

// -------- تابع عمومی برای ارسال پیام --------
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
    const res = await fetch(`${API_BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error("Eitaa sendMessage error:", data);
    }
  } catch (err) {
    console.error("Error sending message:", err);
  }
}

// -------- کمک‌تابع: ساخت JSON دکمه شیشه‌ای --------
function buildInlineKeyboardJson(buttonText, buttonUrl) {
  const obj = {
    inline_keyboard: [
      [
        {
          text: buttonText,
          url: buttonUrl,
        },
      ],
    ],
  };
  return JSON.stringify(obj);
}

// -------- متن راهنما --------
const HELP_TEXT =
  "سلام 👋\n\n" +
  "من ربات «لینک شیشه‌ای‌ساز تاویتا» هستم.\n" +
  "با من می‌تونی خیلی راحت برای ایتا دکمه شیشه‌ای بسازی.\n\n" +
  "فقط یک پیام بفرست به این شکل:\n" +
  "<code>متن دکمه | لینک</code>\n\n" +
  "مثال:\n" +
  "<code>عضویت در تاویتا | https://eitaa.com/tavita</code>\n\n" +
  "من برات یک پیام با دکمهٔ شیشه‌ای می‌فرستم که می‌تونی همون رو تو کانالت فوروارد کنی 🌸" +
  "\n\nاگر راهنمـا خواستی، دستور /help رو بفرست.";

// -------- منطق اصلی ربات --------
async function handleMessage(message) {
  if (!message || !message.chat) return;

  const chatId = message.chat.id;
  const text = (message.text || "").trim();

  // /start یا شروع
  if (text === "/start" || text === "start" || text === "شروع") {
    await sendMessage(chatId, HELP_TEXT);
    return;
  }

  // /help
  if (text === "/help" || text === "راهنما" || text === "کمک") {
    await sendMessage(chatId, HELP_TEXT);
    return;
  }

  // انتظار داریم فرمت "متن دکمه | لینک" باشد
  const parts = text.split("|");
  if (parts.length < 2) {
    await sendMessage(
      chatId,
      "فرمت پیام درست نیست 😅\n\n" +
        "لطفاً این‌طوری بفرست:\n" +
        "<code>متن دکمه | لینک</code>\n\n" +
        "مثال:\n" +
        "<code>عضویت در تاویتا | https://eitaa.com/tavita</code>"
    );
    return;
  }

  const buttonText = parts[0].trim();
  const buttonUrl = parts.slice(1).join("|").trim();

  if (!buttonText || !buttonUrl) {
    await sendMessage(
      chatId,
      "متن دکمه یا لینکت خالیه 🧐\n\n" +
        "مثال صحیح:\n" +
        "<code>عضویت در تاویتا | https://eitaa.com/tavita</code>"
    );
    return;
  }

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

  await sendMessage(
    chatId,
    "پیش‌نمایش دکمه شیشه‌ای 👇\n\n" +
      "این پیام رو می‌تونی مستقیماً در کانال‌ات فوروارد کنی تا دکمه زیر پست دیده بشه.",
    { reply_markup: replyMarkup }
  );

  const jsonCode = buildInlineKeyboardJson(buttonText, buttonUrl);

  await sendMessage(
    chatId,
    "کد JSON آمادهٔ دکمه شیشه‌ای (برای کار با API یا ربات‌های دیگه):\n\n" +
      "<code>" +
      jsonCode +
      "</code>"
  );
}

// -------- هندلر وبهوک برای Vercel --------
export default async function handler(req, res) {
  if (req.method === "POST") {
    const update = req.body || {};
    const message = update.message || update.edited_message;

    try {
      await handleMessage(message);
    } catch (err) {
      console.error("handleMessage error:", err);
    }

    // همیشه 200 برگردونیم
    res.status(200).json({ ok: true });
    return;
  }

  // برای GET و متدهای دیگر فقط OK
  res.status(200).send("OK");
}
