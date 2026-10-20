# TaskFlow - Doğrulama Sonuçları

Kontrol tarihi: 20 Ekim 2026.

## Environment

- Windows, Node.js `24.21.0`, npm `12.2.0`.
- Express.js `5.3.0`; dependency sürümleri `package-lock.json` ile sabitlenmiştir.

## Otomatik kontroller

| Kontrol | Sonuç |
| --- | --- |
| `npm test` | 69 test: 68 başarılı, 1 gerekçeli atlama, 0 hata |
| `npm run check` | 18 JavaScript dosyası syntax check aşamasından geçti |
| `npm audit --omit=dev` | Kontrol anında bildirilen güvenlik açığı: 0 |
| Gerçek server entry point | Server başlatma, HTTP erişimi ve process yeniden başlatıldıktan sonra persistence doğrulandı |
| Bozuk veri dosyası | HTTP tarafında genel hata; başlangıçta hata koduyla kapanma; mevcut içerik korunuyor |
| Yerel web erişimi | `/health` için `200`; configuration içindeki Postman origin değeriyle preflight için `204` |

Atlanan test, POSIX `SIGTERM` sinyalinin graceful shutdown davranışını denetler. Windows, gönderilen bu sinyali process sonlandırmaya dönüştürdüğünden aynı davranış bu environment içinde doğrulanamaz. Process yeniden başlatma ve persistence testleri Windows'ta çalışmıştır.

Test kapsamı: temel CRUD, logger alanları, atama/durum/öncelik değişiklikleri, UUID normalleştirmesi, concurrent writes, veri dosyası bütünlüğü, field validation, bozuk veya sıkıştırılmış request body örnekleri, filtering, Türkçe search, kullanıcı bazlı listeleme, pagination, sorting, raporlar ve origin sınırlandırması.

## Postman collection

Collection içindeki 37 request, test için geçici olarak başlatılan gerçek HTTP server uygulamasına sırayla gönderildi. Her request için `pm.test` script kodu da çalıştırıldı: 110 assertion başarılı, 0 hata. Collection ve environment dosyaları geçerli JSON olarak ayrıştırıldı.

Son kontrolde aynı akış, önceden mevcut bir görev içeren izole veri dosyasıyla tekrarlandı. 37 request ve 110 assertion tekrar başarılı oldu; collection cleanup işlemi sonrasında mevcut görev değişmeden korundu. Her request için bir kayıt olmak üzere toplam 37 logger kaydı oluştu.

Bu otomatik HTTP kontrolü, collection içindeki 37 request için Postman Collection Runner kullanıldığı anlamına gelmez. Postman arayüzündeki manuel doğrulamanın kapsamı aşağıdadır.

## Gerçek Postman doğrulaması

Postman web arayüzünden, `http://127.0.0.1:3000` adresindeki yerel server uygulamasına Desktop Agent `0.5.2` üzerinden yedi request manuel olarak gönderildi:

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

Aynı yedi request için alınan server stdout kayıtları [07-istek-kayitlari.jsonl](test-kanitlari/07-istek-kayitlari.jsonl) dosyasındadır. HTTP method, endpoint ve timestamp alanları manuel Postman akışıyla eşleştirilmiştir. Akış sonunda görev dosyası boş bir JSON array (`[]`) içerir; test için oluşturulan görev kaldırılmıştır.

Silme sonrası kontrol görüntüsü `404` durumunu ve Headers sekmesini gösterir; JSON error code bu görüntüde görünmez. `TASK_NOT_FOUND` error envelope yapısı otomatik HTTP testlerinde ayrıca doğrulanmıştır. Health check manuel akışta yapılmış; ayrı bir health check ekran görüntüsü eklenmemiştir.

## Son teslim kontrolü

PDF yönergesinin 15 sayfası, source code, belgeler ve Postman kanıtlarıyla tekrar karşılaştırıldı. Zorunlu CRUD, routing, her API request için logger, proje tanıtımı, data model/API tasarımı, kurulum kılavuzu ve gerçek Postman CRUD ekran görüntülerinde eksik bulunmadı. Gereksinimlerin dosya ve endpoint eşleştirmeleri [proje analizinde](proje-analizi.md) yer alır.

`npm ci --ignore-scripts --no-fund`, `npm run check`, `npm test` ve `npm audit --omit=dev` tekrar başarıyla tamamlandı. Yukarıdaki 69 testin sonucuna ek olarak izole HTTP server üzerinde 18 edge case kontrolü geçti: bozuk URI, body içindeki bilinmeyen field adları, primitive JSON, desteklenmeyen encoding/charset, tekrarlanan veya geçersiz query parametreleri, pagination sınırları, URL encoding uygulanmış `assignee` değeri, başarısız update sonrasında veri bütünlüğü ve `HEAD` davranışı. Bu 18 request için oluşan logger kayıtları da doğrulandı.

Altı PNG ve yedi satırlık logger snapshot; görev kimliği, CRUD sırası, HTTP status code ve timestamp tutarlılığı açısından yeniden incelendi. Bu kontrolde source code veya Postman dosyalarında değişiklik gerektiren bir hata bulunmadı.

## Teslim durumu

Uygulama, otomatik kontrol sonuçları, Postman collection, belgeler ve gerçek CRUD ekran görüntüleri [herkese açık TaskFlow repository](https://github.com/batuhansacofficial/TaskFlow) içinde `main` branch üzerine push edilmiştir. Altı PNG ve yedi request içeren logger snapshot aynı repository içinde bulunur. Çalışma verileri, `.env` ve `node_modules/` yayımlama kapsamına alınmamıştır.
