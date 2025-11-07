export const translateText = async (text, targetLang = "hi") => {
  if (!text) return "";

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(
      text
    )}`;
    const res = await fetch(url);
    const data = await res.json();

    // Flatten translated text array
    return data[0].map((item) => item[0]).join("");
  } catch (err) {
    console.error("Translation error:", err);
    throw new Error("Translation failed. Try again.");
  }
};
