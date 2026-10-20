# TaskFlow - Veri Modeli

Bu şema uygulanan tasarım kararıdır. Yönerge tam bir görev şeması, alan zorunlulukları veya veritabanı seçimi tanımlamaz. Görev atama, durum ve öncelik ihtiyacı s.3'te; bazı alan adları s.8-9'daki isteğe bağlı örneklerde yer alır.

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

Desteklenen durumlar: `pending`, `in_progress`, `completed`.

Desteklenen öncelikler: `low`, `medium`, `high`.

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

## Uygulanan veri kuralları

- `title`, `description` ve metin `assignee` değerlerinin başındaki ve sonundaki boşluklar temizlenir.
- `title` uzunluğu 1-200, `description` uzunluğu 0-5000, metin `assignee` uzunluğu 1-100 olmalıdır. Uzunluk JavaScript metin uzunluğuyla ölçülür. Atamasız görevde `assignee: null` kullanılır.
- `status` ve `priority` yalnız listelenen değerleri alır. Durum geçişlerini sınırlayan ayrı bir iş akışı yoktur.
- İstemci `id`, `createdAt` ve `updatedAt` alanlarını belirleyemez. Bunlar ve bilinmeyen alanlar istek gövdesinde verilirse `400` döner.
- `PATCH` yalnız gönderilen düzenlenebilir alanları değiştirir. Boş güncelleme gövdesi reddedilir; gönderilmeyen alanlar korunur.
- Kimlik sunucuda UUID v4 olarak üretilir. HTTP ve saklama doğrulaması UUID sürüm/variant bitlerini denetler; kimlikler küçük harfle döner. Büyük harfle gönderilen geçerli UUID aynı kaydı bulur.
- Çalışan tanımlayıcısı bir metindir. Kullanıcı tablosu, kayıt süreci veya referans bütünlüğü bu modelin parçası değildir. Çalışan bazlı listeleme harf duyarlı tam eşleşme kullanır.

Bu kurallar PDF'nin zorunlu alan listesi değildir. Ayrı validation middleware isteğe bağlı bir geliştirmedir (s.9) ve bu sürüme dahil edilmiştir.

## Kalıcılık

Görevler varsayılan olarak `data/tasks.json` dosyasında JSON dizisi olarak saklanır. `DATA_FILE` ortam değişkeni farklı bir yol seçebilir. Veriye erişim repository modülünden yapılır; router ve controller doğrudan dosya yazmaz.

Yeni kurulumda dosyanın bulunmaması boş başlangıç verisidir; ilk başarılı oluşturmada dizin ve dosya yazılır. Başlangıçta mevcut veri okunur; geçersizse sunucu dinlemeye başlamaz. Çalışma sırasındaki okuma/yazma hatası API'de ayrıntıları gizlenen `500` yanıtı üretir. Veri sessizce boşaltılmaz.

Her okuma diskten yapılır. Dosyanın JSON dizisi olması, kayıtların tam alan seti ve türleri, metin sınırları, durum/öncelik değerleri, UUID'ler, benzersiz kimlikler ve kanonik UTC tarihleri denetlenir. Dosyadaki büyük harfli UUID'ler okuma sırasında küçük harfe normalleştirilir; yalnız okuma diski değiştirmez.

Aynı dosya yolu için tüm işlemler tek süreç içinde ortak sıraya alınır. Yazma geçici dosya, dosya senkronizasyonu ve yeniden adlandırmayla tamamlanır; yanıt başarılı yazmadan sonra döner. Başarısız işlemden sonra kuyruk çalışmaya devam eder. Bu yaklaşım güç kesintilerine karşı tam bir veritabanı dayanıklılığı garantisi vermez.

Çalışma sırasında oluşan görev verisi ve yerel deneme verileri Git'e alınmaz. Saklama küçük, tek süreçli uygulama içindir; çok süreçli eşzamanlı kullanım için yeterli değildir.
