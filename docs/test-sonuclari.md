# TaskFlow - Doğrulama Sonuçları

Kontrol tarihi: 20 Ekim 2026.

## Environment

- Windows, Node.js `24.21.0`, npm `12.2.0`.
- Express.js `5.3.0`; dependency'ler `package-lock.json` ile sabitlenmiştir.

## Automated checks

| Kontrol | Sonuç |
| --- | --- |
| `npm test` | 69 test: 68 başarılı, 1 gerekçeli atlama, 0 hata |
| `npm run check` | 18 JavaScript dosyası syntax check aşamasından geçti |
| `npm audit --omit=dev` | Kontrol anında bildirilen güvenlik açığı: 0 |
| Gerçek server entry point | Başlatma, HTTP request ve process yeniden açıldığında persistence doğrulandı |
| Bozuk veri dosyası | HTTP tarafında genel hata; başlangıçta hata koduyla kapanma; mevcut içerik korunuyor |
| Yerel web erişimi | `/health` için `200`; configuration içindeki Postman origin'iyle preflight için `204` |

Atlanan test POSIX `SIGTERM` sinyalinin graceful shutdown davranışını denetler. Windows, gönderilen bu sinyali process sonlandırmaya dönüştürdüğünden aynı davranış bu environment içinde doğrulanamaz. Process yeniden başlatma ve data persistence testleri Windows'ta çalışmıştır.

Test kapsamı: temel CRUD, logger alanları, atama/durum/öncelik değişiklikleri, UUID normalleştirmesi, concurrent writes, veri dosyası bütünlüğü, field validation, bozuk/sıkıştırılmış body'ler, filter'lar, Türkçe search, kullanıcı bazlı listeleme, pagination, sorting, raporlar ve origin sınırlandırması.

## Postman collection

Collection içindeki 37 request, gerçek geçici HTTP server'ına sırayla gönderildi. Request'lerin `pm.test` script'leri de çalıştırıldı: 110 assertion başarılı, 0 hata. Collection ve environment dosyaları geçerli JSON olarak ayrıştırıldı.

Bu automated HTTP kontrolü, collection içindeki 37 request'in Postman Collection Runner içinde çalıştırıldığı anlamına gelmez. Postman arayüzündeki manuel doğrulamanın kapsamı aşağıdadır.

## Gerçek Postman doğrulaması

Postman web arayüzünden, yerel `http://127.0.0.1:3000` server'ına Desktop Agent `0.5.2` üzerinden yedi request manuel gönderildi:

| Request | Gözlenen HTTP status code |
| --- | --- |
| `GET /health` | `200` |
| `POST /tasks` | `201` |
| `GET /tasks` | `200` |
| `GET /tasks/:id` | `200` |
| `PATCH /tasks/:id` | `200` |
| `DELETE /tasks/:id` | `204` |
| Silinen kayda `GET /tasks/:id` | `404` |

Akışta oluşturulan görev kimliği `ab4cfc37-6b5d-4fd4-863d-deb78aea3ccf` değeridir; akış sonunda görev silinmiştir. Beş CRUD işlemi ve silme sonrası kontrolün [altı ekran görüntüsü](test-kanitlari/README.md) eklenmiştir. Görüntüler gerçek request/response alanlarına kadrajlanmıştır; içerikleri değiştirilmemiştir.

Aynı yedi request'in server stdout kayıtları [07-istek-kayitlari.jsonl](test-kanitlari/07-istek-kayitlari.jsonl) dosyasındadır. HTTP method, endpoint ve timestamp alanları manuel Postman akışıyla eşleştirilmiştir. Akış sonunda çalışma görev dosyası boş dizidir; test için oluşturulan görev kaldırılmıştır.

Silme sonrası kontrol görüntüsü `404` durumunu ve Headers sekmesini gösterir; JSON error code bu görüntüde görünmez. `TASK_NOT_FOUND` error envelope automated HTTP test'lerde ayrıca doğrulanmıştır. Health check manuel akışta yapılmış; ayrı bir health check ekran görüntüsü eklenmemiştir.

## Teslim durumu

Uygulama, automated checks, collection, kullanım belgeleri ve gerçek Postman CRUD ekran görüntüleri yereldedir. Public GitHub teslimi henüz tamamlanmamıştır.
