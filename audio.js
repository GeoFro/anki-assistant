require("dotenv").config();

const fs = require("fs-extra");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
const path = require("path");

const getTranslation = require("./utils/getTranslation");
const getAudio = require("./utils/getAudio");

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

async function createSilenceFile(duration, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input("anullsrc=r=44100:cl=stereo")
      .inputFormat("lavfi")
      .duration(duration)
      .output(outputPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}

async function processPhrase(native, target, workDir) {
  // Generate audio files for each variant
  const nativeAudio = await getAudio(native, "native");
  const targetAudio = await getAudio(target, "target");

  // Save temporary files
  const nativePath = path.join(workDir, `native_${Date.now()}.mp3`);
  const targetPath = path.join(workDir, `target_${Date.now()}.mp3`);
  const targetSlowPath = path.join(workDir, `target_slow_${Date.now()}.mp3`);
  const silencePath = path.join(workDir, `silence_${Date.now()}.mp3`);

  await fs.writeFile(nativePath, nativeAudio);
  await fs.writeFile(targetPath, targetAudio);

  // Create slowed version using ffmpeg
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(targetPath)
      .audioFilters("atempo=0.7")
      .output(targetSlowPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });

  // Create silence file (3 seconds)
  await createSilenceFile(3, silencePath);

  return {
    nativePath,
    targetPath,
    targetSlowPath,
    silencePath,
    cleanup: async () => {
      await Promise.all([
        fs.remove(nativePath),
        fs.remove(targetPath),
        fs.remove(targetSlowPath),
        fs.remove(silencePath),
      ]);
    },
  };
}

async function createAudioTape(phrases, outputPath) {
  try {
    const workDir = path.join(__dirname, "temp");
    await fs.ensureDir(workDir);

    console.log("Processing phrases...");
    const audioSegments = [];

    for (const native of phrases) {
      try {
        console.log(`Processing: ${native}`);
        const target = await getTranslation(
          native,
          process.env.TARGET_LANGUAGE
        );
        console.log(`Translation: ${target}`);

        const segments = await processPhrase(native, target, workDir);
        audioSegments.push(segments);
      } catch (err) {
        console.error(`Error processing phrase "${native}":`, err);
      }
    }

    if (audioSegments.length === 0) {
      throw new Error("No audio segments were successfully created");
    }

    console.log("Combining audio segments...");
    const command = ffmpeg();

    // Add all segments in the correct order
    for (const segment of audioSegments) {
      command
        .input(segment.nativePath)
        .input(segment.silencePath)
        .input(segment.targetPath)
        .input(segment.silencePath)
        .input(segment.targetSlowPath)
        .input(segment.silencePath)
        .input(segment.targetSlowPath)
        .input(segment.silencePath)
        .input(segment.targetPath)
        .input(segment.silencePath);
    }

    // Combine all segments
    await new Promise((resolve, reject) => {
      command
        .on("end", resolve)
        .on("error", reject)
        .mergeToFile(outputPath, workDir);
    });

    // Cleanup temporary files
    console.log("Cleaning up temporary files...");
    await Promise.all(audioSegments.map((segment) => segment.cleanup()));
    await fs.remove(workDir);

    console.log(`Audio tape created successfully at: ${outputPath}`);
  } catch (error) {
    console.error("Error creating audio tape:", error);
    throw error;
  }
}

// Read phrases from text file and create audio tape
try {
  const phrases = fs
    .readFileSync("audio-phrases.txt", "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  if (phrases.length === 0) {
    console.log("No phrases found in audio-phrases.txt");
    process.exit(1);
  }

  console.log(`Found ${phrases.length} phrases to process...`);
  const outputPath = `./${process.env.TARGET_LANGUAGE}_audio_tape.mp3`;
  createAudioTape(phrases, outputPath);
} catch (error) {
  if (error.code === "ENOENT") {
    console.error(
      "audio-phrases.txt not found. Please create a file with one phrase per line."
    );
  } else {
    console.error("Error reading audio-phrases.txt:", error);
  }
  process.exit(1);
}

module.exports = createAudioTape;
