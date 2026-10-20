# TaskFlow - Proje Analizi

Analiz tarihi: 20 Ekim 2026.

## Kaynak ve yorum yöntemi

Kaynak: **Backend Geliştirme Proje Yönergesi.1.pdf**, 15 sayfa. Sayfa numaraları PDF'nin ilk kapak sayfası 1 kabul edilerek verilmiştir.

Kaynak SHA-256: `d8fd5e9c5f9128cae5c6666f54c00562a41fe0042152f34566ad39a8fc540262`.

Bu belgede **yönerge gereksinimi**, PDF'nin açıkça istediği sonucu; **tasarım önerisi**, yönergede belirlenmemiş bir konu için önerilen çözümü ifade eder. Öneriler henüz uygulanmış veya test edilmiş özellikler değildir.

Mevcut çalışma yalnız analiz, tasarım belgeleri ve yerel Git başlangıcını kapsar. PDF'deki ileriki geliştirme ve public GitHub teslim adımları bu aşamada tamamlanmış sayılmaz.

## Amaç ve kapsam

Bir yazılım ekibinin görevlerini oluşturması, çalışanlara ataması, durumunu izlemesi ve önceliklendirmesi için REST API geliştirilmesi istenir (s.2-3). Temel teknoloji Node.js ve Express.js'dir (s.5).

Belgenin başlığında proje yönetimi geçmesine rağmen ayrı `Project` veya `User` CRUD modülü tarif edilmez. Çalışan ataması görev üzerindeki `assignee` alanıyla karşılanabilir. Kullanıcı kaydı, oturum açma, roller, frontend, veritabanı sunucusu, Docker ve bulut yayını yönergede zorunlu tutulmamıştır. Bunlar mevcut tasarımın kapsamına eklenmemiştir.

## Zorunlu gereksinimler

| Kimlik | Gereksinim | Kaynak | Planlanan karşılık / kabul ölçütü |
| --- | --- | --- | --- |
| Z01 | Amaç ve senaryo analizi | s.5 | Kısa proje tanıtımı ve bu kapsam analizi |
| Z02 | Veri modeli ve API tasarımı | s.5 | Görev alanları, endpoint listesi ve HTTP davranışları için tasarım belgeleri |
| Z03 | Node.js, Express.js ve routing altyapısı | s.5 | Çalışan backend, düzenli klasör yapısı ve görev router'ı |
| Z04 | Görev ekleme | s.6 | Geçerli istek yeni görev oluşturur; görev daha sonra okunabilir |
| Z05 | Görev listeleme | s.6 | Kayıtlı görevler görüntülenir; boş liste başarıyla döner |
| Z06 | Görev detayı | s.6 | Kimliği verilen görev görüntülenir |
| Z07 | Görev güncelleme | s.3, 6 | Görev bilgileri, atanan kişi, durum ve öncelik değiştirilebilir |
| Z08 | Görev silme | s.6 | Görev kaldırılır ve sonraki sorguda bulunamaz |
| Z09 | Logger middleware | s.6 | Tüm API isteklerinde HTTP metodu, endpoint ve zaman damgası konsola veya dosyaya yazılır |
| Z10 | Gerçek Postman testleri | s.7, 12 | Ekleme, listeleme, detay, güncelleme ve silme için başarılı istek/yanıt ekran görüntüleri |
| Z11 | Temel teslim belgeleri ve kaynak kod | s.7, 12 | 1-2 sayfalık tanıtım, çalıştırma README'si, test görüntüleri, kaynaklar ve `package.json` |
| Z12 | Tek public GitHub deposu | s.14 | Nihai kaynak ve belgelerin aynı public depoda teslim edilmesi |

S.5'teki veri modeli ve API tasarım çıktıları, s.11'de isteğe bağlı sunulan kapsamlı dokümantasyonla aynı şey değildir. Temel tasarım belgeleri şimdi hazırlanır; her endpoint'in ayrıntılı örnekleri ve entegrasyon kılavuzu daha sonra genişletilebilir.

## İsteğe bağlı kapsamın değerlendirilmesi

İsteğe bağlı başlıkların tümü değerlendirme planındadır. Yönerge bunların teslim ve değerlendirmeye dahil olmadığını açıkça belirtir (s.4, 8-11, 15). Aşağıdaki sıra teknik bağımlılıklara göre önerilmiştir; süre ve doğrulama yükü temel teslimi etkilerse ilgili genişletme ertelenebilir.

| Sıra | Başlık | Kaynak | Beklenen yarar | Ek yük ve dikkat edilecek konu |
| --- | --- | --- | --- | --- |
| 1 | Validation middleware | s.9 | Geçersiz veya eksik verinin açıklayıcı `400` yanıtıyla reddedilmesi | Düşük-orta; alan zorunlulukları, enum'lar ve kısmi güncelleme kuralları netleşmeli |
| 2 | Durum ve öncelik filtreleri | s.8 | Görev listesinin daraltılması | Düşük; birlikte verilen filtrelerin kesişimi ve geçersiz değerler tanımlanmalı |
| 3 | Arama ve kullanıcı bazlı listeleme | s.8 | Açıklama/başlık veya atanan kişi üzerinden erişim | Düşük-orta; arama kapsamı, harf duyarlılığı ve route sırası belirlenmeli |
| 4 | Sıralama ve sayfalama | s.8 | Düzenli ve sınırlanabilir liste yanıtları | Orta; eşit değerlerde kararlı sıra, limit üst sınırı ve boş sayfa davranışı gerekir |
| 5 | Tamamlanan/bekleyen görev raporları ve genel özet | s.10 | Görev durumlarının sayısal özeti | Düşük-orta; bekleyen görev tanımı ve toplamların tutarlılığı gerekir |
| 6 | Ayrıntılı API, test ve kullanım belgeleri | s.11 | API kullanımının ve testlerin tekrarlanması | Orta; örnekler son çalışan uygulamayla karşılaştırılmalı |

Genişletmeler ayrı kullanıcı veya proje yönetimi modülleri gerektirmez. Arama, filtreleme, sayfalama ve sıralama aynı listeleme mantığını paylaşmalıdır. Raporlar aynı görev deposunu kullanmalıdır.

## Belirsizlikler ve önerilen kararlar

| Konu | PDF'nin belirlediği | Tasarım önerisi |
| --- | --- | --- |
| Görev şeması | s.9'da `title`, `description`, `priority`, `assignee`; s.8'de `status`, `createdAt` örnekleri var; tam şema yok | `id`, `title`, `description`, `status`, `priority`, `assignee`, `createdAt`, `updatedAt` |
| Kimlik | Türü belirtilmiyor | Sunucuda üretilen UUID metni |
| Durumlar | `completed` ve `pending` örneklerde geçiyor; tam liste yok | `pending`, `in_progress`, `completed` |
| Öncelikler | `high` örneği var; tam liste yok | `low`, `medium`, `high` |
| Atanan kişi | Kullanıcı kimlik sistemi tanımlanmıyor | Serbest metin çalışan tanımlayıcısı; atama yoksa `null` |
| Alan zorunluluğu | Temel CRUD için kesin kurallar yok | Oluşturmada boş olmayan `title`; diğer alanlarda belirlenmiş varsayılanlar |
| Veri saklama | Veritabanı veya kalıcılık şartı yok | Tek süreçli ilk sürümde JSON dosyası ve ayrı repository modülü |
| Güncelleme metodu | PUT/PATCH belirtilmiyor | Kısmi güncelleme için `PATCH /tasks/:id` |
| Yanıt/hata biçimi | Temel CRUD için kesin şema yok | Başarılarda `data`, hatalarda `error` zarfı; silmede gövdesiz `204` |
| Çalışma ortamı | Node.js ve Express.js belirtiliyor; sürüm yok | Geliştirme başlangıcında desteklenen sürümlerin doğrulanması ve sabitlenmesi |

Alan türleri ve API sözleşmeleri [veri modeli](veri-modeli.md) ve [API tasarımı](api-tasarimi.md) belgelerinde ayrıntılandırılmıştır. Bu öneriler öğretim elemanının ayrıca verdiği kurallarla çelişirse yeniden değerlendirilmelidir.

## Mimari önerisi

HTTP istekleri logger, JSON gövde ayrıştırma, görev router'ı, controller ve repository sırasını izler. Bulunamayan route ve beklenmeyen hata yanıtları merkezi olarak ele alınır. Validation seçildiğinde controller öncesine eklenir. Logger, başarısız ayrıştırma veya bulunamayan endpoint isteklerini de görebilmesi için en başta yer alır.

Planlanan kaynak düzeni:

```text
src/
  app.js
  server.js
  routes/tasks.routes.js
  controllers/tasks.controller.js
  repositories/tasks.repository.js
  middleware/request-logger.js
data/
docs/
```

Bu ağaç öneridir; kaynak dosyaları henüz oluşturulmamıştır. Rapor router/controller'ı ve validation middleware yalnız ilgili genişletmeler uygulanırken eklenir. İlk sürüm için ayrı bir servis katmanı gerekli görünmemektedir.

## Veri saklama riski

Bellek içi dizi kolaydır fakat yeniden başlatmada veriyi kaybeder. JSON dosyası önerisi bu kaybı önler; eşzamanlı yazma ve bozuk dosya risklerini ayrıca ele almak gerekir. Tek süreçte yazmalar sıraya alınmalı ve dosya güvenli biçimde değiştirilmelidir. Okuma hatasında mevcut verinin üzerine boş liste yazılmamalıdır. Çok süreçli çalışma veya yoğun veri ihtiyacı doğarsa saklama kararı tekrar ele alınmalıdır.

Bu, yönergenin zorunlu tuttuğu bir veritabanı mimarisi değildir; küçük eğitim projesi için başlangıç önerisidir.

## Uygulama ve doğrulama sırası

1. Veri modeli ve API sözleşmesi taslağını uygulama öncesi kesinleştirme.
2. Node.js/Express altyapısı, görev routing'i ve logger oluşturma.
3. Beş CRUD işlemi ile atama, durum ve öncelik güncellemelerini tamamlama.
4. Temel CRUD akışını Postman'de çalıştırma ve gerçek ekran görüntülerini kaydetme.
5. Validation, liste genişletmeleri ve raporlamayı sırayla değerlendirme; her eklemeden sonra temel CRUD akışını yeniden doğrulama.
6. README'yi çalışan komutlarla tamamlama; uygun görülürse ayrıntılı API/test/kullanım belgelerini genişletme.
7. Son içerik ve teslim kontrolünün ardından tek public GitHub deposunda teslim.

Yönergedeki "5 günlük eğitim kapsamı" bir kapsam tanımıdır; burada takvim veya teslim tarihi varsayılmamıştır.

## Planlanan test kanıtları

| İşlem | Beklenen gözlem | Planlanan ekran görüntüsü |
| --- | --- | --- |
| Ekleme | Yeni kimlik ve gönderilen görev alanları | `docs/test-kanitlari/01-gorev-ekleme.png` |
| Listeleme | Oluşturulan görevin listede bulunması | `docs/test-kanitlari/02-gorev-listeleme.png` |
| Detay | Aynı kimlikteki görevin dönmesi | `docs/test-kanitlari/03-gorev-detayi.png` |
| Güncelleme | Değiştirilen alanların okunabilmesi | `docs/test-kanitlari/04-gorev-guncelleme.png` |
| Silme | Silme yanıtı ve sonrasında kaydın bulunamaması | `docs/test-kanitlari/05-gorev-silme.png`; gerekirse ek doğrulama görüntüsü |

Bu yollar gelecekte üretilecek kanıtlar içindir; henüz test veya ekran görüntüsü yoktur. Postman koleksiyonu veya otomatik test eklenmesi, yönergedeki gerçek ekran görüntülerinin yerine geçmez.

Ek kontroller: bulunamayan görev, bozuk JSON, logger'ın üç zorunlu alanı ve JSON saklama seçilirse yeniden başlatma sonrası veri. Genişletmeler uygulanırsa geçersiz alanlar, birleşik filtreler, boş arama sonucu, sayfa sınırları, kararlı sıralama ve rapor toplamları ayrıca sınanır.

## Puanlama ve teslim kontrolü

| Kriter | Puan |
| --- | ---: |
| CRUD işlemleri | 30 |
| Routing yapısı | 15 |
| Temel middleware / logger | 15 |
| Kod kalitesi | 15 |
| Temel dokümantasyon | 15 |
| Postman test süreçleri | 10 |
| **Toplam** | **100** |

Kaynak: s.13. İsteğe bağlı işlerin ayrıca puan kazandırdığına dair bilgi yoktur.

- [x] Gereksinimler ve kaynak sayfaları incelendi.
- [x] Proje tanıtımı, veri modeli ve API taslağı hazırlandı.
- [ ] Çalışan backend ve `package.json` oluşturuldu.
- [ ] Beş CRUD işlemi ve logger gerçek ortamda doğrulandı.
- [ ] Gerçek Postman ekran görüntüleri eklendi.
- [ ] README kurulum ve çalıştırma adımları doğrulandı.
- [ ] İsteğe bağlı geliştirmelerin son kapsamı ve testleri kaydedildi.
- [ ] Kaynak ve teslim belgeleri tek public GitHub deposunda yayımlandı.
