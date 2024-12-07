require('dotenv').config();
const AnkiExport = require('anki-apkg-export').default;
const fs = require('fs-extra');
const path = require('path');

const getTranslation = require('./utils/getTranslation');
const addCard = require('./utils/addCard');
const promptUser = require('./utils/promptUser');

// Set to keep track of added words
const existingWords = new Set();

async function processBatch(phrases, deckPath) {
  try {
    // Environment variable checks
    const requiredEnvVars = [
      'ANTHROPIC_API_KEY',
      'NARAKEET_API_KEY',
      'NATIVE_LANGUAGE',
      'TARGET_LANGUAGE',
      'NATIVE_LANGUAGE_VOICE',
      'TARGET_LANGUAGE_VOICE'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.error(`${envVar} is not set in the environment variables.`);
        return;
      }
    }

    // Ensure the directory exists
    await fs.ensureDir(path.dirname(deckPath));
    
    const apkg = new AnkiExport(`${process.env.TARGET_LANGUAGE}`);
    let newCardsAdded = 0;

    for (const native of phrases) {
      try {
        const target = await getTranslation(native, process.env.TARGET_LANGUAGE);
        console.log(`Translation: ${native} -> ${target}`);
        
        const confirm = await promptUser("Is this translation correct? (y/n): ");

        if (confirm.toLowerCase() === 'y') {
          const added = await addCard(apkg, native, target, existingWords);
          
          if (added) {
            newCardsAdded++;
            console.log(`Added: ${native} - ${target}`);
          }
        } else {
          console.log(`Skipping: ${native}`);
          continue;
        }
      } catch (err) {
        console.log(`Error processing "${native}":`, err);
        continue; // Skip to next phrase on error
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

// Read phrases from text file
try {
  const phrases = fs.readFileSync('phrases.txt', 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#')); // Remove empty lines and comments

  if (phrases.length === 0) {
    console.log('No phrases found in phrases.txt');
    process.exit(1);
  }

  console.log(`Found ${phrases.length} phrases to process...`);
  
  const deckPath = `./${process.env.TARGET_LANGUAGE}.apkg`;
  processBatch(phrases, deckPath);

} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('phrases.txt not found. Please create a file with one phrase per line.');
  } else {
    console.error('Error reading phrases.txt:', error);
  }
  process.exit(1);
}

module.exports = processBatch; 