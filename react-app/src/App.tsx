import React, { useState } from "react";
import { Layout, Menu, Typography, Badge, ConfigProvider, theme } from "antd";
import {
  PlusCircleOutlined,
  LineChartOutlined,
  TagsOutlined,
  TrophyOutlined,
  EyeOutlined,
  StockOutlined,
} from "@ant-design/icons";
import AddTrade from "./components/AddTrade";
import ManageStrategies from "./components/ManageStrategies";
import ManageTags from "./components/ManageTags";
import ViewTrades from "./components/ViewTrades";
import Holdings from "./components/Holdings";
import type { MenuProps } from "antd";
import "antd/dist/reset.css";

const { Header, Content } = Layout;
const { Title } = Typography;

type MenuItem = Required<MenuProps>["items"][number];

const items: MenuItem[] = [
  {
    key: "addTrade",
    icon: <PlusCircleOutlined />,
    label: "Add Trade",
  },
  {
    key: "viewTrades",
    icon: <EyeOutlined />,
    label: "View Trades",
  },
  {
    key: "holdings",
    icon: <StockOutlined />,
    label: "Holdings",
  },
  {
    key: "strategies",
    icon: <LineChartOutlined />,
    label: "Manage Strategies",
  },
  {
    key: "tags",
    icon: <TagsOutlined />,
    label: "Manage Tags",
  },
];

function App() {
  const [selectedKey, setSelectedKey] = useState("addTrade");

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    setSelectedKey(e.key);
  };

  const renderContent = () => {
    switch (selectedKey) {
      case "addTrade":
        return <AddTrade />;
      case "viewTrades":
        return <ViewTrades />;
      case "holdings":
        return <Holdings />;
      case "strategies":
        return <ManageStrategies />;
      case "tags":
        return <ManageTags />;
      default:
        return <AddTrade />;
    }
  };

  return (
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
            selectedKeys={[selectedKey]}
            items={items}
            onClick={handleMenuClick}
            style={{
              flex: 1,
              minWidth: 0,
              backgroundColor: "transparent",
            }}
          />

          <Badge count="Beta" color="#52c41a" />
        </Header>

        <Content style={{ padding: "24px", backgroundColor: "#f5f5f5" }}>
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              backgroundColor: "white",
              borderRadius: 12,
              minHeight: "calc(100vh - 112px)",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
              overflow: "hidden",
            }}
          >
            {renderContent()}
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
