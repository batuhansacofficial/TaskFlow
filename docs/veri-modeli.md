# TaskFlow - Veri Modeli

Bu schema, uygulanan tasarım kararıdır. Yönerge tam bir task schema, alan zorunlulukları veya database seçimi tanımlamaz. Görev atama, durum ve öncelik ihtiyacı s.3'te; bazı alan adları s.8-9'daki isteğe bağlı örneklerde yer alır.

## Task

| Alan | Tür | Oluşturma davranışı | Güncelleme davranışı |
| --- | --- | --- | --- |
| `id` | UUID string | Server üretir | Değiştirilemez |
| `title` | string | Boş olmayan değer gerekir | Gönderilmişse boş olamaz |
| `description` | string | Gönderilmezse `""` | Gönderilmişse değiştirilir |
| `status` | string | Gönderilmezse `pending` | Desteklenen durumlarla değiştirilir |
| `priority` | string | Gönderilmezse `medium` | Desteklenen önceliklerle değiştirilir |
| `assignee` | string veya `null` | Gönderilmezse `null` | Metin atama yapar; `null` atamayı kaldırır |
| `createdAt` | ISO 8601 UTC date string | Server üretir | Değiştirilemez |
| `updatedAt` | ISO 8601 UTC date string | Başlangıçta `createdAt` ile aynı | Başarılı güncellemede server yeniler |

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
- `title` uzunluğu 1-200, `description` uzunluğu 0-5000, metin `assignee` uzunluğu 1-100 olmalıdır. Uzunluk JavaScript string length değeriyle ölçülür. Atamasız görevde `assignee: null` kullanılır.
- `status` ve `priority` yalnız listelenen değerleri alır. Durum geçişlerini sınırlayan ayrı bir iş akışı yoktur.
- Client `id`, `createdAt` ve `updatedAt` alanlarını belirleyemez. Bunlar ve bilinmeyen alanlar request body içinde verilirse `400` döner.
- `PATCH` yalnız gönderilen düzenlenebilir alanları değiştirir. Boş güncelleme request body reddedilir; gönderilmeyen alanlar korunur.
- Kimlik server tarafından UUID v4 olarak üretilir. HTTP ve persistence validation işlemleri UUID sürüm ve variant bitlerini denetler; kimlikler küçük harfle döner. Büyük harfle gönderilen geçerli UUID aynı kaydı bulur.
- Çalışan tanımlayıcısı bir metindir. Kullanıcı tablosu, kayıt süreci veya referans bütünlüğü bu modelin parçası değildir. Çalışan bazlı listeleme case-sensitive tam eşleşme kullanır.

Bu kurallar PDF'nin zorunlu alan listesi değildir. Ayrı validation middleware isteğe bağlı bir geliştirmedir (s.9) ve bu sürüme dahil edilmiştir.

## Persistence

Görevler varsayılan olarak `data/tasks.json` dosyasında JSON array olarak saklanır. `DATA_FILE` environment variable ile farklı bir yol seçilebilir. Veriye erişim repository modülünden yapılır; router ve controller doğrudan dosya yazmaz.

Yeni kurulumda dosyanın bulunmaması boş başlangıç verisidir; ilk başarılı oluşturmada dizin ve dosya yazılır. Başlangıçta mevcut veri okunur; geçersizse server dinlemeye başlamaz. Çalışma sırasındaki okuma/yazma hatasında API, ayrıntıları gizleyen bir `500` response üretir. Veri sessizce boşaltılmaz.

Her okuma diskten yapılır. Dosyanın JSON array biçiminde olması, kayıtların tam alan seti ve türleri, metin sınırları, durum/öncelik değerleri, UUID'ler, benzersiz kimlikler ve kanonik UTC tarihleri denetlenir. Dosyadaki büyük harfli UUID'ler okuma sırasında küçük harfe normalleştirilir; yalnız okuma diski değiştirmez.

Aynı dosya yolu için tüm işlemler tek process içinde ortak sıraya alınır. Yazma geçici dosya, file sync ve rename işlemiyle tamamlanır; response başarılı yazmadan sonra döner. Başarısız işlemden sonra kuyruk çalışmaya devam eder. Bu yaklaşım güç kesintilerine karşı tam bir database dayanıklılığı garantisi vermez.

Çalışma sırasında oluşan görev verisi ve yerel deneme verileri Git'e alınmaz. Saklama küçük, single-process uygulama içindir; multi-process concurrent kullanım için yeterli değildir.
