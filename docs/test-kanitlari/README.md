# Postman Ekran Görüntüleri

Bu dizin gerçek Postman web arayüzünde çalıştırılan temel CRUD akışının altı ekran görüntüsünü içerir. Request'ler Desktop Agent `0.5.2` üzerinden `http://127.0.0.1:3000` adresindeki yerel API'ye gönderilmiştir.

| Ekran görüntüsü | Gösterilen işlem |
| --- | --- |
| [01-gorev-ekleme.png](01-gorev-ekleme.png) | `POST /tasks`, JSON request body ve `201` response'u |
| [02-gorev-listeleme.png](02-gorev-listeleme.png) | `GET /tasks`, oluşturulan görevi içeren `200` response'u |
| [03-gorev-detayi.png](03-gorev-detayi.png) | `GET /tasks/:id`, görev bilgileri ve `200` response'u |
| [04-gorev-guncelleme.png](04-gorev-guncelleme.png) | `PATCH /tasks/:id`, atama/durum/öncelik değişiklikleri ve `200` response'u |
| [05-gorev-silme.png](05-gorev-silme.png) | `DELETE /tasks/:id`, `204` ve boş response body |
| [06-silinen-gorev-kontrolu.png](06-silinen-gorev-kontrolu.png) | Silinen göreve `GET`, `404` ve Headers sekmesi |

Akışta kullanılan görev kimliği `ab4cfc37-6b5d-4fd4-863d-deb78aea3ccf` değeridir. Görev akış sonunda silinmiştir. Görüntüler yalnız request/response alanlarına kadrajlanmış; içerikleri değiştirilmemiştir. Altıncı görüntüde `404` görünür, JSON error code görünmez. Error envelope'un kontrolü automated HTTP test'lerde ayrıca bulunur.

Health check ile birlikte manuel Postman akışı yedi request içerir. Collection içindeki 37 request'in automated HTTP denetimi farklı bir kontroldür; Postman Collection Runner çalıştırması olarak sunulmaz. Ayrıntılar [doğrulama sonuçlarında](../test-sonuclari.md), tekrarlama adımları [test planında](../test-plani.md) açıklanır.

[07-istek-kayitlari.jsonl](07-istek-kayitlari.jsonl), bu yedi request için oluşan server standard output (`stdout`) kayıtlarını içerir. Her satırda `method`, `endpoint` ve UTC `timestamp` alanları bulunur. Kayıtlar Postman akışıyla eşleştirilmiştir.
