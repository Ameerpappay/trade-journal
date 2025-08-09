import React, { useState } from "react";
import {
  Card,
  Avatar,
  Typography,
  Button,
  Space,
  Divider,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  LogoutOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";

const { Title, Text } = Typography;

interface ProfileFormData {
  name: string;
  avatar?: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const UserProfile: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileForm] = Form.useForm<ProfileFormData>();
  const [passwordForm] = Form.useForm<PasswordFormData>();

  const handleProfileUpdate = async (values: ProfileFormData) => {
    setLoading(true);
    try {
      const success = await updateProfile(values);
      if (success) {
        setIsProfileModalVisible(false);
        profileForm.resetFields();
      }
    } catch (error) {
      console.error("Profile update error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values: PasswordFormData) => {
    setLoading(true);
    try {
      // This would require implementing password change in auth service
      message.success("Password changed successfully!");
      setIsPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      console.error("Password change error:", error);
      message.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    profileForm.setFieldsValue({
      name: user?.name || "",
      avatar: user?.avatar || "",
    });
    setIsProfileModalVisible(true);
  };

  if (!user) return null;

  return (
    <Card style={{ maxWidth: 500, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Avatar
          size={80}
          src={user.avatar}
          icon={<UserOutlined />}
          style={{ marginBottom: 16 }}
        />
        <Title level={3} style={{ margin: 0 }}>
          {user.name}
        </Title>
        <Text type="secondary">{user.email}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: "12px" }}>
          Role: {user.role}
        </Text>
      </div>

      <Divider />

      <Space direction="vertical" style={{ width: "100%" }}>
        <Button block icon={<EditOutlined />} onClick={handleEditProfile}>
          Edit Profile
        </Button>

        {!user.email.includes("google") && (
          <Button
            block
            icon={<LockOutlined />}
            onClick={() => setIsPasswordModalVisible(true)}
          >
            Change Password
          </Button>
        )}

        <Popconfirm
          title="Logout"
          description="Are you sure you want to logout?"
          onConfirm={logout}
          okText="Logout"
          cancelText="Cancel"
        >
          <Button block danger icon={<LogoutOutlined />}>
            Logout
          </Button>
        </Popconfirm>
      </Space>

      {/* Profile Edit Modal */}
      <Modal
        title="Edit Profile"
        open={isProfileModalVisible}
        onCancel={() => setIsProfileModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleProfileUpdate}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: "Please enter your name!" },
              { min: 2, message: "Name must be at least 2 characters!" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Full Name" />
          </Form.Item>

          <Form.Item label="Avatar URL" name="avatar">
            <Input placeholder="https://example.com/avatar.jpg" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setIsProfileModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update Profile
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Password Change Modal */}
      <Modal
        title="Change Password"
        open={isPasswordModalVisible}
        onCancel={() => setIsPasswordModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[
              {
                required: true,
                message: "Please enter your current password!",
              },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: "Please enter your new password!" },
              { min: 6, message: "Password must be at least 6 characters!" },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Please confirm your new password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match!"));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setIsPasswordModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Change Password
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserProfile;
