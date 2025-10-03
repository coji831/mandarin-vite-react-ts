import { BrowserRouter } from "react-router-dom";
import "./App.css";
import MainRoutes from "./router/Router";
import { VocabularyProvider } from "./features/mandarin/context/VocabularyContext";
import { ProgressProvider } from "./features/mandarin/context/ProgressContext";

function App() {
  return (
    <VocabularyProvider>
      <ProgressProvider>
        <BrowserRouter>
          <MainRoutes />
        </BrowserRouter>
      </ProgressProvider>
    </VocabularyProvider>
  );
}

export default App;
