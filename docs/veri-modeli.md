# TaskFlow - Veri Modeli Taslağı

Bu şema bir tasarım önerisidir. Yönerge tam bir görev şeması, alan zorunlulukları veya veritabanı seçimi tanımlamaz. Görev atama, durum ve öncelik ihtiyacı s.3'te; bazı alan adları s.8-9'daki isteğe bağlı örneklerde yer alır.

## Task

| Alan | Tür | Oluşturma davranışı | Güncelleme davranışı |
| --- | --- | --- | --- |
| `id` | UUID metni | Sunucu üretir | Değiştirilemez |
| `title` | Metin | Boş olmayan değer gerekir | Gönderilmişse boş olamaz |
| `description` | Metin | Gönderilmezse `""` | Gönderilmişse değiştirilir |
| `status` | Metin | Gönderilmezse `pending` | Desteklenen durumlarla değiştirilir |
| `priority` | Metin | Gönderilmezse `medium` | Desteklenen önceliklerle değiştirilir |
| `assignee` | Metin veya `null` | Gönderilmezse `null` | Metin atama yapar; `null` atamayı kaldırır |
| `createdAt` | ISO 8601 UTC tarih metni | Sunucu üretir | Değiştirilemez |
| `updatedAt` | ISO 8601 UTC tarih metni | Başlangıçta `createdAt` ile aynı | Başarılı güncellemede sunucu yeniler |

Önerilen durumlar: `pending`, `in_progress`, `completed`.

Önerilen öncelikler: `low`, `medium`, `high`.

Örnek kayıt:

```json
{
  "id": "36b735af-c102-4a93-9d8c-b6e7c0860642",
  "title": "Görev API'sini geliştirme",
  "description": "Temel görev endpoint'lerini hazırlama",
  "status": "pending",
  "priority": "high",
  "assignee": "musa",
  "createdAt": "2026-10-20T09:00:00.000Z",
  "updatedAt": "2026-10-20T09:00:00.000Z"
}
```

Bu kayıt örnektir; gerçek kullanıcı veya sistem kaydı değildir.

## Önerilen veri kuralları

- `title`, `description` ve metin `assignee` değerlerinin başındaki ve sonundaki boşluklar temizlenir.
- `title` uzunluğu 1-200 karakter, `description` en fazla 5000 karakter, metin `assignee` uzunluğu 1-100 karakter olarak önerilir. Atamasız görevde `assignee: null` kullanılır.
- `status` ve `priority` yalnız listelenen değerleri alır. Durum geçişlerini sınırlayan ayrı bir iş akışı önerilmemiştir.
- İstemci `id`, `createdAt` ve `updatedAt` alanlarını belirleyemez. Bunlar ve bilinmeyen alanlar istek gövdesinde verilirse `400` dönmesi önerilir.
- `PATCH` yalnız gönderilen düzenlenebilir alanları değiştirir. Boş güncelleme gövdesi reddedilir; gönderilmeyen alanlar korunur.
- Çalışan tanımlayıcısı bir metindir. Kullanıcı tablosu, kayıt süreci veya referans bütünlüğü bu modelin parçası değildir.

Bu kurallar PDF'nin zorunlu alan listesi olarak yorumlanmamalıdır. Ayrı validation middleware isteğe bağlı bir geliştirmedir (s.9). Temel veri sözleşmesi ile bu sözleşmeyi denetleyen middleware'in uygulanması ayrı konulardır.

## Kalıcılık önerisi

Görevler ilk sürümde `data/tasks.json` dosyasında bir JSON dizisi olarak saklanabilir. Veriye erişim repository modülünden yapılır; router ve controller doğrudan dosya yazmaz.

Yeni kurulumda dosyanın bulunmaması boş başlangıç verisi olarak ele alınabilir. Mevcut dosyanın okunamaması veya bozuk olması açık hata üretmeli; veri sessizce boşaltılmamalıdır. Yazmalar tek süreç içinde sıraya alınmalı ve geçici dosya üzerinden güvenli değiştirme yapılmalıdır. Yanıt ancak başarılı kalıcı yazma sonrasında dönmelidir.

Çalışma sırasında oluşan görev verisi Git'e alınmaz. Örnek veri gerekirse gerçek çalışma dosyasından ayrı tutulur. Bu saklama önerisi küçük, tek süreçli uygulama içindir; çok süreçli eşzamanlı kullanım için yeterli olduğu varsayılmaz.
