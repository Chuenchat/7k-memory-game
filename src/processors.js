import { PROCESSING_CONFIG } from "./config";

/**
 * Detect changed pixels and keep LAST changed value (recommended for memory game)
 * Uses LAST frame as baseline (assumes last frame = all cards face down)
 * Only stores pixels that differ from baseline (face-up cards)
 * @param {Blob} blob - Video blob
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<string>} Data URL of result image
 */
export const processVideoChangedPixelsLastValue = async (blob, onProgress) => {
  const video = document.createElement("video");
  video.src = URL.createObjectURL(blob);

  await new Promise((resolve) => {
    video.onloadedmetadata = () => {
      video.currentTime = 0;
      resolve();
    };
  });

  await new Promise((resolve) => {
    video.onseeked = resolve;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Apply scaling
  canvas.width = Math.floor(video.videoWidth * PROCESSING_CONFIG.scaleDown);
  canvas.height = Math.floor(video.videoHeight * PROCESSING_CONFIG.scaleDown);

  const fps = PROCESSING_CONFIG.fps;
  const frameCount = Math.floor(video.duration * fps);

  // Get baseline from LAST frame (all cards face down, no popup)
  video.currentTime = video.duration - 0.1; // Slightly before end to avoid black frame
  await new Promise((resolve) => {
    video.onseeked = resolve;
  });
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const baselineData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Result will store pixels that differ from baseline
  const result = ctx.createImageData(canvas.width, canvas.height);
  // Start with baseline (all cards face down)
  for (let i = 0; i < baselineData.data.length; i++) {
    result.data[i] = baselineData.data[i];
  }

  const lastChangeFrame = new Int32Array(canvas.width * canvas.height);
  lastChangeFrame.fill(-1);
  const threshold = PROCESSING_CONFIG.threshold;

  for (let i = 0; i < frameCount; i++) {
    video.currentTime = i / fps;
    await new Promise((resolve) => {
      video.onseeked = resolve;
    });

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    for (
      let pixelIndex = 0;
      pixelIndex < canvas.width * canvas.height;
      pixelIndex++
    ) {
      const dataIndex = pixelIndex * 4;

      const rDiff = Math.abs(
        currentData.data[dataIndex] - baselineData.data[dataIndex]
      );
      const gDiff = Math.abs(
        currentData.data[dataIndex + 1] - baselineData.data[dataIndex + 1]
      );
      const bDiff = Math.abs(
        currentData.data[dataIndex + 2] - baselineData.data[dataIndex + 2]
      );

      const totalDiff = (rDiff + gDiff + bDiff) / 3;

      // If pixel differs from baseline (face-up card), update with latest value
      // If pixel is similar to baseline (face-down card), keep previous result value
      if (totalDiff > threshold) {
        result.data[dataIndex] = currentData.data[dataIndex];
        result.data[dataIndex + 1] = currentData.data[dataIndex + 1];
        result.data[dataIndex + 2] = currentData.data[dataIndex + 2];
        result.data[dataIndex + 3] = 255;
        lastChangeFrame[pixelIndex] = i;
      }
    }

    if (
      i % PROCESSING_CONFIG.progressUpdateInterval === 0 ||
      i === frameCount - 1
    ) {
      onProgress?.(i + 1, frameCount);
    }
  }

  ctx.putImageData(result, 0, 0);
  const dataUrl = canvas.toDataURL("image/png");
  URL.revokeObjectURL(video.src);

  return dataUrl;
};

/**
 * Maximum Difference - Select pixel value that differs MOST from baseline
 * Best for memory game: always picks face-up card (most different from face-down)
 * @param {Blob} blob - Video blob
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<string>} Data URL of result image
 */
export const processVideoMaxDifference = async (blob, onProgress) => {
  const video = document.createElement("video");
  video.src = URL.createObjectURL(blob);

  await new Promise((resolve) => {
    video.onloadedmetadata = () => {
      video.currentTime = 0;
      resolve();
    };
  });

  await new Promise((resolve) => {
    video.onseeked = resolve;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Apply scaling
  canvas.width = Math.floor(video.videoWidth * PROCESSING_CONFIG.scaleDown);
  canvas.height = Math.floor(video.videoHeight * PROCESSING_CONFIG.scaleDown);

  const fps = PROCESSING_CONFIG.fps;
  const frameCount = Math.floor(video.duration * fps);

  // Get baseline from LAST frame (all cards face down)
  video.currentTime = video.duration - 0.1;
  await new Promise((resolve) => {
    video.onseeked = resolve;
  });
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const baselineData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Result stores pixel with maximum difference
  const result = ctx.createImageData(canvas.width, canvas.height);
  // Start with baseline
  for (let i = 0; i < baselineData.data.length; i++) {
    result.data[i] = baselineData.data[i];
  }

  // Track maximum difference for each pixel
  const maxDifference = new Float32Array(canvas.width * canvas.height);
  maxDifference.fill(0);
  const threshold = PROCESSING_CONFIG.threshold;

  for (let i = 0; i < frameCount; i++) {
    video.currentTime = i / fps;
    await new Promise((resolve) => {
      video.onseeked = resolve;
    });

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    for (
      let pixelIndex = 0;
      pixelIndex < canvas.width * canvas.height;
      pixelIndex++
    ) {
      const dataIndex = pixelIndex * 4;

      const rDiff = Math.abs(
        currentData.data[dataIndex] - baselineData.data[dataIndex]
      );
      const gDiff = Math.abs(
        currentData.data[dataIndex + 1] - baselineData.data[dataIndex + 1]
      );
      const bDiff = Math.abs(
        currentData.data[dataIndex + 2] - baselineData.data[dataIndex + 2]
      );

      const totalDiff = (rDiff + gDiff + bDiff) / 3;

      // Keep pixel value with MAXIMUM difference from baseline
      if (totalDiff > threshold && totalDiff > maxDifference[pixelIndex]) {
        maxDifference[pixelIndex] = totalDiff;
        result.data[dataIndex] = currentData.data[dataIndex];
        result.data[dataIndex + 1] = currentData.data[dataIndex + 1];
        result.data[dataIndex + 2] = currentData.data[dataIndex + 2];
        result.data[dataIndex + 3] = 255;
      }
    }

    if (
      i % PROCESSING_CONFIG.progressUpdateInterval === 0 ||
      i === frameCount - 1
    ) {
      onProgress?.(i + 1, frameCount);
    }
  }

  ctx.putImageData(result, 0, 0);
  const dataUrl = canvas.toDataURL("image/png");
  URL.revokeObjectURL(video.src);

  return dataUrl;
};

/**
 * Median Value - Use median of changed pixels (robust to noise)
 * Stores all changed values and picks the middle one
 * @param {Blob} blob - Video blob
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<string>} Data URL of result image
 */
export const processVideoMedian = async (blob, onProgress) => {
  const video = document.createElement("video");
  video.src = URL.createObjectURL(blob);

  await new Promise((resolve) => {
    video.onloadedmetadata = () => {
      video.currentTime = 0;
      resolve();
    };
  });

  await new Promise((resolve) => {
    video.onseeked = resolve;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Apply scaling
  canvas.width = Math.floor(video.videoWidth * PROCESSING_CONFIG.scaleDown);
  canvas.height = Math.floor(video.videoHeight * PROCESSING_CONFIG.scaleDown);

  const fps = PROCESSING_CONFIG.fps;
  const frameCount = Math.floor(video.duration * fps);

  // Get baseline from LAST frame
  video.currentTime = video.duration - 0.1;
  await new Promise((resolve) => {
    video.onseeked = resolve;
  });
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const baselineData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Store all changed values for each pixel (R, G, B separately)
  const pixelCount = canvas.width * canvas.height;
  const pixelValues = Array.from({ length: pixelCount }, () => ({
    r: [],
    g: [],
    b: [],
  }));

  const threshold = PROCESSING_CONFIG.threshold;

  for (let i = 0; i < frameCount; i++) {
    video.currentTime = i / fps;
    await new Promise((resolve) => {
      video.onseeked = resolve;
    });

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex++) {
      const dataIndex = pixelIndex * 4;

      const rDiff = Math.abs(
        currentData.data[dataIndex] - baselineData.data[dataIndex]
      );
      const gDiff = Math.abs(
        currentData.data[dataIndex + 1] - baselineData.data[dataIndex + 1]
      );
      const bDiff = Math.abs(
        currentData.data[dataIndex + 2] - baselineData.data[dataIndex + 2]
      );

      const totalDiff = (rDiff + gDiff + bDiff) / 3;

      // Store all changed values
      if (totalDiff > threshold) {
        pixelValues[pixelIndex].r.push(currentData.data[dataIndex]);
        pixelValues[pixelIndex].g.push(currentData.data[dataIndex + 1]);
        pixelValues[pixelIndex].b.push(currentData.data[dataIndex + 2]);
      }
    }

    if (
      i % PROCESSING_CONFIG.progressUpdateInterval === 0 ||
      i === frameCount - 1
    ) {
      onProgress?.(i + 1, frameCount);
    }
  }

  // Calculate median for each pixel
  const result = ctx.createImageData(canvas.width, canvas.height);
  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex++) {
    const dataIndex = pixelIndex * 4;

    if (pixelValues[pixelIndex].r.length > 0) {
      // Sort and find median
      pixelValues[pixelIndex].r.sort((a, b) => a - b);
      pixelValues[pixelIndex].g.sort((a, b) => a - b);
      pixelValues[pixelIndex].b.sort((a, b) => a - b);

      const mid = Math.floor(pixelValues[pixelIndex].r.length / 2);

      result.data[dataIndex] = pixelValues[pixelIndex].r[mid];
      result.data[dataIndex + 1] = pixelValues[pixelIndex].g[mid];
      result.data[dataIndex + 2] = pixelValues[pixelIndex].b[mid];
      result.data[dataIndex + 3] = 255;
    } else {
      // No change detected, use baseline
      result.data[dataIndex] = baselineData.data[dataIndex];
      result.data[dataIndex + 1] = baselineData.data[dataIndex + 1];
      result.data[dataIndex + 2] = baselineData.data[dataIndex + 2];
      result.data[dataIndex + 3] = 255;
    }
  }

  ctx.putImageData(result, 0, 0);
  const dataUrl = canvas.toDataURL("image/png");
  URL.revokeObjectURL(video.src);

  return dataUrl;
};

/**
 * Maximum Brightness - Select brightest pixel value
 * Assumes face-up cards are brighter than face-down cards
 * @param {Blob} blob - Video blob
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<string>} Data URL of result image
 */
export const processVideoMaxBrightness = async (blob, onProgress) => {
  const video = document.createElement("video");
  video.src = URL.createObjectURL(blob);

  await new Promise((resolve) => {
    video.onloadedmetadata = () => {
      video.currentTime = 0;
      resolve();
    };
  });

  await new Promise((resolve) => {
    video.onseeked = resolve;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Apply scaling
  canvas.width = Math.floor(video.videoWidth * PROCESSING_CONFIG.scaleDown);
  canvas.height = Math.floor(video.videoHeight * PROCESSING_CONFIG.scaleDown);

  const fps = PROCESSING_CONFIG.fps;
  const frameCount = Math.floor(video.duration * fps);

  // Get baseline from LAST frame
  video.currentTime = video.duration - 0.1;
  await new Promise((resolve) => {
    video.onseeked = resolve;
  });
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const baselineData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Result stores brightest pixel
  const result = ctx.createImageData(canvas.width, canvas.height);
  // Start with baseline
  for (let i = 0; i < baselineData.data.length; i++) {
    result.data[i] = baselineData.data[i];
  }

  // Track maximum brightness for each pixel
  const maxBrightness = new Float32Array(canvas.width * canvas.height);
  for (
    let pixelIndex = 0;
    pixelIndex < canvas.width * canvas.height;
    pixelIndex++
  ) {
    const dataIndex = pixelIndex * 4;
    const baseBrightness =
      (baselineData.data[dataIndex] +
        baselineData.data[dataIndex + 1] +
        baselineData.data[dataIndex + 2]) /
      3;
    maxBrightness[pixelIndex] = baseBrightness;
  }

  const threshold = PROCESSING_CONFIG.threshold;

  for (let i = 0; i < frameCount; i++) {
    video.currentTime = i / fps;
    await new Promise((resolve) => {
      video.onseeked = resolve;
    });

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    for (
      let pixelIndex = 0;
      pixelIndex < canvas.width * canvas.height;
      pixelIndex++
    ) {
      const dataIndex = pixelIndex * 4;

      const rDiff = Math.abs(
        currentData.data[dataIndex] - baselineData.data[dataIndex]
      );
      const gDiff = Math.abs(
        currentData.data[dataIndex + 1] - baselineData.data[dataIndex + 1]
      );
      const bDiff = Math.abs(
        currentData.data[dataIndex + 2] - baselineData.data[dataIndex + 2]
      );

      const totalDiff = (rDiff + gDiff + bDiff) / 3;

      if (totalDiff > threshold) {
        const brightness =
          (currentData.data[dataIndex] +
            currentData.data[dataIndex + 1] +
            currentData.data[dataIndex + 2]) /
          3;

        // Keep pixel with MAXIMUM brightness
        if (brightness > maxBrightness[pixelIndex]) {
          maxBrightness[pixelIndex] = brightness;
          result.data[dataIndex] = currentData.data[dataIndex];
          result.data[dataIndex + 1] = currentData.data[dataIndex + 1];
          result.data[dataIndex + 2] = currentData.data[dataIndex + 2];
          result.data[dataIndex + 3] = 255;
        }
      }
    }

    if (
      i % PROCESSING_CONFIG.progressUpdateInterval === 0 ||
      i === frameCount - 1
    ) {
      onProgress?.(i + 1, frameCount);
    }
  }

  ctx.putImageData(result, 0, 0);
  const dataUrl = canvas.toDataURL("image/png");
  URL.revokeObjectURL(video.src);

  return dataUrl;
};
