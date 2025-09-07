import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { ThemeProvider } from "@/components/theme-provider";
import AppRoutes from "./routes/AppRoutes";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
     <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AppRoutes />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);