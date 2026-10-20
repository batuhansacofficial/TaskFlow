# Postman Ekran Görüntüleri

Bu dizine gerçek Postman istek/yanıt ekran görüntüleri eklenecektir. Henüz ekran görüntüsü bulunmamaktadır.

| Dosya adı | Gösterilecek işlem |
| --- | --- |
| `01-gorev-ekleme.png` | `POST /tasks`, JSON gövdesi ve `201` yanıtı |
| `02-gorev-listeleme.png` | `GET /tasks`, oluşturulan görevi içeren `200` yanıtı |
| `03-gorev-detayi.png` | `GET /tasks/:id`, görev bilgileri ve `200` yanıtı |
| `04-gorev-guncelleme.png` | `PATCH /tasks/:id`, değişiklikler ve `200` yanıtı |
| `05-gorev-silme.png` | `DELETE /tasks/:id`, `204` yanıtı |
| `06-silinen-gorev-kontrolu.png` | Silinen göreve `GET`, `404` yanıtı |

Görüntüde istek metodu, endpoint, HTTP durum kodu ve ilgili gövde görünmelidir. Hesap bilgileri veya oturum belirteçleri görüntüye dahil edilmemelidir. Koleksiyon dosyası ve otomatik HTTP test çıktısı bu ekran görüntülerinin yerine geçmez.
