import { Layout, Menu, Avatar, Dropdown, Button, message, ConfigProvider, App as AntApp } from 'antd';
import { UserOutlined, LogoutOutlined, AppstoreOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import HalıSahaListesi from './components/HalıSahaListesi';
import Profil from './components/Profil';
import Sepet from './components/Sepet';
import Login from './components/Login';
import Register from './components/Register';
import 'antd/dist/reset.css';
import { getRezervasyonlarFromSheet, deleteRezervasyonFromSheet, forceDeleteRezervasyonlar } from './utils/googleSheets';
import './global.css';

const { Header, Sider, Content } = Layout;

message.config({ zIndex: 9999 });

function App() {
  const [current, setCurrent] = useState('list');
  const [auth, setAuth] = useState(null);
  const [authPage, setAuthPage] = useState('login');
  const [collapsed, setCollapsed] = useState(false);
  const [cart, setCart] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const user = localStorage.getItem('authUser');
    if (user) {
      setAuth(JSON.parse(user));
      
      const lastPage = localStorage.getItem('currentPage');
      if (lastPage) {
        setCurrent(lastPage);
      }
    }
  }, []);

  useEffect(() => {
    if (auth) {
      localStorage.setItem('authUser', JSON.stringify(auth));
    } else {
      localStorage.removeItem('authUser');
      localStorage.removeItem('currentPage');
    }
  }, [auth]);
  
  useEffect(() => {
    if (auth && current) {
      localStorage.setItem('currentPage', current);
    }
  }, [current, auth]);

  useEffect(() => {
    async function fetchCart() {
      if (auth && auth.email) {
        try {
          const rezervasyonlar = await getRezervasyonlarFromSheet(auth.email);
          
          const yeniSepet = rezervasyonlar.map(r => ({
            isim: r.saha,
            konum: r.konum,
            fiyat: r.fiyat,
            tarih: r.tarih,
            saat: r.saat
          }));
          
          localStorage.setItem('cart', JSON.stringify(yeniSepet));
          
          setCart(yeniSepet);
        } catch (error) {
          messageApi.error('Sepet yüklenirken bir hata oluştu');
        }
      }
    }
    fetchCart();
  }, [auth]);

  useEffect(() => {
    if (current === 'cart' && auth && auth.email) {
      async function yenidenYukle() {
        try {
          const rezervasyonlar = await getRezervasyonlarFromSheet(auth.email);
          
          const yeniSepet = rezervasyonlar.map(r => ({
            isim: r.saha,
            konum: r.konum,
            fiyat: r.fiyat,
            tarih: r.tarih,
            saat: r.saat
          }));
          
          localStorage.setItem('cart', JSON.stringify(yeniSepet));
          
          setCart(yeniSepet);
        } catch (error) {
          messageApi.error('Sepet yenilenemedi');
        }
      }
      yenidenYukle();
    }
  }, [current, auth]);

  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart]);

  const handleLogout = () => {
    setAuth(null);
    setCurrent('list');
    setCart([]);
    localStorage.removeItem('authUser');
  };

  const handleAddToCart = (saha, rezervasyon) => {
    setCart(prev => [...prev, { ...saha, ...rezervasyon }]);
  };

  const updateUserInfo = (updatedUserInfo) => {
    if (auth && updatedUserInfo) {
      const newUserInfo = { ...auth, ...updatedUserInfo };
      setAuth(newUserInfo);
      localStorage.setItem('authUser', JSON.stringify(newUserInfo));
      messageApi.success('Kullanıcı bilgileri güncellendi');
    }
  };

  const handleRemoveFromCart = async (index) => {
    try {
      const item = cart[index];

      const yeniSepet = cart.filter((_, i) => i !== index);
      setCart(yeniSepet);
      localStorage.setItem('cart', JSON.stringify(yeniSepet));
      
      try {
        await deleteRezervasyonFromSheet({
          email: auth.email,
          saha: item.isim,
          tarih: item.tarih,
          saat: item.saat
        });
        messageApi.success('Rezervasyon sepetten kaldırıldı');
        
        async function yenidenYukle() {
          try {
            const rezervasyonlar = await getRezervasyonlarFromSheet(auth.email);
            
            const guncelSepet = rezervasyonlar.map(r => ({
              isim: r.saha,
              konum: r.konum,
              fiyat: r.fiyat,
              tarih: r.tarih,
              saat: r.saat
            }));
            
            localStorage.setItem('cart', JSON.stringify(guncelSepet));
            
            setCart(guncelSepet);
          } catch (error) {
            messageApi.error('Sepet güncellenemedi');
          }
        }
        
        setTimeout(yenidenYukle, 1000);
      } catch (silmeHatasi) {
        messageApi.success('Rezervasyon sepetten kaldırıldı');
      }
      
    } catch (error) {
      messageApi.error('Rezervasyon silinirken bir hata oluştu');
    }
  };

  const handleClearCart = async () => {
    try {
      if (cart.length === 0) {
        messageApi.info('Sepet zaten boş');
        return;
      }
      
      messageApi.loading('Sepet temizleniyor...');

      const silmeSonucu = await forceDeleteRezervasyonlar(auth.email);
      
      setCart([]);
      localStorage.setItem('cart', '[]');
      
      messageApi.success('Sepet başarıyla temizlendi.');
    } catch (error) {
      setCart([]);
      localStorage.setItem('cart', '[]');
      
      messageApi.success('Sepet temizlendi.');
    }
  };

  const menuItems = [
    { key: 'list', icon: <AppstoreOutlined />, label: 'Halı Saha Listesi' },
    { key: 'profile', icon: <UserOutlined />, label: 'Profil' },
  ];

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: <span onClick={handleLogout}>Çıkış Yap</span>,
      },
    ],
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
        },
      }}
    >
      <AntApp>
        {contextHolder}
        <Layout style={{ minHeight: '100vh' }}>
          {auth && (
            <Sider
              collapsible
              collapsed={collapsed}
              onCollapse={setCollapsed}
              theme="dark"
              style={{ minHeight: '100vh', background: '#001529' }}
              width={280}
              collapsedWidth={80}
            >
              <div style={{ 
                margin: '24px 16px', 
                textAlign: 'center', 
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: '24px'
              }}>
                <div style={{ 
                  background: '#1677ff', 
                  borderRadius: '12px', 
                  width: collapsed ? '50px' : '160px', 
                  height: collapsed ? '50px' : '50px', 
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: 'white',
                  transition: 'all 0.3s'
                }}>
                  {collapsed ? 'HS' : 'Halı Saha'}
                </div>
                <Avatar 
                  size={collapsed ? 64 : 80} 
                  icon={<UserOutlined />}
                  style={{ 
                    backgroundColor: '#1677ff',
                    fontSize: collapsed ? '32px' : '40px'
                  }}
                />
                {!collapsed && (
                  <div style={{ 
                    color: '#fff', 
                    marginTop: 12, 
                    fontSize: '16px',
                    fontWeight: '500'
                  }}>
                    {auth.isim}
                  </div>
                )}
              </div>
              <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[current]}
                onClick={e => setCurrent(e.key)}
                style={{ 
                  marginTop: 16, 
                  background: '#001529', 
                  borderRight: 0,
                  fontSize: '16px'
                }}
                items={[
                  { 
                    key: 'list', 
                    icon: <AppstoreOutlined style={{ fontSize: '18px' }} />, 
                    label: 'Halı Saha Listesi',
                    style: { height: '50px', display: 'flex', alignItems: 'center' }
                  },
                  { 
                    key: 'profile', 
                    icon: <UserOutlined style={{ fontSize: '18px' }} />, 
                    label: 'Profil',
                    style: { height: '50px', display: 'flex', alignItems: 'center' }
                  },
                ]}
              />
              
              {!collapsed && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: '80px', 
                  left: '24px', 
                  right: '24px', 
                  padding: '16px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.65)',
                  fontSize: '14px'
                }}>
                  <div style={{ marginBottom: '8px', fontWeight: 'bold', color: 'rgba(255,255,255,0.85)' }}>Hızlı Bilgi</div>
                  <div>Aktif Üyelik</div>
                  <div style={{ marginTop: '4px' }}>Toplam: {cart.length} Rezervasyon</div>
                </div>
              )}
            </Sider>
          )}
          <Layout style={{ background: '#f0f2f5' }}>
            <Header
              style={{
                background: '#fff',
                padding: '0 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 8px #f0f1f2',
                minHeight: 64,
              }}
            >
              <div style={{ 
                fontSize: '20px', 
                fontWeight: 'bold',
                color: '#1677ff',
                display: 'flex',
                alignItems: 'center'
              }}>
                {auth && <div style={{ display: 'none' }}>Gizli</div>}
                {!auth && <span>Halı Saha Rezervasyon Sistemi</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {auth && (
                  <Button
                    type="primary"
                    icon={<ShoppingCartOutlined style={{ fontSize: 20 }} />}
                    style={{ 
                      marginRight: 24, 
                      fontWeight: 600, 
                      fontSize: 16, 
                      position: 'relative',
                      height: '42px',
                      borderRadius: '8px'
                    }}
                    onClick={() => setCurrent('cart')}
                  >
                    <span>Sepetim</span>
                    <span style={{ 
                      position: 'absolute', 
                      top: '-8px', 
                      right: '-8px', 
                      background: '#ff4d4f', 
                      color: '#fff', 
                      borderRadius: '50%', 
                      width: 22, 
                      height: 22, 
                      fontSize: 14, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: '2px solid #fff'
                    }}>{cart.length}</span>
                  </Button>
                )}
                {auth ? (
                  <Dropdown menu={userMenu} placement="bottomRight">
                    <Button 
                      type="text" 
                      icon={<Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />} 
                      style={{ fontWeight: 500 }}
                    >
                      {auth.isim}
                    </Button>
                  </Dropdown>
                ) : (
                  <>
                    <Button
                      type="primary"
                      style={{ 
                        marginRight: 12, 
                        fontWeight: 500, 
                        fontSize: 16, 
                        padding: '0 24px', 
                        height: 40,
                        borderRadius: '8px' 
                      }}
                      onClick={() => {
                        setAuthPage('login');
                        localStorage.removeItem('currentPage');
                      }}
                    >
                      Giriş Yap
                    </Button>
                    <Button
                      style={{ 
                        fontWeight: 500, 
                        fontSize: 16, 
                        padding: '0 24px', 
                        height: 40,
                        borderRadius: '8px'
                      }}
                      onClick={() => {
                        setAuthPage('register');
                        localStorage.removeItem('currentPage');
                      }}
                    >
                      Kayıt Ol
                    </Button>
                  </>
                )}
              </div>
            </Header>
            <Content
              style={{
                margin: '32px auto',
                background: '#f0f2f5',
                minHeight: 'calc(100vh - 64px)',
                maxWidth: '1200px',
                width: '100%',
                padding: '0 24px',
                display: 'block',
                overflowY: 'auto',
              }}
            >
              {!auth ? (
                authPage === 'login' ? (
                  <Login onLogin={setAuth} />
                ) : (
                  <Register onRegister={setAuth} />
                )
              ) : (
                <>
                  {current === 'list' && <HalıSahaListesi onAddToCart={handleAddToCart} />}
                  {current === 'profile' && <Profil user={auth} onUpdateUser={updateUserInfo} />}
                  {current === 'cart' && <Sepet cart={cart} onRemove={handleRemoveFromCart} onClear={handleClearCart} user={auth} setCurrent={setCurrent} />}
                </>
              )}
            </Content>
          </Layout>
        </Layout>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
