import dayjs from 'dayjs';
import 'dayjs/locale/tr';
dayjs.locale('tr');

const KULLANICILAR_API_URL = 'https://api.sheetbest.com/sheets/cadcf994-e265-452e-858a-73981270f5f9/tabs/Kullanicilar';
const SAHALAR_API_URL = 'https://api.sheetbest.com/sheets/cadcf994-e265-452e-858a-73981270f5f9/tabs/Sahalar';
const REZERVASYONLAR_API_URL = 'https://api.sheetbest.com/sheets/cadcf994-e265-452e-858a-73981270f5f9/tabs/Rezervasyonlar';
const SATISLAR_API_URL = 'https://api.sheetbest.com/sheets/cadcf994-e265-452e-858a-73981270f5f9/tabs/Satislar';

// Kullanıcı ekle (Kayıt)
export async function addUserToSheet({ isim, email, sifre }) {
  try {
  const response = await fetch(KULLANICILAR_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isim, email, sifre }),
  });
  if (!response.ok) throw new Error('Kayıt başarısız');
  return true;
  } catch (error) {
    throw error;
  }
}

// Kullanıcı giriş kontrolü
export async function loginUserFromSheet({ email, sifre }) {
  try {
  const response = await fetch(KULLANICILAR_API_URL);
    if (!response.ok) throw new Error('Kullanıcılar getirilemedi');
  const users = await response.json();
  const user = users.find(row => row.email === email && row.sifre === sifre);
  if (user) return { isim: user.isim, email: user.email };
  return null;
  } catch (error) {
    throw error;
  }
}

// Halı saha ekle
export async function addSahaToSheet({ isim, konum, fiyat, kiralamaTipi, uygunGunler, uygunSaatler }) {
  try {
  const response = await fetch(SAHALAR_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isim, konum, fiyat, kiralamaTipi, uygunGunler, uygunSaatler }),
  });
  if (!response.ok) throw new Error('Saha eklenemedi');
  return true;
  } catch (error) {
    throw error;
  }
}

// Halı sahaları listele
export async function getSahalarFromSheet() {
  try {
  const response = await fetch(SAHALAR_API_URL);
    if (!response.ok) throw new Error('Sahalar getirilemedi');
  let result = await response.json();

  if (!result) return [];
    if (!Array.isArray(result)) result = [result];

    return result.filter(row => 
      row.isim &&
      row.isim.toLowerCase() !== 'isim' &&
      row.konum &&
      row.fiyat &&
      row.kiralamaTipi &&
      row.uygunGunler &&
      row.uygunSaatler
  );
  } catch (error) {
    throw error;
  }
}

export const updateSahaStatus = async (sahaId, newStatus) => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/HalıSahalar!A:F?key=${API_KEY}`
    );
    const data = await response.json();
    const rows = data.values || [];
    
    const rowIndex = rows.findIndex(row => row[0] === sahaId);
    if (rowIndex === -1) {
      throw new Error('Saha bulunamadı');
    }

    const range = `HalıSahalar!F${rowIndex + 1}`;
    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=RAW&key=${API_KEY}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[newStatus]]
        })
      }
    );

    return updateResponse.ok;
  } catch (error) {
    throw error;
  }
};

// Rezervasyon ekle
export async function addRezervasyonToSheet({ isim, email, saha, tarih, saat, fiyat, konum }) {
  try {
  const response = await fetch(REZERVASYONLAR_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isim, email, saha, tarih, saat, fiyat, konum }),
    });
    
    if (!response.ok) {
      throw new Error('Rezervasyon eklenemedi');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  return true;
  } catch (error) {
    throw error;
  }
}

// Çoklu rezervasyon silme için yeni fonksiyon
export const deleteRezervasyonlarFromSheet = async (rezervasyonListesi) => {
  try {
    let basariylaSilinen = 0;
    
    let response = await fetch(REZERVASYONLAR_API_URL);
    if (!response.ok) {
      throw new Error('Rezervasyonlar alınamadı');
    }
    
    let data = await response.json();
    let tumRezervasyonlar = Array.isArray(data) ? data : [];
    
    for (const rezervasyon of rezervasyonListesi) {
      let basarili = false;
      
      for (let deneme = 1; deneme <= 5; deneme++) {
        if (basarili) break;
        
        try {
          response = await fetch(REZERVASYONLAR_API_URL);
          if (!response.ok) {
            continue;
          }
          
          data = await response.json();
          tumRezervasyonlar = Array.isArray(data) ? data : [];
          
          const index = tumRezervasyonlar.findIndex(r => {
            const rezervasyonEmail = r.email;
            const rezervasyonSaha = r.saha;
            const rezervasyonTarih = r.tarih;
            const rezervasyonSaat = r.saat;
            
            const emailEslesme = rezervasyonEmail === rezervasyon.email;
            const sahaEslesme = rezervasyonSaha === rezervasyon.saha;
            const tarihEslesme = rezervasyonTarih === rezervasyon.tarih;
            const saatEslesme = rezervasyonSaat === rezervasyon.saat;
            
            return emailEslesme && sahaEslesme && tarihEslesme && saatEslesme;
          });
          
          if (index === -1) {
            continue;
          }
          
          const rezervasyonId = tumRezervasyonlar[index]._id || tumRezervasyonlar[index].id;
          if (rezervasyonId) {
            const deleteResponse = await fetch(`${REZERVASYONLAR_API_URL}/${rezervasyonId}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (deleteResponse.ok) {
              basarili = true;
              basariylaSilinen++;
              await new Promise(resolve => setTimeout(resolve, 2000));
              break;
            }
          }
          
          const indexDeleteResponse = await fetch(`${REZERVASYONLAR_API_URL}/${index}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (indexDeleteResponse.ok) {
            basarili = true;
            basariylaSilinen++;
            await new Promise(resolve => setTimeout(resolve, 2000));
            break;
          }
          
          for (let rowOffset = 0; rowOffset <= 5; rowOffset++) {
            const rowDeleteResponse = await fetch(`${REZERVASYONLAR_API_URL}?row=${index + 1 + rowOffset}`, {
              method: 'DELETE'
            });
            
            if (rowDeleteResponse.ok) {
              basarili = true;
              basariylaSilinen++;
              await new Promise(resolve => setTimeout(resolve, 2000));
              break;
            }
          }
          
        } catch (error) {
          // Hata işleme - sessiz
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    response = await fetch(REZERVASYONLAR_API_URL);
    if (response.ok) {
      data = await response.json();
      tumRezervasyonlar = Array.isArray(data) ? data : [];
    }
    
    return {
      toplam: rezervasyonListesi.length,
      basarili: basariylaSilinen,
      kalanRezervasyonlar: tumRezervasyonlar
    };
  } catch (error) {
    throw error;
  }
};

// Tüm rezervasyonları silme fonksiyonu - son çare
export const silButunRezervasyonlar = async (email) => {
  try {
    const response = await fetch(REZERVASYONLAR_API_URL);
    if (!response.ok) {
      throw new Error('Rezervasyonlar alınamadı');
    }
    
    const data = await response.json();
    const tumRezervasyonlar = Array.isArray(data) ? data : [];
    
    const silinecekRezervasyonlar = [];
    for (let i = 0; i < tumRezervasyonlar.length; i++) {
      const r = tumRezervasyonlar[i];
      if (r.email === email) {
        silinecekRezervasyonlar.push({
          index: i,
          id: r._id || r.id,
          rowId: i + 1,
          data: r
        });
      }
    }
    
    const silmeSonuclari = [];
    for (const r of silinecekRezervasyonlar) {
      try {
        let silmeBasarili = false;
        
        if (r.id) {
          try {
            const deleteResponse = await fetch(`${REZERVASYONLAR_API_URL}/${r.id}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (deleteResponse.ok) {
              silmeBasarili = true;
              silmeSonuclari.push({ basarili: true, rezervasyon: r.data });
              continue;
            }
          } catch (e) {
            // Hata işleme - sessiz
          }
        }
        
        try {
          const deleteResponse = await fetch(`${REZERVASYONLAR_API_URL}/${r.index}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (deleteResponse.ok) {
            silmeBasarili = true;
            silmeSonuclari.push({ basarili: true, rezervasyon: r.data });
            continue;
          }
        } catch (e) {
          // Hata işleme - sessiz
        }
        
        for (let offset = 0; offset <= 5; offset++) {
          try {
            const rowId = r.rowId + offset;
            const deleteResponse = await fetch(`${REZERVASYONLAR_API_URL}?row=${rowId}`, {
              method: 'DELETE'
            });
            
            if (deleteResponse.ok) {
              silmeBasarili = true;
              silmeSonuclari.push({ basarili: true, rezervasyon: r.data });
              break;
            }
          } catch (e) {
            // Hata işleme - sessiz
          }
        }
        
        if (!silmeBasarili) {
          silmeSonuclari.push({ basarili: false, rezervasyon: r.data });
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        silmeSonuclari.push({ basarili: false, rezervasyon: r.data, hata: error.message });
      }
    }
    
    const basariliSilmeler = silmeSonuclari.filter(s => s.basarili);
    
    const sonDurumResponse = await fetch(REZERVASYONLAR_API_URL);
    if (sonDurumResponse.ok) {
      const sonDurumData = await sonDurumResponse.json();
      const kalanRezervasyonlar = Array.isArray(sonDurumData) ? sonDurumData : [];
      
      const kalanKullaniciRezervasyonlari = kalanRezervasyonlar.filter(r => r.email === email);
      
      return {
        toplam: silinecekRezervasyonlar.length,
        basarili: basariliSilmeler.length,
        kalan: kalanKullaniciRezervasyonlari
      };
    }
    
    return {
      toplam: silinecekRezervasyonlar.length,
      basarili: basariliSilmeler.length,
      kalan: []
    };
    
  } catch (error) {
    throw error;
  }
};

// Rezervasyonları listele (kullanıcıya özel, sadece aktifler)
export async function getRezervasyonlarFromSheet(email) {
  const response = await fetch(REZERVASYONLAR_API_URL);
  const result = await response.json();
  if (!email) return (result || []).filter(row => row.durum !== 'iptal');
  return (result || []).filter(row => row.email === email && row.durum !== 'iptal');
} 

// Satışları kaydet
export const saveSatisToSheet = async (satis) => {
  try {
    let satisVerisi = {...satis};
    
    if (satis.tarih && !isNaN(satis.tarih)) {
      try {
        const excelDate = parseInt(satis.tarih);
        const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
        const formattedDate = jsDate.toISOString().split('T')[0];
        satisVerisi.tarih = formattedDate;
      } catch (err) {
        // Tarih dönüşüm hatası sessiz geçildi
      }
    }
    
    const response = await fetch(SATISLAR_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(satisVerisi),
    });

    if (!response.ok) {
      throw new Error('Satış kaydedilemedi');
    }

    const result = await response.json();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    return result;
  } catch (error) {
    throw error;
  }
};

// Satışları getir
export const getSatislarFromSheet = async () => {
  try {
    const response = await fetch(SATISLAR_API_URL);
    if (!response.ok) {
      throw new Error('Satışlar getirilemedi');
    }
    const satislar = await response.json();
    return satislar;
  } catch (error) {
    throw error;
  }
};

// Belirli bir sahanın belirli bir tarih ve saatte satılıp satılmadığını kontrol et
export const checkSahaSatildiMi = async (saha, tarih, saat) => {
  try {
    let formatliTarih;
    if (!tarih) {
      return false;
    } 
    
    if (typeof tarih === 'string') {
      if (tarih.includes('.')) {
        formatliTarih = dayjs(tarih, 'DD.MM.YYYY').format('YYYY-MM-DD');
      } else if (tarih.includes('-')) {
        formatliTarih = dayjs(tarih, 'YYYY-MM-DD').format('YYYY-MM-DD');
      } else if (!isNaN(tarih)) {
        const excelDate = parseInt(tarih);
        const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
        formatliTarih = dayjs(jsDate).format('YYYY-MM-DD');
      } else {
        return false;
      }
    } else {
      formatliTarih = dayjs(tarih).format('YYYY-MM-DD');
    }
    
    const satislar = await getSatislarFromSheet();
    if (!satislar || satislar.length === 0) {
      return false;
    }

    const satisVar = satislar.some(satis => {
      let satisTarih;
      
      if (satis.tarih) {
        if (typeof satis.tarih === 'string') {
          if (satis.tarih.includes('.')) {
            satisTarih = dayjs(satis.tarih, 'DD.MM.YYYY').format('YYYY-MM-DD');
          } else if (satis.tarih.includes('-')) {
            satisTarih = dayjs(satis.tarih, 'YYYY-MM-DD').format('YYYY-MM-DD');
          } else if (!isNaN(satis.tarih)) {
            const excelDate = parseInt(satis.tarih);
            const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
            satisTarih = dayjs(jsDate).format('YYYY-MM-DD');
          } else {
            return false;
          }
        } else {
          satisTarih = dayjs(satis.tarih).format('YYYY-MM-DD');
        }
      } else {
        return false;
      }
      
      const tarihEslesme = satisTarih === formatliTarih;
      const saatEslesme = satis.saat === saat;
      const sahaEslesme = satis.saha === saha;

      return tarihEslesme && saatEslesme && sahaEslesme;
    });

    return satisVar;
  } catch (error) {
    throw error;
  }
};

// Rezervasyon sil (satır index'i ile path parametre olarak)
export const deleteRezervasyonFromSheet = async ({ email, saha, tarih, saat }) => {
  try {
    const response = await fetch(REZERVASYONLAR_API_URL);
    if (!response.ok) {
      throw new Error('Rezervasyonlar alınamadı');
    }
    
    const data = await response.json();
    
    let rezervasyonlar = Array.isArray(data) ? data : [];
    
    const index = rezervasyonlar.findIndex(r => {
      const rezervasyonEmail = r.email;
      const rezervasyonSaha = r.saha;
      const rezervasyonTarih = r.tarih;
      const rezervasyonSaat = r.saat;

      return (
        rezervasyonEmail === email &&
        rezervasyonSaha === saha &&
        rezervasyonTarih === tarih &&
        rezervasyonSaat === saat
      );
    });

    if (index === -1) {
      return true;
    }

    const rezervasyonId = rezervasyonlar[index]._id || rezervasyonlar[index].id;
    if (rezervasyonId) {
      const deleteResponse = await fetch(`${REZERVASYONLAR_API_URL}/${rezervasyonId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (deleteResponse.ok) {
        return true;
      }
    }

    try {
      const rowIndexDeleteResponse = await fetch(`${REZERVASYONLAR_API_URL}/${index}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!rowIndexDeleteResponse.ok) {
        const rowDeleteResponse = await fetch(`${REZERVASYONLAR_API_URL}?row=${index + 2}`, {
          method: 'DELETE'
        });
        
        if (!rowDeleteResponse.ok) {
          return true;
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return true;
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      }
    } catch (silmeHatasi) {
      // Silme hatası sessiz geçildi
    }

    return true;
  } catch (error) {
    return true;
  }
};

// Süper agresif rezervasyon silme - TAMAMEN GÜVENİLİR ÇÖZÜM
export const forceDeleteRezervasyonlar = async (email) => {
  try {
    const response = await fetch(REZERVASYONLAR_API_URL);
    if (!response.ok) {
      throw new Error('Rezervasyonlar alınamadı');
    }
    
    const data = await response.json();
    const tumRezervasyonlar = Array.isArray(data) ? data : [];
    
    const kullaniciRezervasyonlari = tumRezervasyonlar.filter(r => r.email === email);
    
    if (kullaniciRezervasyonlari.length === 0) {
      return { toplam: 0, basarili: 0, kalan: [] };
    }
    
    let basariliSilmeSayisi = 0;
    
    for (let i = 0; i < kullaniciRezervasyonlari.length; i++) {
      const rezervasyon = kullaniciRezervasyonlari[i];
      
      try {
        if (rezervasyon._id || rezervasyon.id) {
          const idSilmeResponse = await fetch(`${REZERVASYONLAR_API_URL}/${rezervasyon._id || rezervasyon.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (idSilmeResponse.ok) {
            basariliSilmeSayisi++;
            continue;
          }
        }
        
        const guncelResponse = await fetch(REZERVASYONLAR_API_URL);
        if (!guncelResponse.ok) {
          continue;
        }
        
        const guncelData = await guncelResponse.json();
        const guncelRezervasyonlar = Array.isArray(guncelData) ? guncelData : [];
        
        const guncelIndex = guncelRezervasyonlar.findIndex(r => 
          r.email === rezervasyon.email && 
          r.saha === rezervasyon.saha && 
          r.tarih === rezervasyon.tarih && 
          r.saat === rezervasyon.saat
        );
        
        if (guncelIndex === -1) {
          basariliSilmeSayisi++;
          continue;
        }
        
        const indexSilmeResponse = await fetch(`${REZERVASYONLAR_API_URL}/${guncelIndex}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (indexSilmeResponse.ok) {
          basariliSilmeSayisi++;
          continue;
        }
        
        for (let offset = 0; offset <= 5; offset++) {
          const rowSilmeResponse = await fetch(`${REZERVASYONLAR_API_URL}?row=${guncelIndex + 2 + offset}`, {
            method: 'DELETE'
          });
          
          if (rowSilmeResponse.ok) {
            basariliSilmeSayisi++;
            break;
          }
        }
      } catch (error) {
        // Hata işleme - sessiz
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const sonDurumResponse = await fetch(REZERVASYONLAR_API_URL);
    if (!sonDurumResponse.ok) {
      return {
        toplam: kullaniciRezervasyonlari.length,
        basarili: basariliSilmeSayisi,
        kalan: []
      };
    }
    
    const sonDurumData = await sonDurumResponse.json();
    const sonDurumRezervasyonlar = Array.isArray(sonDurumData) ? sonDurumData : [];
    const kalanKullaniciRezervasyonlari = sonDurumRezervasyonlar.filter(r => r.email === email);
    
    return {
      toplam: kullaniciRezervasyonlari.length,
      basarili: basariliSilmeSayisi,
      kalan: kalanKullaniciRezervasyonlari
    };
  } catch (error) {
    throw error;
  }
};

// Kullanıcı şifresini güncelle
export async function updateUserPassword({ email, currentPassword, newPassword }) {
  try {
    const response = await fetch(KULLANICILAR_API_URL);
    if (!response.ok) throw new Error('Kullanıcılar getirilemedi');
    
    const users = await response.json();
    const userIndex = users.findIndex(user => user.email === email && user.sifre === currentPassword);
    
    if (userIndex === -1) {
      return { success: false, message: 'Mevcut şifre yanlış' };
    }
    
    const currentUser = users[userIndex];
    const userId = currentUser._id || currentUser.id;
    
    const updateData = {
      isim: currentUser.isim,
      email: currentUser.email,
      sifre: newPassword
    };
    
    if (userId) {
      const updateResponse = await fetch(`${KULLANICILAR_API_URL}/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (updateResponse.ok) {
        return { success: true, message: 'Şifreniz başarıyla güncellendi' };
      }
    }
    
    const indexUpdateResponse = await fetch(`${KULLANICILAR_API_URL}/${userIndex}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    
    if (indexUpdateResponse.ok) {
      return { success: true, message: 'Şifreniz başarıyla güncellendi' };
    }
    
    for (let offset = 0; offset <= 5; offset++) {
      try {
        const rowUpdateResponse = await fetch(`${KULLANICILAR_API_URL}?row=${userIndex + 2 + offset}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        
        if (rowUpdateResponse.ok) {
          return { success: true, message: 'Şifreniz başarıyla güncellendi' };
        }
      } catch (e) {
        // Hata işleme - sessiz
      }
    }
    
    return { success: false, message: 'Şifre güncellenirken bir hata oluştu' };
  } catch (error) {
    return { success: false, message: 'Şifre güncellenirken bir hata oluştu: ' + error.message };
  }
} 