import React, { useState } from 'react';
import { List, Input, Button, Card, Space, Typography, Divider, Empty, Form, Modal, Result, Row, Col, Select, App } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, CreditCardOutlined, UserOutlined, CalendarOutlined, LockOutlined, CheckCircleFilled } from '@ant-design/icons';
import { saveSatisToSheet, deleteRezervasyonFromSheet, forceDeleteRezervasyonlar } from '../utils/googleSheets';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { message } = App;

const Sepet = ({ cart, onRemove, onClear, user, setCurrent }) => {
  const [kart, setKart] = useState('');
  const [loading, setLoading] = useState(false);
  const [kartSahibi, setKartSahibi] = useState('');
  const [sonKullanma, setSonKullanma] = useState('');
  const [cvv, setCvv] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const odemeYap = async () => {
    try {
      if (!kart || kart.length < 16) {
        message.error('Lütfen geçerli bir kart numarası girin');
        return;
      }

      if (!kartSahibi) {
        message.error('Lütfen kart sahibinin adını girin');
        return;
      }

      if (!sonKullanma) {
        message.error('Lütfen son kullanma tarihini girin');
        return;
      }

      if (!cvv || cvv.length < 3) {
        message.error('Lütfen güvenlik kodunu girin');
        return;
      }

      if (cart.length === 0) {
        message.error('Sepetiniz boş');
        return;
      }

      if (!user || !user.email) {
        message.error('Lütfen önce giriş yapın');
        return;
      }

      setLoading(true);
      const successes = [];
      const errors = [];

      await new Promise(resolve => setTimeout(resolve, 3000));

      for (const rezervasyon of cart) {
        try {
          const satis = {
            email: user.email,
            saha: rezervasyon.isim,
            tarih: rezervasyon.tarih,
            saat: rezervasyon.saat,
            fiyat: rezervasyon.fiyat
          };

          await saveSatisToSheet(satis);
          successes.push(rezervasyon);
        } catch (error) {
          errors.push({ rezervasyon, error: error.message });
        }
      }

      const silmeSonucu = await forceDeleteRezervasyonlar(user.email);
      
      const silinenSayi = silmeSonucu.basarili;
      const kalanSayi = silmeSonucu.kalan.length;
      
      if (successes.length > 0) {
        onClear();
        
        setKart('');
        setKartSahibi('');
        setSonKullanma('');
        setCvv('');
        
        setSuccessModalVisible(true);
      } else {
        message.error({
          content: 'Ödeme işlemi tamamlanamadı!',
          duration: 3,
        });
      }

      if (errors.length > 0) {
        message.error({
          content: `Ödeme işlemi sırasında hata oluştu. Lütfen tekrar deneyin.`,
          duration: 5,
        });
      }
    } catch (error) {
      message.error({
        content: 'Ödeme işlemi sırasında bir hata oluştu: ' + error.message,
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  const toplamTutar = cart.reduce((total, item) => total + Number(item.fiyat), 0);

  const formatCardNumber = (value) => {
    if (!value) return value;
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setKart(formatted);
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return { value: month.toString().padStart(2, '0'), label: month.toString().padStart(2, '0') };
  });
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => {
    const year = currentYear + i;
    return { value: year.toString().slice(2), label: year.toString() };
  });

  return (
    <Card 
      title={
        <div style={{ fontSize: 28, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
          <ShoppingCartOutlined style={{ fontSize: 28, marginRight: 12, color: '#1677ff' }} />
          <span>Sepetim</span>
        </div>
      }
      style={{ 
        width: '100%', 
        margin: '0 auto',
        minHeight: 600, 
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}
      styles={{ body: { padding: '24px' } }}
    >
      {cart.length > 0 ? (
        <>
          <div style={{ 
            padding: '16px 24px', 
            background: '#f9f9f9', 
            borderRadius: '8px', 
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <Title level={4} style={{ margin: 0 }}>Rezervasyon Listesi</Title>
          </div>
          
          <List
            itemLayout="horizontal"
            dataSource={cart}
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <Button 
                    type="primary" 
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onRemove(index, item)}
                    style={{ borderRadius: '6px' }}
                  >
                    Kaldır
                  </Button>
                ]}
                className="custom-list-item"
                style={{ 
                  padding: '16px', 
                  marginBottom: '12px', 
                  background: '#fafafa',
                  borderRadius: '8px',
                  border: '1px solid #f0f0f0'
                }}
              >
                <List.Item.Meta
                  title={
                    <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                      {item.isim} - {item.saat}
                    </div>
                  }
                  description={
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text>Tarih: <Text strong>{dayjs(item.tarih).format('DD.MM.YYYY')}</Text></Text>
                      <Text>Konum: <Text strong>{item.konum}</Text></Text>
                      <Text>Fiyat: <Text strong type="danger">{item.fiyat} TL</Text></Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
          
          <Divider style={{ margin: '24px 0' }} />
          
          <div style={{ 
            padding: '16px 24px', 
            background: '#f9f9f9', 
            borderRadius: '8px', 
            marginBottom: '24px',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}>
            <Text strong style={{ fontSize: '20px' }}>Toplam Tutar:</Text>
            <Text strong style={{ fontSize: '24px', color: '#f5222d' }}>{toplamTutar} TL</Text>
          </div>
          
          <Card 
            title={
              <div style={{ fontSize: '18px', fontWeight: 600 }}>
                <CreditCardOutlined style={{ marginRight: '8px', color: '#1677ff' }} />
                Ödeme Bilgileri
              </div>
            }
            style={{ 
              marginBottom: '24px', 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
            styles={{ body: { padding: '24px' } }}
          >
            <Form layout="vertical">
              <Row gutter={16}>
                <Col span={24} style={{ marginBottom: '12px' }}>
                  <Form.Item 
                    label="Kart Sahibi" 
                    required
                    tooltip="Kart üzerindeki isim"
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: '#1677ff' }} />}
                      placeholder="Ad Soyad"
                      value={kartSahibi}
                      onChange={(e) => setKartSahibi(e.target.value)}
                      size="large"
                      style={{ borderRadius: '6px' }}
                    />
                  </Form.Item>
                </Col>
                
                <Col span={24} style={{ marginBottom: '12px' }}>
                  <Form.Item 
                    label="Kart Numarası" 
                    required
                  >
                    <Input
                      prefix={<CreditCardOutlined style={{ color: '#1677ff' }} />}
                      placeholder="1234 5678 9012 3456"
                      value={kart}
                      onChange={handleCardNumberChange}
                      maxLength={19}
                      size="large"
                      style={{ borderRadius: '6px' }}
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={16} style={{ marginBottom: '12px' }}>
                  <Form.Item 
                    label="Son Kullanma Tarihi" 
                    required
                  >
                    <Space>
                      <Select
                        placeholder="Ay"
                        style={{ width: '80px', borderRadius: '6px' }}
                        value={sonKullanma.split('/')[0] || undefined}
                        onChange={(value) => {
                          const year = sonKullanma.split('/')[1] || '';
                          setSonKullanma(`${value}/${year}`);
                        }}
                        size="large"
                        options={months}
                      />
                      <span style={{ color: '#999' }}>/</span>
                      <Select
                        placeholder="Yıl"
                        style={{ width: '100px', borderRadius: '6px' }}
                        value={sonKullanma.split('/')[1] || undefined}
                        onChange={(value) => {
                          const month = sonKullanma.split('/')[0] || '';
                          setSonKullanma(`${month}/${value}`);
                        }}
                        size="large"
                        options={years}
                      />
                    </Space>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={8} style={{ marginBottom: '12px' }}>
                  <Form.Item 
                    label="CVV" 
                    required
                    tooltip="Kartın arka yüzündeki 3 haneli güvenlik kodu"
                  >
                    <Input
                      prefix={<LockOutlined style={{ color: '#1677ff' }} />}
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                      maxLength={3}
                      size="large"
                      style={{ borderRadius: '6px' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ marginTop: '24px', marginBottom: '0' }}>
                <Button 
                  type="primary" 
                  size="large" 
                  block
                  onClick={odemeYap}
                  loading={loading}
                  style={{ height: '50px', fontSize: '16px', borderRadius: '6px' }}
                  icon={<ShoppingCartOutlined />}
                >
                  {loading ? 'Ödeme İşleniyor...' : 'Ödeme Yap'}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '48px 0' 
        }}>
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description={
              <div style={{ fontSize: '16px', marginBottom: '24px' }}>
                Sepetinizde ürün bulunmamaktadır
              </div>
            } 
          />
          <Button 
            type="primary" 
            size="large"
            onClick={() => setCurrent('list')}
            style={{ marginTop: '16px', borderRadius: '6px' }}
          >
            Halı Saha Listesine Dön
          </Button>
        </div>
      )}
      
      <Modal
        open={successModalVisible}
        footer={null}
        onCancel={() => setSuccessModalVisible(false)}
        width={500}
        centered
        styles={{
          body: {
            padding: '32px 24px 24px',
          }
        }}
      >
        <Result
          status="success"
          icon={<CheckCircleFilled style={{ color: '#52c41a', fontSize: 72 }} />}
          title="Ödeme Başarıyla Tamamlandı!"
          subTitle={
            <div style={{ textAlign: 'center', fontSize: '16px', color: '#666' }}>
              <p>Rezervasyon onayınız için <strong>{user?.email}</strong> adresine bir e-posta gönderildi.</p>
              <p>Rezervasyon detaylarınızı e-posta adresinizden takip edebilirsiniz.</p>
            </div>
          }
          extra={[
            <Button 
              type="primary" 
              key="console" 
              size="large"
              style={{ borderRadius: '6px', marginTop: '16px' }}
              onClick={() => {
                setSuccessModalVisible(false);
                setCurrent('list');
              }}
            >
              Anasayfaya Dön
            </Button>
          ]}
        />
      </Modal>
    </Card>
  );
};

export default Sepet; 