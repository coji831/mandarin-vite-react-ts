import { BrowserRouter } from "react-router-dom";
import "./App.css";
import MainRoutes from "./router/Router";
function App() {
  return (
    <BrowserRouter>
      <MainRoutes />
    </BrowserRouter>
  );
}

export default App;
