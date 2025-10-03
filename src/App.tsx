import { BrowserRouter } from "react-router-dom";
import "./App.css";
import MainRoutes from "./router/Router";
import { VocabularyProvider } from "./features/mandarin/context/VocabularyContext";
import { ProgressProvider } from "./features/mandarin/context/ProgressContext";
import { UserIdentityProvider } from "./features/mandarin/context/UserIdentityContext";

function App() {
  return (
    <UserIdentityProvider>
      <VocabularyProvider>
        <ProgressProvider>
          <BrowserRouter>
            <MainRoutes />
          </BrowserRouter>
        </ProgressProvider>
      </VocabularyProvider>
    </UserIdentityProvider>
  );
}

export default App;
