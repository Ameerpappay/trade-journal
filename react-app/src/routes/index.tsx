import React from "react";
import { RouteObject } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import AuthPage from "../components/AuthPage";
import AddTrade from "../components/AddTrade";
import ViewTrades from "../components/ViewTrades";
import Holdings from "../components/Holdings";
import PortfolioManagement from "../components/PortfolioManagement";
import JobManagement from "../components/JobManagement";
import StockScrapingManagement from "../components/StockScrapingManagement";
import ChartViewer from "../components/ChartViewer";
import ManageTags from "../components/ManageTags";
import ManageStrategies from "../components/ManageStrategies";
import SymbolManagement from "../components/SymbolManagement";
import StockManagement from "../components/StockManagement";
import ScreenerManagement from "../components/ScreenerManagement";
import UserProfile from "../components/UserProfile";
import UploadImages from "../components/UploadImages";
import ProtectedRoute from "../components/ProtectedRoute";

// Dashboard component placeholder - create one or use existing
const Dashboard: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <h2>Dashboard</h2>
      <p>Welcome to your trading dashboard!</p>
    </div>
  );
};

export const routes: RouteObject[] = [
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "add-trade",
        element: <AddTrade />,
      },
      {
        path: "trades",
        element: <ViewTrades />,
      },
      {
        path: "holdings",
        element: <Holdings />,
      },
      {
        path: "portfolios",
        element: <PortfolioManagement />,
      },
      {
        path: "job-management",
        element: <JobManagement />,
      },
      {
        path: "stock-scraping",
        element: <StockScrapingManagement />,
      },
      {
        path: "chart-viewer",
        element: <ChartViewer />,
      },
      {
        path: "tags",
        element: <ManageTags />,
      },
      {
        path: "strategies",
        element: <ManageStrategies />,
      },
      {
        path: "symbols",
        element: <SymbolManagement />,
      },
      {
        path: "stocks",
        element: <StockManagement />,
      },
      {
        path: "screeners",
        element: <ScreenerManagement />,
      },
      {
        path: "upload-images",
        element: <UploadImages />,
      },
      {
        path: "profile",
        element: <UserProfile />,
      },
    ],
  },
];

export default routes;
