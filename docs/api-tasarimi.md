# TaskFlow - API Tasarımı

Bu belge uygulanan HTTP contract için belirlenen tasarım kararlarını açıklar. Yönerge beş CRUD davranışını zorunlu tutar (s.6), ancak temel endpoint'leri, güncelleme için HTTP method seçimini ve response schema'sını belirlemez. Aşağıdaki endpoint'ler ve HTTP status code'lar proje tercihleridir. Ayrıntılı request/response örnekleri [API kılavuzundadır](api.md).

## Genel yaklaşım

- Request body ve response body için JSON kullanılır.
- Kaynak adı `tasks`; kimlik server'da üretilen UUID string değeridir.
- Tek kayıt response'u `{ "data": { ... } }`, liste response'u `{ "data": [ ... ], "meta": { "total": 0 } }` biçimindedir.
- `204 No Content` response'u body içermez.
- Görev alanları [veri modeli](veri-modeli.md) belgesinde tanımlanır.

## Temel CRUD

| HTTP method | Endpoint | Davranış | Başarılı response |
| --- | --- | --- | --- |
| `POST` | `/tasks` | Görev oluşturma | `201 Created`, yeni görev ve `Location: /tasks/{id}` |
| `GET` | `/tasks` | Tüm görevleri listeleme | `200 OK`, görev dizisi ve toplam |
| `GET` | `/tasks/:id` | Görev detayı | `200 OK`, tek görev |
| `PATCH` | `/tasks/:id` | Gönderilen görev alanlarını güncelleme | `200 OK`, güncel görev |
| `DELETE` | `/tasks/:id` | Görevi silme | `204 No Content` |

Oluşturma request body örneği:

```json
{
  "title": "Görev API'sini geliştirme",
  "description": "Temel görev endpoint'lerini hazırlama",
  "priority": "high",
  "assignee": "musa"
}
```

Güncelleme request body örneği:

```json
{
  "status": "in_progress",
  "assignee": "ayse"
}
```

`PATCH` kısmi güncellemedir. `id` ve tarih alanları client'tan alınmaz. Oluşturmada varsayılanlar, güncellemede gönderilmeyen alanların korunması ve atamanın `null` ile kaldırılması [veri modeliyle](veri-modeli.md) aynıdır.

## Hata davranışı

| Durum | HTTP status code |
| --- | --- |
| Bozuk JSON veya data contract'a aykırı request | `400 Bad Request` |
| UUID biçimine uymayan görev kimliği | `400 Bad Request` |
| Biçimi geçerli fakat bulunamayan görev veya tanımsız route | `404 Not Found` |
| 100 KB request body sınırının aşılması | `413 Payload Too Large` |
| Desteklenmeyen content type veya encoding | `415 Unsupported Media Type` |
| Beklenmeyen server ya da veri saklama hatası | `500 Internal Server Error` |

Örnek error envelope:

```json
{
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Görev bulunamadı."
  }
}
```

Field validation hataları bu envelope içine `details` dizisiyle eklenir. Kullanıcıya gösterilen açıklamalar Türkçe; field adları ve makine tarafından işlenen kodlar sabit teknik tanımlayıcılardır. İç dosya yolları ve stack trace'ler response body içine eklenmez.

## Logger

Yönergenin zorunlu tuttuğu üç bilgi HTTP method, endpoint ve timestamp bilgisidir (s.6). Logger bu alanları konsola JSON satırı olarak yazar; bulunamayan route'ları ve hatalı JSON request'lerini de kapsar. JSON parser'dan önce çalışır.

## İsteğe bağlı liste genişletmeleri

S.8'deki örnek endpoint'ler korunarak aşağıdaki isteğe bağlı davranışlar uygulanmıştır:

| Özellik | Endpoint / örnek | Davranış |
| --- | --- | --- |
| Status filter | `GET /tasks?status=completed` | Tam durum eşleşmesi |
| Priority filter | `GET /tasks?priority=high` | Tam öncelik eşleşmesi |
| Search | `GET /tasks/search?keyword=backend` | Başlık ve açıklamada Türkçe harf dönüşümünü gözeten, case-insensitive text search |
| Çalışana göre listeleme | `GET /tasks/assignee/musa` | Temizlenmiş `assignee` metniyle case-sensitive tam eşleşme |
| Pagination | `GET /tasks?page=1&limit=10` | Sayfa numarası 1 tabanlı; `limit` 1-100 arası tam sayı |
| Sorting | `GET /tasks?sort=createdAt` | İzin verilen alanlara göre sorting |

Ortak kurallar:

- Aynı request içindeki farklı filter'lar kesişim olarak uygulanır. Search ve çalışan endpoint'leri de ortak durum/öncelik/sorting/pagination seçeneklerini kullanır.
- `keyword` yalnız search endpoint'inde desteklenir; boşlukları temizlendikten sonra 1-200 karakter olmalıdır. Sonuç bulunamazsa `200` ve boş dizi döner.
- Filtering/search, sorting ve pagination bu sırayla uygulanır.
- Pagination parametresi yoksa tüm eşleşmeler döner. Parametrelerden biri verilirse eksik `page` için 1, eksik `limit` için 10 kullanılır.
- Pagination uygulanan listede `meta` alanı `total`, `page`, `limit`, `totalPages` içerir. `total` sayfa diliminden önceki eşleşme sayısıdır. Aralık dışındaki geçerli sayfa `200` ve boş dizi döndürür.
- `sort` için `createdAt`, `updatedAt`, `title`, `priority` alanları desteklenir. Başına `-` koymak descending sorting anlamına gelir. Varsayılan `createdAt` artan; eşitliklerde her zaman `id` artandır. Öncelik sırası `low`, `medium`, `high`; başlık sırası Türkçe yerel karşılaştırmadır.
- Geçersiz enum, sorting alanı, sayfa veya limit `400` üretir. Desteklenmeyen veya aynı anahtarı tekrar eden query parametreleri `400` ile reddedilir. Sayfa ve limit başında sıfır, işaret veya kesir içeremez; sayfa güvenli tamsayı aralığında olmalıdır.
- `/tasks/search` ve `/tasks/assignee/:assignee` yolları `/tasks/:id` yolundan önce tanımlanır.

## İsteğe bağlı raporlar

S.10'da verilen endpoint'ler:

| HTTP method ve endpoint | `data` içeriği |
| --- | --- |
| `GET /reports/completed` | `{ "count": 0 }`; yalnız `completed` durumundaki görevler |
| `GET /reports/pending` | `{ "count": 0 }`; yalnız `pending` durumundaki görevler |
| `GET /reports/summary` | `{ "total": 0, "pending": 0, "inProgress": 0, "completed": 0 }` |

Bekleyen sayısına `in_progress` dahil edilmemesi proje kararıdır; yönerge bu ayrıntıyı tanımlamaz. Genel özette `pending + inProgress + completed = total` eşitliği korunur. Her rapor tek görev görünümü üzerinden hesaplanır. Rapor endpoint'leri query parametresi kabul etmez.

## Health check ve tarayıcı erişimi

`GET /health`, `200` ve `{"data":{"status":"ok"}}` döndürür. Bu response yalnız hizmet durumunu bildirir; her çağrıda veri dosyası denetlemez. İsteğe bağlı `CORS_ORIGIN` tek ve tam origin eşleşmesiyle tarayıcı erişimi sağlar; configuration [README'de](../README.md) açıklanır.

Postman collection dosyası ve [test planı](test-plani.md) doğrulama adımlarını içerir. Temel CRUD ve silme sonrası kontrolün [gerçek Postman ekran görüntüleri](test-kanitlari/README.md) eklenmiştir; automated checks sonuçlarının ve manuel Postman akışının kapsamı [sonuçlarda](test-sonuclari.md) ayrı açıklanır.
