import React, { useState, useRef, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Space, Alert, Divider, Row, Col, App } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, CheckCircleFilled } from '@ant-design/icons';
import { loginUserFromSheet } from '../utils/googleSheets';

const { Title, Text } = Typography;
const { message } = App;

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [initialEmail, setInitialEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const emailRef = useRef();

  useEffect(() => {
    const lastEmail = localStorage.getItem('lastEmail');
    if (lastEmail) setInitialEmail(lastEmail);
  }, []);

  useEffect(() => {
    if (emailRef.current) emailRef.current.focus();
  }, [emailRef]);

  const onFinish = async (values) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await loginUserFromSheet(values);
      if (user) {
        setSuccess(true);
        localStorage.setItem('lastEmail', values.email);
        
        // Kısa bir gecikme sonrası kullanıcıyı yönlendir
        setTimeout(() => {
          onLogin(user);
          message.success('Giriş başarılı!');
        }, 500);
      } else {
        setErrorMsg('E-posta veya şifre hatalı!');
      }
    } catch (error) {
      setErrorMsg('Giriş sırasında hata oluştu.');
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
      background: 'linear-gradient(135deg, #e6f7ff 0%, #e6e6ff 100%)',
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
                <Title level={3}>Giriş Başarılı!</Title>
                <Text>Ana sayfaya yönlendiriliyorsunuz...</Text>
              </div>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    background: '#1677ff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <LoginOutlined style={{ fontSize: 36, color: '#fff' }} />
                  </div>
                  <Title level={2} style={{ marginBottom: 8, color: '#1677ff' }}>Giriş Yap</Title>
                  <Text type="secondary" style={{ fontSize: '16px' }}>Hesabınıza erişmek için giriş yapın</Text>
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
                    label={<span style={{ fontSize: '16px' }}>E-posta</span>} 
                    name="email" 
                    initialValue={initialEmail} 
                    rules={[{ required: true, type: 'email', message: 'Geçerli bir e-posta girin!' }]}
                  >
                    <Input 
                      size="large" 
                      prefix={<UserOutlined style={{ color: '#1677ff' }} />} 
                      placeholder="E-posta adresiniz" 
                      ref={emailRef}
                      style={{ borderRadius: '8px', height: '50px' }}
                    />
                  </Form.Item>
                  
                  <Form.Item 
                    label={<span style={{ fontSize: '16px' }}>Şifre</span>} 
                    name="sifre" 
                    rules={[{ required: true, message: 'Lütfen şifrenizi girin!' }]}
                  >
                    <Input.Password 
                      size="large" 
                      prefix={<LockOutlined style={{ color: '#1677ff' }} />} 
                      placeholder="Şifreniz" 
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
                        fontSize: '16px'
                      }}
                    >
                      {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                    </Button>
                  </Form.Item>
                  
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <Text type="secondary">
                      Henüz bir hesabınız yok mu? Lütfen kayıt olun.
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

export default Login; 