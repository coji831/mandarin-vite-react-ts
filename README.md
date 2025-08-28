# PinyinPal: A Modern Mandarin Learning App 🇨🇳

**Repository:** `mandarin-vite-react-ts`

PinyinPal is an interactive web application designed to help new learners master the fundamentals of Mandarin Chinese, with a specific focus on pinyin, tones, and character recognition. This project is built using modern web technologies to create a fast, responsive, and engaging learning experience.

## ✨ Key Features

- **Interactive Flashcards:** Practice associating pinyin with characters and English definitions.
- **Tonal Practice Drills:** Strengthen your understanding of the four Mandarin tones through targeted exercises.
- **Spaced Repetition Algorithm:** Optimize your learning with an intelligent system that reviews challenging words more frequently.
- **Progress Tracking:** Monitor your learning journey and celebrate your milestones.

## 🛠️ Tech Stack

- **Frontend:** **React** with **TypeScript**
- **Build Tool:** **Vite**
- **State Management:** (Your choice here, e.g., Zustand, Redux, or React Context)
- **Styling:** (Your choice here, e.g., Tailwind CSS, Styled-components, or pure CSS)

## 🚀 Installation & Getting Started

Follow these steps to get a local copy of the project running on your machine.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/coji831/mandarin-vite-react-ts.git
   ```
2. **Navigate to the project directory:**
   ```bash
   cd mandarin-vite-react-ts
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Run the development server:**
   ```bash
   npm run dev
   ```
   The app will now be running on `http://localhost:5173`.

## 🗺️ Future Vision & Roadmap

This project is more than just a Mandarin learning tool; it's designed with scalability and future growth in mind.

- **Polyglot Expansion:** The core architecture is being built to easily support the addition of other languages, allowing PinyinPal to become a multi-language learning platform.
- **Micro-Frontend Conversion:** We plan to explore converting the application into a micro-frontend architecture. This would allow different features (e.g., flashcards, tone drills) to be developed and deployed independently, making the project more robust and maintainable for a larger community.

## 📁 Project Structure

- [`src/features/mandarin/`](src/features/mandarin/): Main Mandarin learning feature
- [`public/data/`](public/data/): Static vocabulary and example data
- [`api/`](api/): Serverless functions for TTS
- [`local-backend/`](local-backend/): Local development server
- [`docs/`](docs/): Project documentation

## 📚 Documentation

- [System Overview](docs/architecture.md)
- [Coding Standards](docs/conventions.md)
- [Design Decisions](docs/issues/)
- [Development & Documentation Workflow](docs/workflow.md)
- [Business Requirements (Epics, Stories, PRs)](docs/business-requirements/README.md)
- [Technical Implementation Details](docs/issue-implementation/README.md)
- Feature Design
  - [Mandarin](src/features/mandarin/docs/design.md)

## 🤝 Contributing

We welcome contributions of all kinds! If you want to help, please check out our **`CONTRIBUTING.md`** file for details on our code of conduct and the process for submitting pull requests.

## 🚀 Deployment

Deploy your own Vite project with Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vercel/vercel/tree/main/examples/vite-react&template=vite-react)

_Live Example: https://vite-react-example.vercel.app_

### Deploying From Your Terminal

You can deploy your new Vite project with a single command from your terminal using [Vercel CLI](https://vercel.com/download):

```shell
$ vercel
```

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
