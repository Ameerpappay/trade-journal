import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import { AuthProvider } from "./contexts/AuthContext";
import routes from "./routes";
import "antd/dist/reset.css";

const router = createBrowserRouter(routes);

function App() {
  return (
    <AuthProvider>
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: "#1890ff",
            borderRadius: 8,
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          },
          components: {
            Layout: {
              headerBg: "#001529",
            },
            Menu: {
              darkItemBg: "#001529",
              darkItemSelectedBg: "#1890ff",
            },
          },
        }}
      >
        <RouterProvider router={router} />
      </ConfigProvider>
    </AuthProvider>
  );
}

export default App;
