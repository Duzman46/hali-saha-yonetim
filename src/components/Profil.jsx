import React, { useState } from 'react';
import { Card, Descriptions, Avatar, Tabs, Form, Input, Button, Row, Col, Divider, Alert, Modal, Typography, Space, Spin, App } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, EditOutlined, SaveOutlined, CheckCircleOutlined, TeamOutlined, LoadingOutlined } from '@ant-design/icons';
import { updateUserPassword } from '../utils/googleSheets';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { message } = App;

const Profil = ({ user, onUpdateUser }) => {
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('1'); // Aktif sekme için state ekledim

  const handleChangePassword = async () => {
    // Form validasyonu
    if (!currentPassword) {
      message.error('Lütfen mevcut şifrenizi girin');
      return;
    }
    if (!newPassword) {
      message.error('Lütfen yeni şifrenizi girin');
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error('Yeni şifre ve onay şifresi eşleşmiyor');
      return;
    }
    if (newPassword.length < 6) {
      message.error('Yeni şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    
    try {
      // İşlem başladığında bilgilendirme mesajı göster
      const loadingMessage = message.loading('Şifreniz güncelleniyor, lütfen bekleyin...', 0);
      
      // Şifre değiştirme API'sini çağır
      const result = await updateUserPassword({
        email: user.email,
        currentPassword,
        newPassword
      });
      
      // Yükleme mesajını kapat
      loadingMessage();
      
      if (result.success) {
        // Form temizle
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Başarı modunu göster
        setSuccessVisible(true);
        
        // Eğer callback fonksiyonu varsa, kullanıcı bilgilerini güncelle
        if (typeof onUpdateUser === 'function') {
          // Şifre değiştiğinde, güncel kullanıcı bilgilerini parent bileşene bildir
          // Şifreyi burada göndermiyoruz çünkü UI'da gösterilmesi gerekmiyor
          onUpdateUser({ 
            isim: user.isim, 
            email: user.email,
            // sifre bilgisini göndermiyoruz
          });
        }
      } else {
        setErrorMessage(result.message || 'Şifre değiştirme işlemi başarısız oldu');
        message.error(result.message || 'Şifre değiştirme işlemi başarısız oldu');
      }
    } catch (error) {
      setErrorMessage('Şifre değiştirme sırasında bir hata oluştu: ' + error.message);
      message.error('Şifre değiştirme sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Tabs için items tanımı
  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <UserOutlined />
          Profil Bilgileri
        </span>
      ),
      children: (
        <div style={{ padding: '24px' }}>
          <Space direction="vertical" style={{ width: '100%', gap: '24px' }}>
            {/* Profil Detayları */}
            <div>
              <Title level={4} style={{ marginBottom: '16px' }}>
                <UserOutlined style={{ marginRight: '8px' }} />
                Kişisel Bilgiler
              </Title>
              
              <Card 
                style={{ borderRadius: '8px' }}
              >
                <Descriptions 
                  bordered 
                  column={1} 
                  styles={{ 
                    label: { fontWeight: 500, width: '30%' },
                    content: { width: '70%' }
                  }}
                >
                  <Descriptions.Item label="Ad Soyad">
                    {user.isim}
                  </Descriptions.Item>
                  <Descriptions.Item label="E-posta">
                    {user.email}
                  </Descriptions.Item>
                  <Descriptions.Item label="Üyelik Durumu">
                    <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>Aktif</Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </div>
            
            <div>
              <Alert
                message="Halı Saha Rezervasyon Sistemi"
                description="Halı saha rezervasyonlarınızı kolayca yönetebilir, saha durumunu takip edebilir ve ödeme işlemlerinizi güvenle gerçekleştirebilirsiniz."
                type="info"
                showIcon
                style={{ borderRadius: '8px' }}
              />
            </div>
          </Space>
        </div>
      )
    },
    {
      key: '2',
      label: (
        <span>
          <LockOutlined />
          Şifre Değiştir
        </span>
      ),
      children: (
        <div style={{ padding: '24px' }}>
          <Title level={4} style={{ marginBottom: '24px' }}>
            <LockOutlined style={{ marginRight: '8px' }} />
            Şifre Değiştirme
          </Title>
          
          {errorMessage && (
            <Alert
              message="Hata"
              description={errorMessage}
              type="error"
              showIcon
              closable
              onClose={() => setErrorMessage('')}
              style={{ marginBottom: '24px', borderRadius: '6px' }}
            />
          )}
          
          <Form layout="vertical">
            <Form.Item
              label="Mevcut Şifre"
              required
              tooltip="Güvenliğiniz için mevcut şifrenizi girmeniz gerekiyor"
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#1677ff' }} />}
                placeholder="Mevcut şifrenizi girin"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                size="large"
                style={{ borderRadius: '6px' }}
                disabled={loading}
              />
            </Form.Item>
            
            <Form.Item
              label="Yeni Şifre"
              required
              tooltip="Şifreniz en az 6 karakter olmalıdır"
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#1677ff' }} />}
                placeholder="Yeni şifrenizi girin"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                size="large"
                style={{ borderRadius: '6px' }}
                disabled={loading}
              />
            </Form.Item>
            
            <Form.Item
              label="Yeni Şifre Tekrar"
              required
              tooltip="Yeni şifrenizi tekrar girin"
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#1677ff' }} />}
                placeholder="Yeni şifrenizi tekrar girin"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                size="large"
                style={{ borderRadius: '6px' }}
                disabled={loading}
              />
            </Form.Item>
            
            <Alert
              message="Güvenlik Notu"
              description="Hesabınızın güvenliği için güçlü bir şifre seçin. En iyi şifreler büyük ve küçük harfler, rakamlar ve özel karakterler içerir."
              type="info"
              showIcon
              style={{ marginBottom: '24px', borderRadius: '6px' }}
            />
            
            <Form.Item>
              <Button
                type="primary"
                icon={loading ? <LoadingOutlined /> : <SaveOutlined />}
                size="large"
                block
                loading={loading}
                onClick={handleChangePassword}
                style={{ height: '46px', borderRadius: '6px' }}
                disabled={loading}
              >
                {loading ? 'Şifre Güncelleniyor...' : 'Şifreyi Güncelle'}
              </Button>
            </Form.Item>
          </Form>
        </div>
      )
    }
  ];

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      <Row gutter={24}>
        {/* Sol Panel - Kullanıcı Profili */}
        <Col xs={24} md={8} style={{ marginBottom: '24px' }}>
          <Card
            style={{ borderRadius: '12px', overflow: 'hidden', height: '100%' }}
            styles={{ body: { padding: '24px' } }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar 
                size={100} 
                icon={<UserOutlined />} 
                style={{ 
                  backgroundColor: '#1677ff', 
                  marginBottom: '16px',
                  fontSize: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }} 
              />
              
              <Title level={3} style={{ margin: '8px 0', textAlign: 'center' }}>
                {user.isim}
              </Title>
              
              <Space style={{ marginBottom: '16px' }}>
                <MailOutlined style={{ color: '#1677ff' }} />
                <Text>{user.email}</Text>
              </Space>
              
              <Divider style={{ margin: '16px 0' }} />
              
              <div style={{ textAlign: 'center', width: '100%' }}>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  <TeamOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                  Aktif Üye
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        
        {/* Sağ Panel - Profil ve Şifre Değiştirme Sekmesi */}
        <Col xs={24} md={16}>
          <Card
            style={{ borderRadius: '12px', overflow: 'hidden' }}
            styles={{ body: { padding: '0' } }}
          >
            <Tabs 
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              tabBarStyle={{ 
                background: '#f9f9f9', 
                padding: '16px 24px 0',
                marginBottom: 0,
                borderBottom: '1px solid #f0f0f0'
              }}
            />
          </Card>
        </Col>
      </Row>
      
      {/* Başarılı Modal */}
      <Modal
        open={successVisible}
        footer={null}
        onCancel={() => setSuccessVisible(false)}
        width={400}
        centered
        styles={{ body: { padding: '32px 24px 24px' } }}
      >
        <div style={{ textAlign: 'center' }}>
          <CheckCircleOutlined 
            style={{ 
              fontSize: 64, 
              color: '#52c41a',
              margin: '0 0 16px'
            }} 
          />
          <Title level={4} style={{ margin: '0 0 16px' }}>
            Şifreniz Başarıyla Güncellendi!
          </Title>
          <Paragraph style={{ fontSize: '16px', color: '#666' }}>
            Artık yeni şifrenizle oturum açabilirsiniz.
          </Paragraph>
          <Button 
            type="primary" 
            onClick={() => setSuccessVisible(false)}
            style={{ marginTop: '24px', borderRadius: '6px' }}
            size="large"
          >
            Tamam
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Profil;