import React from "react";
import { Outlet } from "react-router-dom";
import {
  Layout,
  Menu,
  Dropdown,
  Button,
  Space,
  Typography,
  Avatar,
  Badge,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  WalletOutlined,
  FolderOutlined,
  SettingOutlined,
  LineChartOutlined,
  TagOutlined,
  FlagOutlined,
  CodeOutlined,
  TeamOutlined,
  PictureOutlined,
  TrophyOutlined,
  EyeOutlined,
  StockOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  SearchOutlined,
  ControlOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const { Header, Content } = Layout;
const { Text, Title } = Typography;

const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: "/add-trade",
      icon: <PlusOutlined />,
      label: "Add Trade",
    },
    {
      key: "/trades",
      icon: <EyeOutlined />,
      label: "Assets",
    },
    {
      key: "/holdings",
      icon: <StockOutlined />,
      label: "Holdings",
    },
    {
      key: "/portfolios",
      icon: <WalletOutlined />,
      label: "Portfolios",
    },
    {
      key: "/symbols",
      icon: <DatabaseOutlined />,
      label: "Symbols",
    },
    {
      key: "/stocks",
      icon: <BarChartOutlined />,
      label: "Stocks",
    },
    {
      key: "/screeners",
      icon: <SearchOutlined />,
      label: "Screeners",
    },
    {
      key: "/job-management",
      icon: <ControlOutlined />,
      label: "Jobs",
    },
    {
      key: "/stock-scraping",
      icon: <ControlOutlined />,
      label: "Stock Scraping",
    },
    {
      key: "/chart-viewer",
      icon: <LineChartOutlined />,
      label: "Chart Viewer",
    },
    {
      key: "/strategies",
      icon: <FlagOutlined />,
      label: "Strategies",
    },
    {
      key: "/tags",
      icon: <TagOutlined />,
      label: "Tags",
    },
  ];

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
      onClick: () => navigate("/profile"),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
    },
    {
      type: "divider" as const,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: logout,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          paddingInline: 24,
          boxShadow: "0 2px 8px #f0f1f2",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginRight: 32,
          }}
        >
          <TrophyOutlined style={{ fontSize: 28, color: "#1890ff" }} />
          <Title
            level={3}
            style={{
              color: "white",
              margin: 0,
              fontWeight: 600,
            }}
          >
            Trade Journal
          </Title>
        </div>

        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            flex: 1,
            minWidth: 0,
            backgroundColor: "transparent",
          }}
        />

        <Space>
          <Badge count="Beta" color="#52c41a" />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: "pointer", color: "white" }}>
              <Avatar size="small" src={user?.avatar} icon={<UserOutlined />} />
              <span>{user?.name}</span>
            </Space>
          </Dropdown>
        </Space>
      </Header>

      <Content
        style={{
          padding: location.pathname === "/chart-viewer" ? "8px" : "24px",
          backgroundColor: "#f5f5f5",
        }}
      >
        <div
          style={{
            maxWidth: location.pathname === "/chart-viewer" ? "100%" : 1200,
            margin: "0 auto",
            backgroundColor: "white",
            borderRadius: 12,
            minHeight: "calc(100vh - 112px)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
            overflow: "hidden",
          }}
        >
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
};

export default AppLayout;
