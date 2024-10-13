require('dotenv').config();
const AnkiExport = require('anki-apkg-export').default;
const fs = require('fs-extra');
const path = require('path');

const getTranslation = require('./utils/getTranslation');
const addCard = require('./utils/addCard');
const promptUser = require('./utils/promptUser');

// Set to keep track of added words
const existingWords = new Set();

// Main function to create or update the deck
async function updateDeck(deckPath) {
  try {
      if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set in the environment variables.');
      return;
    } else if (!process.env.NARAKEET_API_KEY) {
      console.error('NARAKEET_API_KEY is not set in the environment variables.');
      return;
    } else if (!process.env.NATIVE_LANGUAGE) {
      console.error('NATIVE_LANGUAGE is not set in the environment variables.');
      return;
    } else if (!process.env.TARGET_LANGUAGE) {
      console.error('TARGET_LANGUAGE is not set in the environment variables.');
      return;
    }  else if (!process.env.NATIVE_LANGUAGE_VOICE) {
      console.error('NATIVE_LANGUAGE_VOICE is not set in the environment variables.');
      return;
    } else if (!process.env.TARGET_LANGUAGE_VOICE) {
      console.error('TARGET_LANGUAGE_VOICE is not set in the environment variables.');
      return;
    }

    // Ensure the directory exists
    await fs.ensureDir(path.dirname(deckPath));
    
    const apkg = new AnkiExport(`${process.env.TARGET_LANGUAGE}`);

    let newCardsAdded = 0;

    while (true) {
      const native = await promptUser(`Enter an ${process.env.NATIVE_LANGUAGE} word or phrase (or 'q' to quit): `);
      
      if (native.toLowerCase() === 'q') {
        break;
      }

      const target = await getTranslation(native, process.env.TARGET_LANGUAGE);
      console.log(`Translation: ${target}`);

      const confirm = await promptUser("Is this translation correct? (y/n): ");

      if (confirm.toLowerCase() === 'y') {
        const added = await addCard(apkg, native, target, existingWords);
        
        if (added) {
          newCardsAdded++;
          console.log(`Added: ${native} - ${target}`);
        }
      } else {
        console.log("Card not added.");
      }
    }

    if (newCardsAdded > 0) {
      const zip = await apkg.save();
      const tempPath = `${deckPath}.temp`;
      await fs.writeFile(tempPath, zip);
      
      // Rename the temp file to the actual deck file
      await fs.move(tempPath, deckPath, { overwrite: true });
      
      console.log(`Anki deck updated successfully! Added ${newCardsAdded} new cards.`);
      console.log(`Deck saved to: ${deckPath}`);
      console.log('Please manually import this deck into Anki to see the changes.');
    } else {
      console.log('No new cards to add. Deck remains unchanged.');
    }
  } catch (error) {
    console.error('Error updating Anki deck:', error);
  }
}

// Specify the path to your Anki deck
const deckPath = `./${process.env.TARGET_LANGUAGE}.apkg`;

// Call the function to update the deck
updateDeck(deckPath);
