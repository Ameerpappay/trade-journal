import React, { useState } from "react";
import { Card, Form, Input, Button, Typography, Divider } from "antd";
import {
  UserOutlined,
  LockOutlined,
  GoogleOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services";

const { Title, Text, Link } = Typography;

interface LoginProps {
  onSwitchToRegister: () => void;
}

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [form] = Form.useForm<LoginFormData>();

  const handleSubmit = async (values: LoginFormData) => {
    setLoading(true);
    try {
      const success = await login(values.email, values.password);
      if (!success) {
        form.setFields([
          {
            name: "email",
            errors: ["Invalid email or password"],
          },
          {
            name: "password",
            errors: ["Invalid email or password"],
          },
        ]);
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = authService.getGoogleLoginUrl();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Title level={2} style={{ color: "#1890ff", marginBottom: 8 }}>
            Trade Journal
          </Title>
          <Text type="secondary">Sign in to your account</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please enter your email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Please enter your password!" },
              { min: 6, message: "Password must be at least 6 characters!" },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              icon={<LoginOutlined />}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Divider>
          <Text type="secondary">or</Text>
        </Divider>

        <Button
          block
          icon={<GoogleOutlined />}
          onClick={handleGoogleLogin}
          style={{ marginBottom: 16 }}
        >
          Continue with Google
        </Button>

        <div style={{ textAlign: "center" }}>
          <Text type="secondary">
            Don't have an account?{" "}
            <Link onClick={onSwitchToRegister}>Sign up</Link>
          </Text>
        </div>

        <Divider />

        <div style={{ textAlign: "center" }}>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Demo credentials: admin@tradejournal.com / admin123
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;
