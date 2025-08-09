import React, { useState } from "react";
import {
  Card,
  Upload,
  Button,
  message,
  Space,
  Typography,
  Divider,
  List,
  Image,
  Tag,
  Modal,
} from "antd";
import {
  UploadOutlined,
  PictureOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface UploadedImage {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadDate: Date;
}

const UploadImages: React.FC = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const uploadProps: UploadProps = {
    name: "images",
    multiple: true,
    accept: "image/*",
    action: "/api/upload/images",
    headers: {
      authorization: `Bearer ${localStorage.getItem("auth_token")}`,
    },
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("You can only upload image files!");
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error("Image must be smaller than 10MB!");
        return false;
      }
      return true;
    },
    onChange(info) {
      const { status } = info.file;
      if (status === "done") {
        message.success(`${info.file.name} uploaded successfully.`);
        // Add to images list (you would typically fetch from server)
        const newImage: UploadedImage = {
          id: Date.now().toString(),
          name: info.file.name,
          url: info.file.response?.url || "",
          size: info.file.size || 0,
          uploadDate: new Date(),
        };
        setImages((prev) => [newImage, ...prev]);
      } else if (status === "error") {
        message.error(`${info.file.name} upload failed.`);
      }
    },
  };

  const handlePreview = (url: string) => {
    setPreviewImage(url);
    setPreviewVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Delete Image",
      content: "Are you sure you want to delete this image?",
      onOk: () => {
        setImages((prev) => prev.filter((img) => img.id !== id));
        message.success("Image deleted successfully");
      },
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title
          level={2}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <PictureOutlined />
          Upload Images
        </Title>
        <Text type="secondary">
          Upload and manage images for your trades and analysis
        </Text>

        <Divider />

        {/* Upload Area */}
        <Card size="small" style={{ marginBottom: 24 }}>
          <Dragger {...uploadProps} style={{ padding: 20 }}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 48, color: "#1890ff" }} />
            </p>
            <p className="ant-upload-text" style={{ fontSize: 16 }}>
              Click or drag images to this area to upload
            </p>
            <p className="ant-upload-hint" style={{ color: "#666" }}>
              Support for single or bulk upload. Strictly prohibited from
              uploading company data or other banned files. Maximum file size:
              10MB per image.
            </p>
          </Dragger>
        </Card>

        {/* Images List */}
        <Card
          size="small"
          title={`Uploaded Images (${images.length})`}
          style={{ minHeight: 400 }}
        >
          {images.length > 0 ? (
            <List
              grid={{
                gutter: 16,
                xs: 1,
                sm: 2,
                md: 3,
                lg: 4,
                xl: 4,
                xxl: 6,
              }}
              dataSource={images}
              renderItem={(image) => (
                <List.Item>
                  <Card
                    hoverable
                    size="small"
                    cover={
                      <div style={{ height: 120, overflow: "hidden" }}>
                        <Image
                          alt={image.name}
                          src={image.url}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          preview={false}
                        />
                      </div>
                    }
                    actions={[
                      <Button
                        key="preview"
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handlePreview(image.url)}
                      />,
                      <Button
                        key="delete"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(image.id)}
                      />,
                    ]}
                  >
                    <Card.Meta
                      title={
                        <Text
                          ellipsis={{ tooltip: image.name }}
                          style={{ fontSize: 12 }}
                        >
                          {image.name}
                        </Text>
                      }
                      description={
                        <Space direction="vertical" size={2}>
                          <Tag color="blue" style={{ fontSize: 10 }}>
                            {formatFileSize(image.size)}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 10 }}>
                            {image.uploadDate.toLocaleDateString()}
                          </Text>
                        </Space>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#666",
              }}
            >
              <PictureOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <div>No images uploaded yet</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>
                Upload your first image using the area above
              </div>
            </div>
          )}
        </Card>

        {/* Preview Modal */}
        <Modal
          open={previewVisible}
          title="Image Preview"
          footer={null}
          onCancel={() => setPreviewVisible(false)}
          width="80%"
          style={{ top: 20 }}
        >
          <Image alt="preview" style={{ width: "100%" }} src={previewImage} />
        </Modal>
      </Card>
    </div>
  );
};

export default UploadImages;
