import { BrowserRouter } from "react-router-dom";
import "./App.css";
import MainRoutes from "./router/Router";
import { VocabularyProvider } from "./features/mandarin/context/VocabularyContext";
import { ProgressProvider } from "./features/mandarin/context/ProgressContext";
import { UserIdentityProvider } from "./features/mandarin/context/UserIdentityContext";

function App() {
  return (
    <UserIdentityProvider>
      <ProgressProvider>
        <VocabularyProvider>
          <BrowserRouter>
            <MainRoutes />
          </BrowserRouter>
        </VocabularyProvider>
      </ProgressProvider>
    </UserIdentityProvider>
  );
}

export default App;
