const getAudio = require('./getAudio');

async function addCard(apkg, native, target, existingWords) {

  const wordPair = `${native.toLowerCase()}-${target.toLowerCase()}`;

  if (existingWords.has(wordPair)) {
    console.log(`Skipping existing word: ${native} - ${target}`);
    return false;
  }

  const nativeAudio = await getAudio(native, 'native');
  const targetAudio = await getAudio(target, 'target');
  
  const nativeFileName = `native_${Date.now()}.mp3`;
  const targetFileName = `target_${Date.now()}.mp3`;
  
  apkg.addMedia(nativeFileName, nativeAudio);
  apkg.addMedia(targetFileName, targetAudio);
  
  const front = `${native}<br>[sound:${nativeFileName}]`;
  const back = `${target}<br>[sound:${targetFileName}]`;

  apkg.addCard(front, back);
  existingWords.add(wordPair);

  return true;
}

module.exports = addCard;
