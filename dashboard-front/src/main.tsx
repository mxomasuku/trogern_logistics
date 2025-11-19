import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { ThemeProvider } from "@/components/theme-provider";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./state/AuthContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
  <AuthProvider>
      <BrowserRouter>
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  enableColorScheme

>
      <App/>
        </ThemeProvider>
      </BrowserRouter>
      </AuthProvider>
    </Provider>
  </React.StrictMode>
);