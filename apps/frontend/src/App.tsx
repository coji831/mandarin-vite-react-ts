import { BrowserRouter } from "react-router-dom";
import MainRoutes from "./router/Router";
import { AuthProvider } from "./features/auth";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
