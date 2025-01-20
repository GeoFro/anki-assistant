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
  const targetSlowerPath = path.join(
    workDir,
    `target_slower_${Date.now()}.mp3`
  );
  const silencePath = path.join(workDir, `silence_${Date.now()}.mp3`);
  const longSilencePath = path.join(workDir, `long_silence_${Date.now()}.mp3`);

  await fs.writeFile(nativePath, nativeAudio);
  await fs.writeFile(targetPath, targetAudio);

  // Create slower version (0.7x) using ffmpeg
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(targetPath)
      .audioFilters("atempo=0.7")
      .output(targetSlowPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });

  // Create slightly slowed version (0.85x) using ffmpeg
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(targetPath)
      .audioFilters("atempo=0.85")
      .output(targetSlowerPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });

  // Create silence files (3 and 5 seconds)
  await createSilenceFile(3, silencePath);
  await createSilenceFile(5, longSilencePath);

  return {
    nativePath,
    targetPath,
    targetSlowPath,
    targetSlowerPath,
    silencePath,
    longSilencePath,
    cleanup: async () => {
      await Promise.all([
        fs.remove(nativePath),
        fs.remove(targetPath),
        fs.remove(targetSlowPath),
        fs.remove(targetSlowerPath),
        fs.remove(silencePath),
        fs.remove(longSilencePath),
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

    for (const { native, target: existingTranslation } of phrases) {
      try {
        console.log(`Processing: ${native}`);
        const target =
          existingTranslation ||
          (await getTranslation(native, process.env.TARGET_LANGUAGE));

        if (existingTranslation) {
          console.log(`Using existing translation: ${target}`);
        } else {
          console.log(`Generated translation: ${target}`);
        }

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
        .input(segment.longSilencePath) // 5 second pause after native
        .input(segment.targetPath)
        .input(segment.silencePath) // 3 second pause
        .input(segment.targetSlowPath) // 0.7x speed
        .input(segment.silencePath) // 3 second pause
        .input(segment.targetSlowerPath) // 0.85x speed
        .input(segment.silencePath) // 3 second pause
        .input(segment.targetPath)
        .input(segment.silencePath); // 3 second pause before next phrase
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
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const parts = line.split("---").map((part) => part.trim());
      return {
        native: parts[0],
        target: parts[1] || null, // Will be null if no translation is provided
      };
    });

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
