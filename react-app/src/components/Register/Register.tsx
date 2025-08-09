import React, { useState } from "react";
import { Card, Form, Input, Button, Typography, Divider } from "antd";
import {
  UserOutlined,
  LockOutlined,
  GoogleOutlined,
  UserAddOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services";

const { Title, Text, Link } = Typography;

interface RegisterProps {
  onSwitchToLogin: () => void;
}

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const [form] = Form.useForm<RegisterFormData>();

  const handleSubmit = async (values: RegisterFormData) => {
    setLoading(true);
    try {
      await register(values.email, values.password, values.name);
    } catch (error) {
      console.error("Registration error:", error);
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
          <Text type="secondary">Create your account</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="name"
            rules={[
              { required: true, message: "Please enter your name!" },
              { min: 2, message: "Name must be at least 2 characters!" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Full Name" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please enter your email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
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

          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match!"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm Password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              icon={<UserAddOutlined />}
            >
              Create Account
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
            Already have an account?{" "}
            <Link onClick={onSwitchToLogin}>Sign in</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Register;
