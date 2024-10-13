const axios = require('axios');
const getVoice = require('./getVoice');

async function getAudio(text, lang) {
  try {
    const voice = getVoice(lang);

    const response = await axios({
      url: 'https://api.narakeet.com/text-to-speech/mp3',
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Accept': 'application/octet-stream',
        'x-api-key': process.env.NARAKEET_API_KEY
      },
      params: {
        voice,
        'voice-speed': 0.9
      },
      data: text,
      responseType: 'arraybuffer',
      validateStatus: function (status) {
        return status < 500; // Resolve only if the status code is less than 500
      }
    });
    
    if (response.status === 200) {
      return response.data;
    } else {
      // Convert arraybuffer to string if it's not a successful response
      const errorMessage = Buffer.from(response.data).toString('utf-8');
      throw new Error(`API request failed with status ${response.status}: ${errorMessage}`);
    }
  } catch (error) {
    console.error('Error generating audio:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.status, error.response.statusText);
      if (error.response.data) {
        const errorData = Buffer.from(error.response.data).toString('utf-8');
        console.error('Error response:', errorData);
      }
    }
    throw error;
  }
}

module.exports = getAudio;
