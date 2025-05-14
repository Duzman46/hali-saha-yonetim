export const clearCart = async (cart) => {
  try {
    // Sepetteki rezervasyonların index'lerini azalan sırada sırala
    const sortedIndexes = cart
      .map(item => item.index)
      .sort((a, b) => b - a);

    // Her bir rezervasyonu sırayla sil
    for (const index of sortedIndexes) {
      try {
        const response = await fetch(`${SHEETBEST_URL}/${index}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Silme işlemi başarısız: ${response.status}`);
        }
      } catch (error) {
        throw error; // Hata durumunda işlemi durdur
      }
    }

    // Tüm silme işlemleri başarılı olduysa sepeti temizle
    setCart([]);
  } catch (error) {
    throw error;
  }
}; 