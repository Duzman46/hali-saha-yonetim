import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Tag, Space, Modal, DatePicker, notification, Select, Input, Form, Row, Col, Divider, Typography, App } from 'antd';
import { getSahalarFromSheet, addRezervasyonToSheet, getRezervasyonlarFromSheet, checkSahaSatildiMi } from '../utils/googleSheets';
import dayjs from 'dayjs';
import trTR from 'antd/es/date-picker/locale/tr_TR';
import 'dayjs/locale/tr';
import { CheckCircleFilled, DeleteOutlined, SearchOutlined, FilterOutlined, EnvironmentOutlined, ClockCircleOutlined, DollarOutlined, CalendarOutlined } from '@ant-design/icons';
dayjs.locale('tr');

const { Title, Text } = Typography;
const { Option } = Select;
const { message } = App;

const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const saatDilimleri = [
  '08:00 - 09:00', 
  '09:00 - 10:00', 
  '10:00 - 11:00', 
  '11:00 - 12:00', 
  '12:00 - 13:00', 
  '13:00 - 14:00', 
  '14:00 - 15:00', 
  '15:00 - 16:00',
  '16:00 - 17:00', 
  '17:00 - 18:00', 
  '18:00 - 19:00', 
  '19:00 - 20:00',
  '20:00 - 21:00', 
  '21:00 - 22:00', 
  '22:00 - 23:00', 
  '23:00 - 00:00'
];

const HalıSahaListesi = ({ onAddToCart }) => {
  const [sahalar, setSahalar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSaha, setSelectedSaha] = useState(null);
  const [rezervasyon, setRezervasyon] = useState({ tarih: null, saatAraligi: [] });
  const [filterGun, setFilterGun] = useState(null);
  const [filterSaatAraligi, setFilterSaatAraligi] = useState(null);
  const [filteredSahalar, setFilteredSahalar] = useState([]);
  const [allRezervasyonlar, setAllRezervasyonlar] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [bosSaatler, setBosSaatler] = useState([]);
  const [filterKonum, setFilterKonum] = useState(null);
  const [konumlar, setKonumlar] = useState([]);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    const fetchSahalar = async () => {
      setLoading(true);
      try {
        const data = await getSahalarFromSheet();
        const rows = data.filter(row => row.isim);
        
        // Konumları topla
        const tumKonumlar = [...new Set(rows.map(saha => saha.konum).filter(Boolean))];
        setKonumlar(tumKonumlar);
        
        setSahalar(rows);
        setFilteredSahalar(rows);
      } catch (e) {
        message.error('Saha listesi alınamadı.');
      } finally {
        setLoading(false);
      }
    };
    fetchSahalar();
  }, []);

  useEffect(() => {
    // Tüm rezervasyonları çek
    const fetchRez = async () => {
      try {
        const data = await getRezervasyonlarFromSheet();
        setAllRezervasyonlar(data);
      } catch (e) {
        setAllRezervasyonlar([]);
      }
    };
    fetchRez();
  }, []);

  // Filtreleme fonksiyonu
  useEffect(() => {
    const filterSahalar = async () => {
      setLoading(true);
      let filtered = sahalar;
      
      // 1. Gün filtresi
      if (filterGun) {
        filtered = filtered.filter(saha => {
          const uygunGunler = saha.uygunGunler?.split(',').map(g => g.trim()) || [];
          return uygunGunler.includes(filterGun);
        });
      }
      
      // 2. Konum filtresi
      if (filterKonum) {
        filtered = filtered.filter(saha => saha.konum === filterKonum);
      }
      
      // 3. Saat aralığı filtresi
      if (filterSaatAraligi) {
        const filteredWithTime = [];
        
        for (const saha of filtered) {
          // Sahanın çalışma saatlerini kontrol et
          const uygunSaatler = saha.uygunSaatler?.split('-').map(s => s.trim()) || [];
          if (uygunSaatler.length !== 2) continue;
          
          const [start, end] = uygunSaatler;
          
          // Saatleri saat:dakika formatından sayısal değerlere dönüştürme
          const [sahaStartHour, sahaStartMinute = 0] = start.split(':').map(Number);
          const [sahaEndHour, sahaEndMinute = 0] = end.split(':').map(Number);
          const sahaStartValue = sahaStartHour * 60 + sahaStartMinute;
          const sahaEndValue = sahaEndHour * 60 + sahaEndMinute;
          
          // Seçilen saat aralığını parçala
          const [seciliBaslangic, seciliBitis] = filterSaatAraligi.split(' - ');
          const [secilenStartHour, secilenStartMinute = 0] = seciliBaslangic.split(':').map(Number);
          const [secilenEndHour, secilenEndMinute = 0] = seciliBitis.split(':').map(Number);
          const secilenStartValue = secilenStartHour * 60 + secilenStartMinute;
          const secilenEndValue = secilenEndHour * 60 + secilenEndMinute;
          
          // Seçilen saat, sahanın çalışma saatleri içinde mi?
          if (secilenStartValue < sahaStartValue || secilenEndValue > sahaEndValue) continue;
          
          // Belirlenen saatin dolu olup olmadığını kontrol et
          let sahaDolu = false;
          
          // Gün seçiliyse o güne ait Satislar kontrolü yap
          if (filterGun) {
            // Haftanın gününü tarih formatına dönüştürme
            const bugun = dayjs();
            let tarihFormati = null;
            
            // Bugünden başlayarak 7 gün içinde filtrelenen günü bul
            for (let i = 0; i < 7; i++) {
              const tarih = bugun.add(i, 'day');
              if (tarih.locale('tr').format('dddd').charAt(0).toUpperCase() + tarih.locale('tr').format('dddd').slice(1) === filterGun) {
                tarihFormati = tarih.format('YYYY-MM-DD');
                break;
              }
            }
            
            if (tarihFormati) {
              try {
                const dolu = await checkSahaSatildiMi(saha.isim, tarihFormati, filterSaatAraligi);
                if (dolu) {
                  sahaDolu = true;
                }
              } catch (error) {
                // Hata sessiz geçildi
              }
            }
          }
          
          if (!sahaDolu) {
            filteredWithTime.push(saha);
          }
        }
        
        filtered = filteredWithTime;
      }
      
      // 4. Arama filtresi
      if (searchText) {
        const lower = searchText.toLowerCase();
        filtered = filtered.filter(saha =>
          saha.isim?.toLowerCase().includes(lower) ||
          saha.konum?.toLowerCase().includes(lower)
        );
      }
      
      setFilteredSahalar(filtered);
      setLoading(false);
    };
    
    filterSahalar();
  }, [filterGun, filterSaatAraligi, searchText, filterKonum, sahalar]);

  const saatlikAraliklar = (uygunSaatlerStr) => {
    if (!uygunSaatlerStr) return [];
    
    // Sahanın çalışma saatlerini al
    const [start, end] = uygunSaatlerStr.split('-').map(s => s.trim());
    
    // Saat ve dakika değerlerini ayır
    const [startHour, startMinute = '00'] = start.split(':').map(Number);
    const [endHour, endMinute = '00'] = end.split(':').map(Number);
    
    // Uygun saat aralıklarını belirle
    const araliklar = [];
    
    // Daha geniş saat aralığı için
    for (let saat = startHour; saat < endHour; saat++) {
      const baslangic = `${saat.toString().padStart(2, '0')}:00`;
      const bitis = `${(saat + 1).toString().padStart(2, '0')}:00`;
      araliklar.push(`${baslangic} - ${bitis}`);
    }
    
    // Eğer son saat tam saate denk gelmiyorsa
    if (endMinute > 0) {
      const sonSaat = `${endHour.toString().padStart(2, '0')}:00`;
      const bitisSaat = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      araliklar.push(`${sonSaat} - ${bitisSaat}`);
    }
    
    return araliklar;
  };

  const handleSahaOrTarihChange = async (saha, tarih) => {
    if (!saha || !tarih) return setBosSaatler([]);
    
    const tumSaatler = saatlikAraliklar(saha.uygunSaatler);
    const doluSaatler = [];
    
    // 1. Satış tablosundan dolu saatleri kontrol et
    for (const saat of tumSaatler) {
      try {
        const dolu = await checkSahaSatildiMi(saha.isim, tarih.format('YYYY-MM-DD'), saat);
        if (dolu) {
          doluSaatler.push(saat);
        }
      } catch (error) {
        // Hata sessiz geçildi
      }
    }
    
    // 2. Sepetteki aynı gün ve aynı saha için eklenen saatleri kontrol et
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const sepettekiSaatler = cart
      .filter(item => 
        item.isim === saha.isim && 
        item.tarih === tarih.format('YYYY-MM-DD')
      )
      .map(item => item.saat);
    
    // Her ikisinden de dolu olanları ekle
    const tumDoluSaatler = [...new Set([...doluSaatler, ...sepettekiSaatler])];
    
    setBosSaatler(tumSaatler.filter(saat => !tumDoluSaatler.includes(saat)));
  };

  // Modal açıldığında veya tarih/saha değiştiğinde boş saatleri güncelle
  useEffect(() => {
    if (modalOpen && selectedSaha && rezervasyon.tarih) {
      handleSahaOrTarihChange(selectedSaha, rezervasyon.tarih);
    }
  }, [modalOpen, selectedSaha, rezervasyon.tarih]);

  const handleKirala = (saha) => {
    setSelectedSaha(saha);
    setRezervasyon({ tarih: null, saatAraligi: [] });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    if (!rezervasyon.tarih || !rezervasyon.saat) {
      message.error('Lütfen uygun tarih ve saat seçin!');
      return;
    }
    
    // Sepette aynı saha-tarih-saat var mı kontrol et
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const ayniVar = cart.find(
      r => r.isim === selectedSaha.isim &&
           r.tarih === rezervasyon.tarih.format('YYYY-MM-DD') &&
           r.saat === rezervasyon.saat
    );
    
    if (ayniVar) {
      message.error('Bu saat aralığı zaten sepette!');
      return;
    }
    
    // Seçilen slotun satış tablosunda dolu olup olmadığını kontrol et
    try {
      const dolu = await checkSahaSatildiMi(
        selectedSaha.isim, 
        rezervasyon.tarih.format('YYYY-MM-DD'),
        rezervasyon.saat
      );
      
      if (dolu) {
        message.error('Bu saat aralığı satın alınmış ve dolu!');
        return;
      }
    } catch (error) {
      // Hata sessiz geçildi
    }
    
    const user = JSON.parse(localStorage.getItem('authUser'));
    try {
      await addRezervasyonToSheet({
        isim: user.isim,
        email: user.email,
        saha: selectedSaha.isim,
        tarih: rezervasyon.tarih.format('YYYY-MM-DD'),
        saat: rezervasyon.saat,
        fiyat: selectedSaha.fiyat,
        konum: selectedSaha.konum
      });
      
      // Sepete eklemeden önce localStorage'daki cart'ı güncelle
      const newCart = [
        ...cart,
        {
          ...selectedSaha,
          tarih: rezervasyon.tarih.format('YYYY-MM-DD'),
          saat: rezervasyon.saat
        }
      ];
      
      localStorage.setItem('cart', JSON.stringify(newCart));
      onAddToCart(selectedSaha, {
        tarih: rezervasyon.tarih.format('YYYY-MM-DD'),
        saat: rezervasyon.saat
      });
      
      setModalOpen(false);
      setTimeout(() => notification.open({
        message: null,
        description: (
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 18, fontWeight: 600 }}>
            <CheckCircleFilled style={{ color: '#52c41a', fontSize: 26, marginRight: 14 }} />
            <span>Rezervasyon sepete eklendi!</span>
          </div>
        ),
        placement: 'top',
        style: { top: 120, zIndex: 12000, background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' },
        duration: 2.5
      }), 300);
    } catch (e) {
      message.error('Rezervasyon kaydedilemedi!');
    }
  };

  const resetFilters = () => {
    setFilterGun(null);
    setFilterSaatAraligi(null);
    setFilterKonum(null);
    setSearchText('');
  };

  const FormattedPrice = ({ price }) => (
    <Text style={{ color: '#f50', fontWeight: 'bold' }}>{price} ₺</Text>
  );

  // Uygun günler ve saatler
  const uygunGunler = selectedSaha?.uygunGunler?.split(',').map(g => g.trim()) || [];
  const uygunSaatler = selectedSaha?.uygunSaatler?.split('-').map(s => s.trim()) || [];
  
  // Saat aralığı parse
  let startHour = 0, endHour = 23;
  if (uygunSaatler.length === 2) {
    const [start, end] = uygunSaatler;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    startHour = sh;
    endHour = eh;
  }

  return (
    <Card 
      title={
        <div style={{ fontSize: 28, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Halı Saha Listesi</span>
          <Button 
            type="primary"
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
            style={{ borderRadius: '8px' }}
          >
            {showFilters ? 'Filtreleri Gizle' : 'Filtreleri Göster'}
          </Button>
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
      styles={{ body: { padding: showFilters ? '24px' : '0px' } }}
    >
      {showFilters && (
        <div style={{ 
          padding: '24px', 
          background: '#f9f9f9', 
          borderRadius: '12px', 
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12} lg={6}>
              <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                <CalendarOutlined style={{ marginRight: '8px', color: '#1677ff' }} />
                Gün Seçimi
              </div>
              <Select
                allowClear
                placeholder="Gün seçin"
                style={{ width: '100%' }}
                value={filterGun}
                onChange={setFilterGun}
                options={gunler.map(gun => ({ value: gun, label: gun }))}
                size="large"
              />
            </Col>
            
            <Col xs={24} md={12} lg={6}>
              <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                <ClockCircleOutlined style={{ marginRight: '8px', color: '#1677ff' }} />
                Saat Aralığı
              </div>
              <Select
                allowClear
                placeholder="Saat aralığı seçin"
                style={{ width: '100%' }}
                value={filterSaatAraligi}
                onChange={setFilterSaatAraligi}
                options={saatDilimleri.map(saat => ({ value: saat, label: saat }))}
                size="large"
              />
            </Col>
            
            <Col xs={24} md={12} lg={6}>
              <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                <EnvironmentOutlined style={{ marginRight: '8px', color: '#1677ff' }} />
                Konum
              </div>
              <Select
                allowClear
                placeholder="Konum seçin"
                style={{ width: '100%' }}
                value={filterKonum}
                onChange={setFilterKonum}
                size="large"
              >
                {konumlar.map(konum => (
                  <Option key={konum} value={konum}>{konum}</Option>
                ))}
              </Select>
            </Col>
            
            <Col xs={24} md={12} lg={6}>
              <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                <SearchOutlined style={{ marginRight: '8px', color: '#1677ff' }} />
                Arama
              </div>
              <Input.Search
                placeholder="Saha adı veya konum ara"
                allowClear
                style={{ width: '100%' }}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                size="large"
              />
            </Col>
            
            <Col xs={24} md={24} style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <Button 
                onClick={resetFilters}
                size="large"
                icon={<DeleteOutlined />}
                style={{ minWidth: '160px', height: '40px' }}
                danger
              >
                Filtreleri Temizle
              </Button>
            </Col>
          </Row>
        </div>
      )}
      
      {filteredSahalar.length === 0 && !loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Title level={4} style={{ color: '#999' }}>Aramanıza uygun halı saha bulunamadı</Title>
          <Text type="secondary">Lütfen filtreleme seçeneklerini değiştirerek tekrar deneyin</Text>
          <div style={{ marginTop: '24px' }}>
            <Button type="primary" onClick={resetFilters}>Filtreleri Temizle</Button>
          </div>
        </div>
      ) : (
        <Table
          columns={[
            { 
              title: 'Saha Adı', 
              dataIndex: 'isim', 
              key: 'isim',
              render: (text) => <Text strong style={{ fontSize: '16px' }}>{text}</Text>
            },
            { 
              title: 'Konum', 
              dataIndex: 'konum', 
              key: 'konum', 
              render: (text) => (
                <Space>
                  <EnvironmentOutlined style={{ color: '#1677ff' }} />
                  <span>{text}</span>
                </Space>
              )
            },
            { 
              title: 'Fiyat', 
              dataIndex: 'fiyat', 
              key: 'fiyat', 
              render: (price) => <FormattedPrice price={price} />,
              sorter: (a, b) => parseInt(a.fiyat) - parseInt(b.fiyat),
              sortDirections: ['ascend', 'descend'],
            },
            { 
              title: 'Kiralama Tipi', 
              dataIndex: 'kiralamaTipi', 
              key: 'kiralamaTipi', 
              render: (v) => <Tag color={v === 'Saatlik' ? 'blue' : 'green'}>{v}</Tag> 
            },
            { 
              title: 'Uygun Günler', 
              dataIndex: 'uygunGunler', 
              key: 'uygunGunler', 
              render: (v) => v && v.split(',').map(gun => (
                <Tag key={gun} color="blue" style={{ margin: '2px' }}>{gun}</Tag>
              )) 
            },
            { 
              title: 'Uygun Saatler', 
              dataIndex: 'uygunSaatler', 
              key: 'uygunSaatler',
              render: (text) => (
                <Space>
                  <ClockCircleOutlined style={{ color: '#1677ff' }} />
                  <span>{text}</span>
                </Space>
              )
            },
            {
              title: 'İşlem',
              key: 'islem',
              render: (_, row) => (
                <Button 
                  type="primary" 
                  onClick={() => handleKirala(row)} 
                  style={{ borderRadius: '6px' }}
                >
                  Kirala
                </Button>
              )
            },
          ]}
          dataSource={filteredSahalar}
          loading={loading}
          rowKey={row => row.row_id || row.isim}
          pagination={{ 
            pageSize: 8, 
            position: ['bottomCenter'],
            showTotal: (total) => `Toplam ${total} halı saha`,
          }}
          locale={{ emptyText: 'Kayıtlı halı saha bulunamadı.' }}
          style={{ fontSize: 16 }}
          size="large"
          bordered
          rowClassName={() => 'custom-table-row'}
        />
      )}

      <Modal
        title={selectedSaha ? `${selectedSaha.isim} için Rezervasyon` : ''}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        okText="Sepete Ekle"
        cancelText="Vazgeç"
        width={500}
        styles={{
          header: {
            borderBottom: '1px solid #f0f0f0',
            padding: '20px 24px',
          },
          body: {
            fontSize: 16,
            padding: '24px',
          },
          footer: {
            borderTop: '1px solid #f0f0f0',
            padding: '16px 24px',
          }
        }}
      >
        <Space direction="vertical" style={{ width: '100%', gap: '24px' }}>
          {selectedSaha && (
            <div style={{ padding: '16px', background: '#f9f9f9', borderRadius: '8px' }}>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text type="secondary">Saha:</Text>
                  <div><Text strong>{selectedSaha.isim}</Text></div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Konum:</Text>
                  <div><Text strong>{selectedSaha.konum}</Text></div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Fiyat:</Text>
                  <div><FormattedPrice price={selectedSaha.fiyat} /></div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Kiralama Tipi:</Text>
                  <div><Tag color={selectedSaha.kiralamaTipi === 'Saatlik' ? 'blue' : 'green'}>{selectedSaha.kiralamaTipi}</Tag></div>
                </Col>
              </Row>
            </div>
          )}
          
          <Form layout="vertical">
            <Form.Item 
              label="Rezervasyon Tarihi" 
              required
              style={{ marginBottom: '24px' }}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="Tarih seçin"
                value={rezervasyon.tarih}
                onChange={tarih => setRezervasyon(r => ({ ...r, tarih, saat: undefined }))}
                format="DD.MM.YYYY"
                locale={trTR}
                size="large"
                disabledDate={date => {
                  const today = dayjs().startOf('day');
                  if (date.isBefore(today, 'day')) return true;
                  if (!uygunGunler.length) return false;
                  const gun = date.locale('tr').format('dddd');
                  return !uygunGunler.includes(gun.charAt(0).toUpperCase() + gun.slice(1));
                }}
              />
            </Form.Item>
            
            <Form.Item 
              label="Rezervasyon Saati" 
              required
              style={{ marginBottom: '0' }}
            >
              <Select
                style={{ width: '100%' }}
                placeholder="Saat seçin"
                value={rezervasyon.saat}
                onChange={saat => setRezervasyon(r => ({ ...r, saat }))}
                options={
                  (selectedSaha ? saatlikAraliklar(selectedSaha.uygunSaatler) : []).map(saat => ({
                    value: saat,
                    label: (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        color: bosSaatler.includes(saat) ? 'inherit' : 'rgba(0,0,0,0.3)'
                      }}>
                        <span>{saat}</span>
                        {!bosSaatler.includes(saat) && <span style={{ color: '#ff4d4f' }}>(Dolu)</span>}
                      </div>
                    ),
                    disabled: !bosSaatler.includes(saat)
                  }))
                }
                disabled={!rezervasyon.tarih}
                size="large"
                listHeight={320}
                showSearch={false}
              />
            </Form.Item>
          </Form>
        </Space>
      </Modal>
    </Card>
  );
};

export default HalıSahaListesi; 