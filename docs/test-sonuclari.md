# TaskFlow - Doğrulama Sonuçları

Kontrol tarihi: 20 Ekim 2026.

## Ortam

- Windows, Node.js `24.21.0`, npm `12.2.0`.
- Express.js `5.3.0`; bağımlılıklar `package-lock.json` ile sabitlenmiştir.

## Otomatik kontroller

| Kontrol | Sonuç |
| --- | --- |
| `npm test` | 69 test: 68 başarılı, 1 gerekçeli atlama, 0 hata |
| `npm run check` | 18 JavaScript dosyası sözdizimi kontrolünden geçti |
| `npm audit --omit=dev` | Kontrol anında bildirilen güvenlik açığı: 0 |
| Gerçek sunucu giriş dosyası | Başlatma, HTTP isteği ve süreç yeniden açıldığında kalıcılık doğrulandı |
| Bozuk veri dosyası | HTTP tarafında genel hata; başlangıçta hata koduyla kapanma; mevcut içerik korunuyor |
| Yerel web erişimi | `/health` için `200`; yapılandırılmış Postman origin'iyle preflight için `204` |

Atlanan test POSIX `SIGTERM` sinyalinin zarif kapanışını denetler. Windows, gönderilen bu sinyali süreç sonlandırmaya dönüştürdüğünden aynı davranış bu ortamda doğrulanamaz. Süreç yeniden başlatma ve veri kalıcılığı testleri Windows'ta çalışmıştır.

Test kapsamı: temel CRUD, logger alanları, atama/durum/öncelik değişiklikleri, UUID normalleştirmesi, eşzamanlı kayıtlar, veri dosyası bütünlüğü, alan doğrulama, bozuk/sıkıştırılmış gövdeler, filtreler, Türkçe arama, kullanıcı bazlı listeleme, sayfalama, sıralama, raporlar ve origin sınırlandırması.

## Postman koleksiyonu

Koleksiyondaki 37 istek, gerçek geçici HTTP sunucusuna sırayla gönderildi. İsteklerin `pm.test` betikleri de çalıştırıldı: 110 assertion başarılı, 0 hata. Koleksiyon ve environment dosyaları geçerli JSON olarak ayrıştırıldı.

Bu otomatik HTTP kontrolü, koleksiyonun 37 isteğinin Postman Collection Runner içinde çalıştırıldığı anlamına gelmez. Postman arayüzündeki manuel doğrulamanın kapsamı aşağıdadır.

## Gerçek Postman doğrulaması

Postman web arayüzünden, yerel `http://127.0.0.1:3000` sunucusuna Desktop Agent `0.5.2` üzerinden yedi istek manuel gönderildi:

| İstek | Gözlenen HTTP durumu |
| --- | --- |
| `GET /health` | `200` |
| `POST /tasks` | `201` |
| `GET /tasks` | `200` |
| `GET /tasks/:id` | `200` |
| `PATCH /tasks/:id` | `200` |
| `DELETE /tasks/:id` | `204` |
| Silinen kayda `GET /tasks/:id` | `404` |

Akışta oluşturulan görev kimliği `ab4cfc37-6b5d-4fd4-863d-deb78aea3ccf` değeridir; akış sonunda görev silinmiştir. Beş CRUD işlemi ve silme sonrası kontrolün [altı ekran görüntüsü](test-kanitlari/README.md) eklenmiştir. Görüntüler gerçek istek/yanıt alanlarına kadrajlanmıştır; içerikleri değiştirilmemiştir.

Aynı yedi isteğin sunucu standart çıktı kayıtları [07-istek-kayitlari.jsonl](test-kanitlari/07-istek-kayitlari.jsonl) dosyasındadır. Metot, endpoint ve zaman damgaları manuel Postman akışıyla eşleştirilmiştir. Akış sonunda çalışma görev dosyası boş dizidir; test için oluşturulan görev kaldırılmıştır.

Silme sonrası kontrol görüntüsü `404` durumunu ve Headers sekmesini gösterir; JSON hata kodu bu görüntüde görünmez. `TASK_NOT_FOUND` hata zarfı otomatik HTTP testlerinde ayrıca doğrulanmıştır. Sağlık kontrolü manuel akışta yapılmış; ayrı bir sağlık ekran görüntüsü eklenmemiştir.

## Teslim durumu

Uygulama, otomatik kontroller, koleksiyon, kullanım belgeleri ve gerçek Postman CRUD ekran görüntüleri yereldedir. Public GitHub teslimi henüz tamamlanmamıştır.
