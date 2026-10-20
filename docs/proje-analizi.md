# TaskFlow - Proje Analizi

Analiz tarihi: 20 Ekim 2026.

## Kaynak ve yorum yöntemi

Kaynak: **Backend Geliştirme Proje Yönergesi.1.pdf**, 15 sayfa. Sayfa numaraları PDF'nin ilk kapak sayfası 1 kabul edilerek verilmiştir.

Kaynak SHA-256: `d8fd5e9c5f9128cae5c6666f54c00562a41fe0042152f34566ad39a8fc540262`.

Bu belgede **yönerge gereksinimi**, PDF'nin açıkça istediği sonucu; **tasarım kararı**, yönergede belirlenmemiş bir konu için seçilen çözümü ifade eder. İlk analizde önerilen teknik kararlar uygulanmıştır; kaynak gereksinimlerle karıştırılmaması için ayrım korunmuştur.

Yerel API; zorunlu CRUD, routing ve logger ile isteğe bağlı doğrulama, filtreleme, arama, çalışan listeleri, sayfalama, sıralama ve raporlamayı içerir. Otomatik HTTP/repository testleri ve Postman koleksiyonu vardır. Gerçek Postman web arayüzünde temel CRUD akışı doğrulanmış, altı ekran görüntüsü eklenmiştir. Public GitHub teslimi açık durumdadır.

## Amaç ve kapsam

Bir yazılım ekibinin görevlerini oluşturması, çalışanlara ataması, durumunu izlemesi ve önceliklendirmesi için REST API geliştirilmesi istenir (s.2-3). Temel teknoloji Node.js ve Express.js'dir (s.5).

Belgenin başlığında proje yönetimi geçmesine rağmen ayrı `Project` veya `User` CRUD modülü tarif edilmez. Çalışan ataması görev üzerindeki `assignee` alanıyla karşılanabilir. Kullanıcı kaydı, oturum açma, roller, frontend, veritabanı sunucusu, Docker ve bulut yayını yönergede zorunlu tutulmamıştır. Bunlar mevcut tasarımın kapsamına eklenmemiştir.

## Zorunlu gereksinimler

| Kimlik | Gereksinim | Kaynak | Karşılık / kabul durumu |
| --- | --- | --- | --- |
| Z01 | Amaç ve senaryo analizi | s.5 | [Proje tanıtımı](proje-tanitimi.md) ve bu analiz hazır |
| Z02 | Veri modeli ve API tasarımı | s.5 | [Veri modeli](veri-modeli.md), [API tasarımı](api-tasarimi.md) ve [API örnekleri](api.md) hazır |
| Z03 | Node.js, Express.js ve routing altyapısı | s.5 | Node.js 24.x / Express 5.3.0 uygulaması ve görev router'ı var |
| Z04 | Görev ekleme | s.6 | `POST /tasks` kalıcı kayıt oluşturur; otomatik HTTP testi var |
| Z05 | Görev listeleme | s.6 | `GET /tasks` kayıtları ve boş listeyi döndürür; otomatik HTTP testi var |
| Z06 | Görev detayı | s.6 | `GET /tasks/:id` doğru kaydı döndürür; otomatik HTTP testi var |
| Z07 | Görev güncelleme | s.3, 6 | `PATCH /tasks/:id` bilgileri, atamayı, durumu ve önceliği değiştirir; otomatik HTTP testi var |
| Z08 | Görev silme | s.6 | `DELETE /tasks/:id` sonrasında kayıt bulunamaz; otomatik HTTP testi var |
| Z09 | Logger middleware | s.6 | Metot, endpoint ve UTC zaman damgası konsola yazılır; hata istekleri de test edilir |
| Z10 | Gerçek Postman testleri | s.7, 12 | Temel CRUD ve silme sonrası kontrolün [altı gerçek ekran görüntüsü](test-kanitlari/README.md) eklendi |
| Z11 | Temel teslim belgeleri ve kaynak kod | s.7, 12 | Tanıtım, README, kaynaklar, `package.json` ve gerçek test görüntüleri hazır |
| Z12 | Tek public GitHub deposu | s.14 | **Açık:** yerel Git deposu var; public uzak depo henüz oluşturulmadı |

S.5'teki veri modeli ve API tasarım çıktıları, s.11'de isteğe bağlı sunulan kapsamlı dokümantasyonla aynı şey değildir. Temel tasarım belgelerine ek olarak ayrıntılı endpoint örnekleri, test planı ve kullanım kılavuzu hazırlanmıştır.

## İsteğe bağlı kapsamın değerlendirilmesi

Yönerge bu başlıkların teslim ve değerlendirmeye dahil olmadığını açıkça belirtir (s.4, 8-11, 15). Zorunlu API davranışlarının ardından aşağıdaki genişletmeler uygulanmıştır. Gerçek Postman CRUD kanıtları tamamlanmıştır; public depo teslimi açık kalır.

| Sıra | Başlık | Kaynak | Uygulanan karşılık | Doğrulama odağı |
| --- | --- | --- | --- | --- |
| 1 | Validation middleware | s.9 | Alan türü/sınırı, enum, UUID, JSON ve kısmi güncelleme denetimleri | Geçersiz isteğin veri değiştirmemesi ve Türkçe hata ayrıntıları |
| 2 | Durum ve öncelik filtreleri | s.8 | `/tasks?status=completed&priority=high` | Filtre kesişimi, boş sonuç ve geçersiz değerler |
| 3 | Arama ve kullanıcı bazlı listeleme | s.8 | `/tasks/search` ve `/tasks/assignee/:assignee` | Türkçe harf dönüşümü, başlık/açıklama araması, tam çalışan eşleşmesi |
| 4 | Sıralama ve sayfalama | s.8 | Dört sıralama alanı, 1-100 limit, filtre sonrası sayfalama | Kimlikle kararlı eşitlik, sayfa sınırları ve toplam |
| 5 | Tamamlanan/bekleyen görev raporları ve genel özet | s.10 | `/reports/completed`, `/reports/pending`, `/reports/summary` | `pending` tanımı ve dağılım toplamının korunması |
| 6 | Ayrıntılı API, test ve kullanım belgeleri | s.11 | [API](api.md), [test planı](test-plani.md), [kullanım kılavuzu](kullanim-kilavuzu.md) | Çalışan sözleşme ve tekrarlanabilir örnekler |

Genişletmeler ayrı kullanıcı veya proje yönetimi modülleri gerektirmez. Arama, filtreleme, sayfalama ve sıralama aynı listeleme mantığını paylaşır. Raporlar aynı görev deposunu kullanır.

## Yönergede belirlenmeyen ayrıntılar ve uygulanan kararlar

| Konu | PDF'nin belirlediği | Uygulanan tasarım kararı |
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
| Çalışma ortamı | Node.js ve Express.js belirtiliyor; sürüm yok | Node.js 24.x; doğrulanan Node 24.21.0/npm 12.2.0, sabit Express 5.3.0 |

Alan türleri ve HTTP sözleşmesi [veri modeli](veri-modeli.md) ve [API tasarımında](api-tasarimi.md) ayrıntılıdır. Öğretim elemanının ayrıca verdiği kurallarla çelişen bir karar olursa yeniden değerlendirilmelidir.

## Uygulanan mimari

HTTP istekleri logger, isteğe bağlı CORS, JSON gövde ayrıştırma, router, doğrulama, controller ve repository sırasını izler. Bulunamayan route ve beklenmeyen hata yanıtları merkezi olarak ele alınır. Logger, başarısız ayrıştırma ve bulunamayan endpoint isteklerini de görebilmesi için en başta yer alır. Rapor yolları aynı repository'den okur.

Kaynak düzeni:

```text
src/
  app.js
  server.js
  routes/
    tasks.routes.js
    reports.routes.js
  controllers/tasks.controller.js
  repositories/tasks.repository.js
  middleware/
  lib/
data/
docs/
postman/
test/
scripts/
```

`middleware/` istek, gövde ve query denetimlerini; `lib/` ortak şema, hata ve liste seçimini içerir. Ayrı servis katmanı bulunmaz. Sağlık kontrolü `/health` yolundadır.

## Veri saklama riski

JSON dosyası normal yeniden başlatmalarda veriyi korur. Aynı dosyanın işlemleri tek süreçte ortak sıraya alınır; geçici dosya, dosya senkronizasyonu ve yeniden adlandırma kullanılır. Kayıt şeması ve benzersiz UUID denetlenir. Okuma/şema hatasında mevcut verinin üzerine boş liste yazılmaz; hata sonrasında kuyruk çalışmayı sürdürebilir. Çok süreçli çalışma, yoğun veri ve tam güç kesintisi dayanıklılığı bu yaklaşımın garantileri arasında değildir.

Bu, yönergenin zorunlu tuttuğu bir veritabanı mimarisi değildir; küçük eğitim projesinin ilk sürümü için seçilen saklama yaklaşımıdır.

## Uygulama ve kalan doğrulama

1. Veri modeli, HTTP sözleşmesi, Node.js/Express altyapısı ve logger uygulandı.
2. Beş CRUD işlemi, atama/durum/öncelik yönetimi ve JSON kalıcılığı otomatik testlerle doğrulanıyor.
3. Uygun isteğe bağlı özellikler uygulandı; temel akışlar ve genişletmeler aynı test paketinde yer alıyor.
4. README, ayrıntılı API/test/kullanım belgeleri ve Postman koleksiyonu hazırlandı.
5. Postman web arayüzü ve Desktop Agent ile sağlık, temel CRUD ve silme sonrası kontrol doğrulandı; altı ekran görüntüsü eklendi.
6. **Kalan:** Son teslim kontrolünden sonra tek public GitHub deposunda yayımlama.

Yönergedeki "5 günlük eğitim kapsamı" bir kapsam tanımıdır; burada takvim veya teslim tarihi varsayılmamıştır.

## Gerçek Postman test kanıtları

| İşlem | Gözlenen yanıt | Ekran görüntüsü |
| --- | --- | --- |
| Ekleme | `201`, üretilen kimlik ve gönderilen alanlar | [01-gorev-ekleme.png](test-kanitlari/01-gorev-ekleme.png) |
| Listeleme | `200`, aynı görevin listede bulunması | [02-gorev-listeleme.png](test-kanitlari/02-gorev-listeleme.png) |
| Detay | `200`, aynı kimlikteki görev | [03-gorev-detayi.png](test-kanitlari/03-gorev-detayi.png) |
| Güncelleme | `200`, değiştirilen atama/durum/öncelik | [04-gorev-guncelleme.png](test-kanitlari/04-gorev-guncelleme.png) |
| Silme | `204`, boş gövde | [05-gorev-silme.png](test-kanitlari/05-gorev-silme.png) |
| Silme sonrası kontrol | `404`, Headers sekmesi | [06-silinen-gorev-kontrolu.png](test-kanitlari/06-silinen-gorev-kontrolu.png) |

Görüntüler gerçek Postman arayüzünden alınmış ve istek/yanıt alanına kadrajlanmıştır; içerikleri değiştirilmemiştir. Silme sonrası görüntü `404` durumunu gösterir; JSON hata kodu bu görüntüde görünmez. Hata zarfı otomatik HTTP testlerinde ayrıca doğrulanır. Sağlık kontrolüyle birlikte yedi isteğin [logger çıktısı](test-kanitlari/07-istek-kayitlari.jsonl) da kaydedilmiştir. Kayıtların kapsamı [doğrulama sonuçlarında](test-sonuclari.md), tekrarlama adımları [test planındadır](test-plani.md).

Otomatik kontroller bulunamayan görev, bozuk JSON, logger alanları, kalıcılık, eşzamanlı işlemler, bozuk dosyanın korunması ve hatadan sonra kurtarmayı içerir. Genişletme testlerinde geçersiz alanlar, birleşik filtreler, Türkçe arama, boş sonuç, sayfa sınırları, kararlı sıralama ve rapor toplamları sınanır. Çalıştırma komutları ve kapsam [test planındadır](test-plani.md).

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
- [x] Proje tanıtımı, veri modeli ve API sözleşmesi hazırlandı.
- [x] Çalışan backend ve `package.json` oluşturuldu.
- [x] Beş CRUD işlemi ve logger yerel HTTP testlerinde doğrulandı.
- [x] Gerçek Postman ekran görüntüleri eklendi.
- [x] README kurulum ve çalıştırma adımları eklendi.
- [x] İsteğe bağlı geliştirmelerin son kapsamı ve testleri kaydedildi.
- [ ] Kaynak ve teslim belgeleri tek public GitHub deposunda yayımlandı.
