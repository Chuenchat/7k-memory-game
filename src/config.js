// Configuration for video processing optimization
export const PROCESSING_CONFIG = {
  // Frame processing
  fps: 10, // Process only 10 frames per second (skip frames)

  // Image scaling
  scaleDown: 0.5, // Scale down to 50% (0.5 = half size, 1.0 = original size)

  // Pixel change detection
  threshold: 30, // Pixel difference threshold (0-255)

  // Progress update frequency
  progressUpdateInterval: 5, // Update progress every N frames
};

// UI Configuration
export const UI_CONFIG = {
  // Feature flags
  showUploadButton: false, // Show/hide upload video button
};
