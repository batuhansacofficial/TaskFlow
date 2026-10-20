# TaskFlow - API Tasarımı

Bu belge uygulanan HTTP sözleşmesinin tasarım kararlarını açıklar. Yönerge beş CRUD davranışını zorunlu tutar (s.6), ancak temel endpoint yollarını, güncelleme metodunu ve yanıt şemasını belirlemez. Aşağıdaki yollar ve HTTP kodları proje tercihleridir. Ayrıntılı istek/yanıt örnekleri [API kılavuzundadır](api.md).

## Genel yaklaşım

- İstek ve gövdeli yanıt biçimi JSON'dur.
- Kaynak adı `tasks`; kimlik sunucuda üretilen UUID metnidir.
- Tek kayıt yanıtı `{ "data": { ... } }`, liste yanıtı `{ "data": [ ... ], "meta": { "total": 0 } }` biçimindedir.
- `204 No Content` yanıtı gövde içermez.
- Görev alanları [veri modeli](veri-modeli.md) belgesinde tanımlanır.

## Temel CRUD

| Metot | Yol | Davranış | Başarı yanıtı |
| --- | --- | --- | --- |
| `POST` | `/tasks` | Görev oluşturma | `201 Created`, yeni görev ve `Location: /tasks/{id}` |
| `GET` | `/tasks` | Tüm görevleri listeleme | `200 OK`, görev dizisi ve toplam |
| `GET` | `/tasks/:id` | Görev detayı | `200 OK`, tek görev |
| `PATCH` | `/tasks/:id` | Gönderilen görev alanlarını güncelleme | `200 OK`, güncel görev |
| `DELETE` | `/tasks/:id` | Görevi silme | `204 No Content` |

Oluşturma gövdesi örneği:

```json
{
  "title": "Görev API'sini geliştirme",
  "description": "Temel görev endpoint'lerini hazırlama",
  "priority": "high",
  "assignee": "musa"
}
```

Güncelleme gövdesi örneği:

```json
{
  "status": "in_progress",
  "assignee": "ayse"
}
```

`PATCH` kısmi güncellemedir. `id` ve tarih alanları istemciden alınmaz. Oluşturmada varsayılanlar, güncellemede gönderilmeyen alanların korunması ve atamanın `null` ile kaldırılması [veri modeliyle](veri-modeli.md) aynıdır.

## Hata davranışı

| Durum | HTTP kodu |
| --- | --- |
| Bozuk JSON veya veri sözleşmesine aykırı istek | `400 Bad Request` |
| UUID biçimine uymayan görev kimliği | `400 Bad Request` |
| Biçimi geçerli fakat bulunamayan görev veya tanımsız yol | `404 Not Found` |
| 100 KB gövde sınırının aşılması | `413 Payload Too Large` |
| Desteklenmeyen içerik türü veya kodlama | `415 Unsupported Media Type` |
| Beklenmeyen sunucu ya da veri saklama hatası | `500 Internal Server Error` |

Örnek hata zarfı:

```json
{
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Görev bulunamadı."
  }
}
```

Validation alan hataları bu zarfa `details` dizisiyle eklenir. Kullanıcıya gösterilen açıklamalar Türkçe; alan adları ve makine tarafından işlenen kodlar sabit teknik tanımlayıcılardır. İç dosya yolları ve hata yığınları yanıt gövdesine eklenmez.

## Logger

Yönergenin zorunlu tuttuğu üç bilgi HTTP metodu, endpoint ve zaman damgasıdır (s.6). Logger bu alanları konsola JSON satırı olarak yazar; bulunamayan yolları ve hatalı JSON isteklerini de kapsar. JSON ayrıştırıcısından önce çalışır.

## İsteğe bağlı liste genişletmeleri

S.8'deki örnek yollar korunarak aşağıdaki isteğe bağlı davranışlar uygulanmıştır:

| Özellik | Yol / örnek | Davranış |
| --- | --- | --- |
| Durum filtresi | `GET /tasks?status=completed` | Tam durum eşleşmesi |
| Öncelik filtresi | `GET /tasks?priority=high` | Tam öncelik eşleşmesi |
| Arama | `GET /tasks/search?keyword=backend` | Başlık ve açıklamada Türkçe harf dönüşümünü gözeten, harf duyarsız metin araması |
| Çalışana göre listeleme | `GET /tasks/assignee/musa` | Temizlenmiş `assignee` metniyle harf duyarlı tam eşleşme |
| Sayfalama | `GET /tasks?page=1&limit=10` | Sayfa 1 tabanlı; `limit` 1-100 arası tam sayı |
| Sıralama | `GET /tasks?sort=createdAt` | İzin verilen alanlara göre sıralama |

Ortak kurallar:

- Aynı istekteki farklı filtreler kesişim olarak uygulanır. Arama ve çalışan yolları da ortak durum/öncelik/sıralama/sayfalama seçeneklerini kullanır.
- `keyword` yalnız arama yolunda desteklenir; boşlukları temizlendikten sonra 1-200 karakter olmalıdır. Sonuç bulunamazsa `200` ve boş dizi döner.
- Filtreleme/arama, sıralama ve sayfalama bu sırayla uygulanır.
- Sayfalama parametresi yoksa tüm eşleşmeler döner. Parametrelerden biri verilirse eksik `page` için 1, eksik `limit` için 10 kullanılır.
- Sayfalanmış listede `meta` alanı `total`, `page`, `limit`, `totalPages` içerir. `total` sayfa diliminden önceki eşleşme sayısıdır. Aralık dışındaki geçerli sayfa `200` ve boş dizi döndürür.
- `sort` için `createdAt`, `updatedAt`, `title`, `priority` alanları desteklenir. Başına `-` koymak azalan sıralamadır. Varsayılan `createdAt` artan; eşitliklerde her zaman `id` artandır. Öncelik sırası `low`, `medium`, `high`; başlık sırası Türkçe yerel karşılaştırmadır.
- Geçersiz enum, sıralama alanı, sayfa veya limit `400` üretir. Desteklenmeyen veya aynı anahtarı tekrar eden query parametreleri `400` ile reddedilir. Sayfa ve limit başında sıfır, işaret veya kesir içeremez; sayfa güvenli tamsayı aralığında olmalıdır.
- `/tasks/search` ve `/tasks/assignee/:assignee` yolları `/tasks/:id` yolundan önce tanımlanır.

## İsteğe bağlı raporlar

S.10'da verilen yollar:

| Metot ve yol | `data` içeriği |
| --- | --- |
| `GET /reports/completed` | `{ "count": 0 }`; yalnız `completed` durumundaki görevler |
| `GET /reports/pending` | `{ "count": 0 }`; yalnız `pending` durumundaki görevler |
| `GET /reports/summary` | `{ "total": 0, "pending": 0, "inProgress": 0, "completed": 0 }` |

Bekleyen sayısına `in_progress` dahil edilmemesi proje kararıdır; yönerge bu ayrıntıyı tanımlamaz. Genel özette `pending + inProgress + completed = total` eşitliği korunur. Her rapor tek görev görünümü üzerinden hesaplanır. Rapor yolları query parametresi kabul etmez.

## Sağlık ve tarayıcı erişimi

`GET /health`, `200` ve `{"data":{"status":"ok"}}` döndürür. Bu yanıt yalnız hizmet durumunu bildirir; her çağrıda veri dosyası denetlemez. İsteğe bağlı `CORS_ORIGIN` tek ve tam origin eşleşmesiyle tarayıcı erişimi sağlar; yapılandırma [README'de](../README.md) açıklanır.

Postman koleksiyonu ve [test planı](test-plani.md) doğrulama adımlarını içerir. Gerçek Postman ekran görüntüleri henüz eklenmemiştir; bu belgeler onların yerine geçmez.
