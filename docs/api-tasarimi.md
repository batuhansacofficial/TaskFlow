# TaskFlow - API Tasarım Taslağı

Bu belge uygulama öncesi önerilen sözleşmedir. Yönerge beş CRUD davranışını zorunlu tutar (s.6), ancak temel endpoint yollarını, güncelleme metodunu ve yanıt şemasını belirlemez. Aşağıdaki yollar ve HTTP kodları tasarım tercihleridir. Henüz çalışan endpoint veya test sonucu yoktur.

## Genel yaklaşım

- İstek ve gövdeli yanıt biçimi JSON'dur.
- Kaynak adı `tasks`; kimlik sunucuda üretilen UUID metnidir.
- Tek kayıt yanıtı `{ "data": { ... } }`, liste yanıtı `{ "data": [ ... ], "meta": { "total": 0 } }` biçimindedir.
- `204 No Content` yanıtı gövde içermez.
- Görev alanları [veri modeli](veri-modeli.md) belgesinde tanımlanır.

## Temel CRUD

| Metot | Yol | Davranış | Önerilen başarı yanıtı |
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

`PATCH` kısmi güncellemedir. `id` ve tarih alanları istemciden alınmaz. Oluşturmada varsayılan alanlar, güncellemede gönderilmeyen alanların korunması ve atamanın `null` ile kaldırılması veri modeliyle aynı şekilde uygulanmalıdır.

## Hata davranışı önerisi

| Durum | HTTP kodu |
| --- | --- |
| Bozuk JSON veya veri sözleşmesine aykırı istek | `400 Bad Request` |
| UUID biçimine uymayan görev kimliği | `400 Bad Request` |
| Biçimi geçerli fakat bulunamayan görev veya tanımsız yol | `404 Not Found` |
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

Validation genişletmesi uygulanırsa alan hataları bu zarfa `details` dizisiyle eklenebilir. Kullanıcıya gösterilen açıklamalar Türkçe; alan adları ve makine tarafından işlenen kodlar sabit teknik tanımlayıcılardır. İç dosya yolları ve hata yığınları yanıt gövdesine eklenmemelidir.

## Logger

Yönergenin zorunlu tuttuğu üç bilgi HTTP metodu, endpoint ve zaman damgasıdır (s.6). Başlangıç önerisi konsol çıktısıdır; dosyaya da yazmak zorunlu değildir. Logger tüm API isteklerini, bulunamayan yolları ve hatalı JSON isteklerini de kapsayacak sırada çalışmalıdır.

## İsteğe bağlı liste genişletmeleri

S.8'deki örnek yollar korunarak şu davranışlar değerlendirilecektir:

| Özellik | Yol / örnek | Önerilen davranış |
| --- | --- | --- |
| Durum filtresi | `GET /tasks?status=completed` | Tam durum eşleşmesi |
| Öncelik filtresi | `GET /tasks?priority=high` | Tam öncelik eşleşmesi |
| Arama | `GET /tasks/search?keyword=backend` | Başlık ve açıklamada Türkçe harf dönüşümünü gözeten, harf duyarsız metin araması |
| Çalışana göre listeleme | `GET /tasks/assignee/musa` | Temizlenmiş `assignee` metniyle harf duyarlı tam eşleşme |
| Sayfalama | `GET /tasks?page=1&limit=10` | Sayfa 1 tabanlı; `limit` 1-100 arası tam sayı |
| Sıralama | `GET /tasks?sort=createdAt` | İzin verilen alanlara göre sıralama |

Önerilen ortak kurallar:

- Aynı istekteki farklı filtreler kesişim olarak uygulanır. Arama ve çalışan yolları da ortak durum/öncelik/sıralama/sayfalama seçeneklerini kullanabilir.
- `keyword` arama yolunda zorunlu, boş olmayan bir metindir. Sonuç bulunamazsa `200` ve boş dizi döner.
- Filtreleme/arama, sıralama ve sayfalama bu sırayla uygulanır.
- Sayfalama parametresi yoksa tüm eşleşmeler döner. Parametrelerden biri verilirse eksik `page` için 1, eksik `limit` için 10 kullanılır.
- Sayfalanmış listede `meta` alanı `total`, `page`, `limit`, `totalPages` içerir. `total` sayfa diliminden önceki eşleşme sayısıdır. Aralık dışındaki geçerli sayfa `200` ve boş dizi döndürür.
- `sort` için `createdAt`, `updatedAt`, `title`, `priority` alanları önerilir. Başına `-` koymak azalan sıralamadır. Varsayılan `createdAt` artan; eşitliklerde `id` artandır. Öncelik sırası `low`, `medium`, `high` olarak tanımlanır.
- Geçersiz enum, sıralama alanı, sayfa veya limit `400` üretir. Desteklenmeyen veya aynı anahtarı tekrar eden query parametrelerinin de `400` ile reddedilmesi önerilir.
- `/tasks/search` ve `/tasks/assignee/:assignee` yolları `/tasks/:id` yolundan önce tanımlanır.

## İsteğe bağlı raporlar

S.10'da verilen yollar:

| Metot ve yol | Önerilen `data` içeriği |
| --- | --- |
| `GET /reports/completed` | `{ "count": 0 }`; yalnız `completed` durumundaki görevler |
| `GET /reports/pending` | `{ "count": 0 }`; yalnız `pending` durumundaki görevler |
| `GET /reports/summary` | `{ "total": 0, "pending": 0, "inProgress": 0, "completed": 0 }` |

Bekleyen sayısına `in_progress` dahil edilmemesi bir tasarım önerisidir; yönerge bu ayrıntıyı tanımlamaz. Genel özette `pending + inProgress + completed = total` olmalıdır. Raporlar aynı istek içinde tutarlı bir görev görünümü üzerinden hesaplanmalıdır.

## Sonraki dokümantasyon adımı

Her endpoint'in ayrıntılı başarılı/hatalı istek ve yanıt örnekleri, Postman koleksiyonu, yazılı test senaryoları ve entegrasyon rehberi çalışan uygulama üzerinden genişletilebilir. Bu taslak gerçek Postman ekran görüntülerinin yerine geçmez.
