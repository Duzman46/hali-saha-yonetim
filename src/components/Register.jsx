import React, { useState, useRef, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Space, Divider, Row, Col, Alert, App } from 'antd';
import { UserAddOutlined, UserOutlined, LockOutlined, MailOutlined, CheckCircleFilled } from '@ant-design/icons';
import { addUserToSheet } from '../utils/googleSheets';

const { Title, Text } = Typography;
const { message } = App;

const Register = ({ onRegister }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const isimRef = useRef();

  useEffect(() => {
    if (isimRef.current) isimRef.current.focus();
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await addUserToSheet(values);
      setSuccess(true);
      localStorage.setItem('lastEmail', values.email);
      
      // Kısa bir gecikme sonrası kullanıcıyı yönlendir
      setTimeout(() => {
        onRegister({ email: values.email, isim: values.isim });
        message.success('Kayıt başarılı!');
      }, 500);
    } catch (error) {
      setErrorMsg('Kayıt sırasında hata oluştu. Bu e-posta adresi zaten kullanılıyor olabilir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '80vh', 
      background: 'linear-gradient(135deg, #f6ffed 0%, #e6ffe6 100%)',
      padding: '24px' 
    }}>
      <Row gutter={0} style={{ maxWidth: '1000px', width: '100%', height: '650px' }}>
        <Col xs={0} sm={0} md={12} style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0',
          background: 'url(https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=1000)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '16px 0 0 16px',
          position: 'relative',
          overflow: 'hidden',
          height: '650px'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1
          }} />
          <div style={{ 
            padding: '40px', 
            textAlign: 'center',
            position: 'relative',
            zIndex: 2,
            color: 'white',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            paddingTop: '80px'
          }}>
            <Title level={1} style={{ color: 'white', marginBottom: '24px', fontSize: '32px' }}>
              Halı Saha Rezervasyon Sistemi
            </Title>
            <Divider style={{ backgroundColor: 'rgba(255,255,255,0.2)', margin: '24px 0' }} />
            <div style={{ fontSize: '18px', textAlign: 'left' }}>
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                <CheckCircleFilled style={{ color: '#52c41a', marginRight: '16px', fontSize: '20px' }} />
                Kolay rezervasyon yapma
              </div>
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                <CheckCircleFilled style={{ color: '#52c41a', marginRight: '16px', fontSize: '20px' }} />
                Farklı sahalar arasında filtreleme
              </div>
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                <CheckCircleFilled style={{ color: '#52c41a', marginRight: '16px', fontSize: '20px' }} />
                Ödemelerinizi güvenle yapın
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleFilled style={{ color: '#52c41a', marginRight: '16px', fontSize: '20px' }} />
                Rezervasyon geçmişinizi takip edin
              </div>
            </div>
          </div>
        </Col>
        
        <Col xs={24} sm={24} md={12} style={{ height: '650px' }}>
          <Card 
            style={{ 
              width: '100%', 
              borderRadius: '0 16px 16px 16px', 
              boxShadow: '0 4px 24px rgba(0,0,0,0.10)', 
              background: '#fff',
              border: 'none',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
            styles={{ body: { padding: '40px' } }}
          >
            {success ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <CheckCircleFilled style={{ fontSize: 60, color: '#52c41a', marginBottom: 24 }} />
                <Title level={3}>Kayıt Başarılı!</Title>
                <Text>Ana sayfaya yönlendiriliyorsunuz...</Text>
              </div>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    background: '#52c41a', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <UserAddOutlined style={{ fontSize: 36, color: '#fff' }} />
                  </div>
                  <Title level={2} style={{ marginBottom: 8, color: '#52c41a' }}>Kayıt Ol</Title>
                  <Text type="secondary" style={{ fontSize: '16px' }}>Yeni bir hesap oluşturun</Text>
                </div>
                
                {errorMsg && (
                  <Alert 
                    message={errorMsg} 
                    type="error" 
                    showIcon 
                    style={{ borderRadius: '8px' }} 
                  />
                )}
                
                <Form 
                  layout="vertical" 
                  onFinish={onFinish} 
                  autoComplete="off"
                  requiredMark={false}
                  size="large"
                >
                  <Form.Item 
                    label={<span style={{ fontSize: '16px' }}>Ad Soyad</span>} 
                    name="isim" 
                    rules={[{ required: true, message: 'Lütfen adınızı ve soyadınızı girin!' }]}
                  >
                    <Input 
                      size="large" 
                      prefix={<UserOutlined style={{ color: '#52c41a' }} />} 
                      placeholder="Ad Soyad" 
                      ref={isimRef}
                      style={{ borderRadius: '8px', height: '50px' }}
                    />
                  </Form.Item>
                  
                  <Form.Item 
                    label={<span style={{ fontSize: '16px' }}>E-posta</span>} 
                    name="email" 
                    rules={[
                      { required: true, message: 'Lütfen e-posta adresinizi girin!' },
                      { type: 'email', message: 'Geçerli bir e-posta adresi girin!' }
                    ]}
                  >
                    <Input 
                      size="large" 
                      prefix={<MailOutlined style={{ color: '#52c41a' }} />} 
                      placeholder="E-posta adresiniz" 
                      style={{ borderRadius: '8px', height: '50px' }}
                    />
                  </Form.Item>
                  
                  <Form.Item 
                    label={<span style={{ fontSize: '16px' }}>Şifre</span>} 
                    name="sifre" 
                    rules={[
                      { required: true, message: 'Lütfen şifrenizi girin!' },
                      { min: 6, message: 'Şifreniz en az 6 karakter olmalıdır!' }
                    ]}
                  >
                    <Input.Password 
                      size="large" 
                      prefix={<LockOutlined style={{ color: '#52c41a' }} />} 
                      placeholder="Şifreniz (en az 6 karakter)" 
                      style={{ borderRadius: '8px', height: '50px' }}
                    />
                  </Form.Item>
                  
                  <Form.Item style={{ marginTop: '32px', marginBottom: '8px' }}>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={loading} 
                      block 
                      size="large" 
                      style={{ 
                        borderRadius: '8px', 
                        fontWeight: '600',
                        height: '50px',
                        fontSize: '16px',
                        backgroundColor: '#52c41a',
                        borderColor: '#52c41a'
                      }}
                    >
                      {loading ? 'Kaydınız Oluşturuluyor...' : 'Hesap Oluştur'}
                    </Button>
                  </Form.Item>
                  
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <Text type="secondary">
                      Zaten bir hesabınız var mı? Giriş yapın.
                    </Text>
                  </div>
                </Form>
              </Space>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Register; 