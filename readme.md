# Anki Assistant

Anki Assistant is a Node.js application that helps you create and update Anki decks for language learning. It allows you to input words or phrases in your native language, translates them to your target language, and adds them as cards to an Anki deck.

It uses Anthropic for fluent translations and Narakeet for audio generation.

<img width="541" alt="Demo" src="https://github.com/user-attachments/assets/0156ba34-6bbb-4f2b-a4fb-f85b00c76734">

<img width="414" alt="Cards" src="https://github.com/user-attachments/assets/cc34f70f-4850-44eb-83cc-a9c7d26b06ac">

## Installation

1. Clone this repository:

   ```
   git clone https://github.com/GeoFro/anki-assistant.git
   cd anki-assistant
   ```

2. Install the required dependencies:

   ```
   npm i
   ```

3. Set up the environment variables:

   ```
   npm run setup
   ```

4. Open the `.env` file and update the following environment variables:

   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key
   NARAKEET_API_KEY=your_narakeet_api_key

   NATIVE_LANGUAGE=your_native_language # The language you speak
   TARGET_LANGUAGE=your_target_language # The language you want to learn

   NATIVE_LANGUAGE_VOICE=your_native_language_voice # The voice to use for the native language audio
   TARGET_LANGUAGE_VOICE=your_target_language_voice # The voice to use for the target language audio
   ```

   Replace the placeholder values with your actual API keys and preferences.
   You will need API keys for both Anthropic and Narakeet.

   Link to Anthropic: https://console.anthropic.com/dashboard

   Link to Narakeet: https://www.narakeet.com/

   Link to Narakeet voices: https://www.narakeet.com/languages/

# Usage

1. Run the application:

   ```
   npm start
   ```

2. Follow the prompts in the console:

   - Enter a word or phrase in your native language.
   - The application will provide a translation.
   - Confirm if the translation is correct (y/n).
   - Repeat this process for as many words as you want to add.
   - Enter 'q' when you're done adding words.

3. The application will create an Anki deck file (`.apkg`) in the project directory.

4. Import the generated `.apkg` file into Anki to see your new cards.

## Batch Mode

In addition to the interactive mode, you can process multiple phrases at once using batch mode:

1. Create a `phrases.txt` file in the project directory (you can copy from `phrases.txt.example`):

   ```
   cp phrases.txt.example phrases.txt
   ```

   Then edit `phrases.txt` with your phrases, one per line:

   ```
   # Lines starting with # are ignored as comments
   hello
   goodbye
   thank you
   how are you
   ```

2. Run the batch processor:

   ```
   npm run batch
   ```

3. For each phrase, the application will:
   - Show the translation
   - Ask for confirmation
   - Generate audio files
   - Add the card to your deck if confirmed

This is particularly useful when you have a list of phrases prepared in advance.

## Audio Tapes

You can also create audio learning tapes that combine multiple phrases into a single MP3 file. Each phrase follows this pattern:

1. Native language phrase
2. 5-second pause
3. Target language phrase (normal speed)
4. 3-second pause
5. Target language phrase (0.7x speed)
6. 3-second pause
7. Target language phrase (0.85x speed)
8. 3-second pause
9. Target language phrase (normal speed)
10. 3-second pause before next phrase

This format is particularly useful for listening and pronunciation practice, when you may not be able to read the text.

1. Create an `audio-phrases.txt` file in the project directory (you can copy from `audio-phrases.txt.example`):

   ```
   cp audio-phrases.txt.example audio-phrases.txt
   ```

   Then edit `audio-phrases.txt` with your phrases, one per line. You can either:

   1. Add just the native language phrase:

      ```
      I usually eat breakfast at home
      She can speak three languages very well
      The cat likes to sleep under the table
      ```

   2. Or include both native phrase and translation, separated by `---`:
      ```
      I usually eat breakfast at home --- Es parasti ēdu brokastis mājās
      She can speak three languages very well --- Viņa var ļoti labi runāt trīs valodās
      The cat likes to sleep under the table --- Kaķim patīk gulēt zem galda
      ```

   If you provide translations, they will be used directly. Otherwise, the application will generate translations automatically.

2. Run the audio tape creator:

   ```

   ```
