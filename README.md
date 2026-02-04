# 🇨🇳 HSKhub

> A modern, interactive, and open-source platform for mastering Chinese HSK vocabulary and reading.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Contributors](https://img.shields.io/badge/contributions-welcome-orange.svg)

**HSKhub** is a lightweight, vanilla JavaScript application designed to help students learn Chinese effectively. Unlike static PDF lists or clunky apps, HSKhub provides a responsive, themed, and interactive environment to study vocabulary and read standard course texts with integrated audio tools.

---

## ✨ Key Features

### 📚 Interactive Vocabulary Lists
- **Dynamic Rendering**: Loads JSON data instantly for different HSK levels.
- **Accordion Layout**: Organized by chapters for digestable study sessions.
- **Smart Navigation**: 
    - Floating "Back to Top" button for long lists.
    - "Return to Chapter Top" buttons at the end of every section.
- **Detailed entries**: Hanzi, Pinyin, English Meaning, Part of Speech, and Example Sentences.

### 📖 Immersive Reader Mode (HSK 4+)
- **Sentence-by-Sentence Study**: Texts are broken down into interactive cards.
- **Active Recall**: Toggle **Pinyin** or **English** visibility globally or click individual cards to reveal hidden info.
- **Text-to-Speech Audio**: 
    - 🔊 **Multi-Voice Simulation**: Automatically detects different speakers (e.g., Male/Female) and assigns distinct voices for a natural listening experience.
    - ⚡ **Real-time Highlighting**: Follow along as the current sentence lights up during playback.
- **Focus Mode**: Sticky controls ensure playback and visibility toggles are always within reach.

### 🎨 Custom Theming System
- **Color Palettes**: Choose from Red (Default), Blue, Green, Purple, or Monochrome.
- **Dark Mode**: Fully supported Light/Dark/System modes.
- **Persistence**: Your preferences are saved automatically using LocalStorage.

---

## 🛠️ Technology Stack

Built with simplicity and performance in mind. No complex build tools or frameworks required.

- **Core**: HTML5, CSS3, ES6+ Vanilla JavaScript.
- **Styling**: Native CSS Variables (Custom Properties) for theming.
- **Data**: JSON-based content storage.
- **TTS**: Web Speech API for browser-native audio generation.

---

## 🚀 Getting Started

To run HSKhub locally, you don't need `npm` or `node_modules`.

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/HSKhub.git
    cd HSKhub
    ```

2.  **Run the application**
    *   Open `index.html` directly in your browser.
    *   *Recommended*: Use the **Live Server** extension in VS Code for the best experience (to avoid CORS issues with fetching local JSON files).

---

## 📂 Project Structure

```plaintext
HSKhub/
├── data/                 # JSON Data sources
│   ├── hsk1.json         # Flat vocabulary lists
│   ├── hsk4.json         # Nested chapter/section data
│   └── hsk4book.json     # Full text reader data
├── index.html            # Landing page
├── level.html            # Vocabulary list viewer
├── book.html             # Reader interface
├── style.css             # Global styles & CSS variables
├── app.js                # Main logic (Vocab, Theme, Routing)
└── reader.js             # Reader-specific logic (Audio, Toggles)
```

---

## 🗺️ Roadmap & Future Goals

We have ambitious plans to make HSKhub the ultimate free resource for Chinese learners.

- [ ] **Search & Filter**: Global search bar to find words across all levels.
- [ ] **Quiz Mode**: Anki-style Spaced Repetition System (SRS) for reviewing words.
- [ ] **Stroke Order**: Canvas integration to show how to write characters.
- [ ] **Backend Integration**: Optional login to track learning progress.
- [ ] **HSK 5 & 6 Support**: Expanding the library to higher levels.
- [ ] **PWA Support**: Install HSKhub as a native-like app on mobile devices.

---

## 🤝 How to Contribute

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  **Fork the Project**
2.  **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3.  **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4.  **Push to the Branch** (`git push origin feature/AmazingFeature`)
5.  **Open a Pull Request**

### Content Contribution
Helping us digitize HSK texts or checking JSON files for typos is a massive help! Check the `data/` folder for the structure.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by the HSKhub Community
</p>
