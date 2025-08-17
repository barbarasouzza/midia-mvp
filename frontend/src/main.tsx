import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ToastProvider } from "./components/common/toast";
import "./components/common/toast.css";
import "./styles.css";

const RootWrap = import.meta.env.DEV ? React.Fragment : React.StrictMode;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RootWrap>
    <ToastProvider>
      <App />
    </ToastProvider>
  </RootWrap>
);
