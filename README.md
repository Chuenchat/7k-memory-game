## About

A browser-based tool that reconstructs the solution of the 7k memory game
by analyzing a screen-recorded video of the gameplay.

The tool does not read game memory or interact with the game directly.
It works purely from video pixel data.

---

## Core Idea

During the game, cards are flipped face-up one by one.
Face-up cards are visually brighter than face-down cards.

This project reconstructs the final card layout by:

- Tracking pixel changes over time
- Selecting the **maximum brightness value per pixel**
- Only when the pixel differs significantly from a baseline frame

The result is a single image containing all revealed card faces.

---

## Processing Steps

1. Screen record the full game, ensuring all cards are revealed
2. Use the **last video frame as a baseline**
3. For each frame:
   - Compare pixels against the baseline
   - Ignore unchanged pixels
   - Keep the brightest value for each pixel across time
4. Combine all brightest pixels into a final solution image

---

## Demo

https://chuenchat.github.io/7k-memory-game/

---

## Commands

`yarn` to install dependencies

`yarn dev` to run the development server.

`yarn build` to build the project
