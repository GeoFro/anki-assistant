function getVoice(lang) {
    const voices = {
      native: process.env.NATIVE_LANGUAGE_VOICE,
      target: process.env.TARGET_LANGUAGE_VOICE,
    };
    
    
    return voices[lang];
}

module.exports = getVoice;
