// eitaa.js
// ربات «لینک شیشه‌ای‌ساز تاویتا» برای ایتا
// توکن ربات را در محیط ورسل با نام EITAA_BOT_TOKEN تنظیم کن

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

  // اگر کیبورد یا تنظیمات اضافه داشتیم
  if (options.reply_markup) {
    // اینجا می‌تونیم شیء جاوااسکریپت بفرستیم؛
    // اگر API خواست رشته باشد، می‌شود:
    // payload.reply_markup = JSON.stringify(options.reply_markup);
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

// -------- کمک‌تابع: ساخت JSON دکمه شیشه‌ای برای کاربر --------
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
  // خروجی رشته‌ای برای کپی‌کردن
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
  const buttonUrl = parts.slice(1).join("|").trim(); // اگر کاربر تو لینک هم '|' داشت، خراب نشه

  if (!buttonText || !buttonUrl) {
    await sendMessage(
      chatId,
      "متن دکمه یا لینکت خالیه 🧐\n\n" +
        "مثال صحیح:\n" +
        "<code>عضویت در تاویتا | https://eitaa.com/tavita</code>"
    );
    return;
  }

  // یک پیش‌نمایش دکمه شیشه‌ای واقعی برای کاربر بفرستیم
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

  // کد JSON آماده برای کپی‌کردن (اگر کاربر خواست خودش با API کار کنه)
  const jsonCode = buildInlineKeyboardJson(buttonText, buttonUrl);

  await sendMessage(
    chatId,
    "کد JSON آمادهٔ دکمه شیشه‌ای (برای کار با API یا ربات‌های دیگه):\n\n" +
      "<code>" +
      jsonCode +
      "</code>"
  );
}

// خروجی برای استفاده در پروژه (مثل نسخهٔ بازی کلمات)
export { sendMessage, handleMessage };
