# TaskFlow - API Kılavuzu

Yerel temel adres: `http://127.0.0.1:3000`. Aşağıdaki kimlik, tarih ve kayıtlar sözleşme örnekleridir; kaydedilmiş test yanıtı değildir. Gerçek `id` değerini oluşturma yanıtından alın.

## Ortak sözleşme

- Gövdeli yazma istekleri `Content-Type: application/json` kullanır; gövde bir JSON nesnesi olmalıdır.
- Tek kayıt/rapor yanıtı `data`, liste yanıtı `data` ve `meta` alanlarını içerir. Silme `204` ile boş gövde döndürür.
- Oluşturmada yalnız `title` zorunludur. `description: ""`, `status: "pending"`, `priority: "medium"`, `assignee: null` varsayılandır.
- Durumlar: `pending`, `in_progress`, `completed`. Öncelikler: `low`, `medium`, `high`.
- `title` 1-200, `description` 0-5000, metin `assignee` 1-100 uzunluğunda olmalıdır. Metinlerin dış boşlukları temizlenir. Uzunluk JavaScript metin uzunluğuyla ölçülür.
- `id`, `createdAt`, `updatedAt` ve bilinmeyen alanlar istemciden kabul edilmez. `PATCH` en az bir düzenlenebilir alan gerektirir; gönderilmeyen alanlar korunur.
- UUID'ler sürüm/variant biçimine göre doğrulanır. Büyük/küçük harf aynı kimliği belirtir; dönen kimlik küçük harflidir.
- İstek gövdesi sınırı 100 KB'dır. Hatalar Türkçe mesaj ve sabit makine koduyla döner.

## Sağlık kontrolü

```http
GET /health
```

`200 OK`:

```json
{ "data": { "status": "ok" } }
```

Hizmetin yanıt verdiğini bildirir; her çağrıda veri dosyası okunmaz.

## Görev oluşturma

```http
POST /tasks
Content-Type: application/json

{
  "title": "Görev API'sini geliştirme",
  "description": "Backend servislerini geliştirme",
  "priority": "high",
  "assignee": "musa"
}
```

`201 Created`; `Location: /tasks/36b735af-c102-4a93-9d8c-b6e7c0860642`:

```json
{
  "data": {
    "id": "36b735af-c102-4a93-9d8c-b6e7c0860642",
    "title": "Görev API'sini geliştirme",
    "description": "Backend servislerini geliştirme",
    "status": "pending",
    "priority": "high",
    "assignee": "musa",
    "createdAt": "2026-10-20T09:00:00.000Z",
    "updatedAt": "2026-10-20T09:00:00.000Z"
  }
}
```

Kimlik ve tarihler sunucuda üretilir. Başarı yanıtı dosya yazımı tamamlandıktan sonra döner.

## Görev listeleme

```http
GET /tasks?status=pending&priority=high&page=1&limit=10&sort=-createdAt
```

`200 OK`:

```json
{
  "data": [
    {
      "id": "36b735af-c102-4a93-9d8c-b6e7c0860642",
      "title": "Görev API'sini geliştirme",
      "description": "Backend servislerini geliştirme",
      "status": "pending",
      "priority": "high",
      "assignee": "musa",
      "createdAt": "2026-10-20T09:00:00.000Z",
      "updatedAt": "2026-10-20T09:00:00.000Z"
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
}
```

Sayfalama parametreleri yoksa `meta` yalnız `total` içerir. Boş sonuç `{"data":[],"meta":{"total":0}}` biçimindedir.

## Görev detayı

```http
GET /tasks/36b735af-c102-4a93-9d8c-b6e7c0860642
```

`200 OK`:

```json
{
  "data": {
    "id": "36b735af-c102-4a93-9d8c-b6e7c0860642",
    "title": "Görev API'sini geliştirme",
    "description": "Backend servislerini geliştirme",
    "status": "pending",
    "priority": "high",
    "assignee": "musa",
    "createdAt": "2026-10-20T09:00:00.000Z",
    "updatedAt": "2026-10-20T09:00:00.000Z"
  }
}
```

Geçersiz kimlik `400 INVALID_ID`, bulunmayan geçerli kimlik `404 TASK_NOT_FOUND` döndürür.

## Görev güncelleme

```http
PATCH /tasks/36b735af-c102-4a93-9d8c-b6e7c0860642
Content-Type: application/json

{
  "status": "in_progress",
  "priority": "medium",
  "assignee": "ayse"
}
```

`200 OK`:

```json
{
  "data": {
    "id": "36b735af-c102-4a93-9d8c-b6e7c0860642",
    "title": "Görev API'sini geliştirme",
    "description": "Backend servislerini geliştirme",
    "status": "in_progress",
    "priority": "medium",
    "assignee": "ayse",
    "createdAt": "2026-10-20T09:00:00.000Z",
    "updatedAt": "2026-10-20T09:05:00.000Z"
  }
}
```

Başlık/açıklama ve oluşturma zamanı korunur. Atamayı kaldırmak için `{"assignee":null}` gönderilir. Desteklenen durumlar arasında ayrıca bir geçiş kısıtı yoktur. Geçerli fakat bulunmayan kayıt `404` döndürür.

## Görev silme

```http
DELETE /tasks/36b735af-c102-4a93-9d8c-b6e7c0860642
```

Başarı yanıtı `204 No Content` ve boş gövdedir. Aynı kimlikle sonraki detay veya silme isteği `404 TASK_NOT_FOUND` döndürür.

## Başlık ve açıklamada arama

```http
GET /tasks/search?keyword=backend&status=pending
```

`200 OK`:

```json
{
  "data": [
    {
      "id": "36b735af-c102-4a93-9d8c-b6e7c0860642",
      "title": "Görev API'sini geliştirme",
      "description": "Backend servislerini geliştirme",
      "status": "pending",
      "priority": "high",
      "assignee": "musa",
      "createdAt": "2026-10-20T09:00:00.000Z",
      "updatedAt": "2026-10-20T09:00:00.000Z"
    }
  ],
  "meta": { "total": 1 }
}
```

`keyword` zorunludur; dış boşluklar temizlendikten sonra 1-200 karakter olmalıdır. Başlık ve açıklamada alt metin aranır. Dönüşüm `tr-TR` yerel kuralını kullanır: `İ/i` ve `I/ı` çiftleri aynı kabul edilir. Aksan veya noktalama kaldırılmaz. URL içindeki Türkçe harf ve boşlukları URL kodlamasıyla gönderin. Ortak filtre, sıralama ve sayfalama parametreleri burada da kullanılabilir.

## Çalışana göre listeleme

```http
GET /tasks/assignee/musa?priority=high
```

`200 OK`:

```json
{
  "data": [
    {
      "id": "36b735af-c102-4a93-9d8c-b6e7c0860642",
      "title": "Görev API'sini geliştirme",
      "description": "Backend servislerini geliştirme",
      "status": "pending",
      "priority": "high",
      "assignee": "musa",
      "createdAt": "2026-10-20T09:00:00.000Z",
      "updatedAt": "2026-10-20T09:00:00.000Z"
    }
  ],
  "meta": { "total": 1 }
}
```

Çalışan metni dış boşlukları temizlendikten sonra 1-100 uzunluğunda olmalıdır. Eşleşme tam ve harf duyarlıdır: `musa` ile `Musa` farklıdır. Eşleşmeyen çalışan için boş liste döner; bir kullanıcı kaydı aranmaz. Ortak liste parametreleri desteklenir.

## Ortak query kuralları

Bu tablo `/tasks`, `/tasks/search` ve `/tasks/assignee/:assignee` liste yolları içindir.

| Parametre | Değer | Davranış |
| --- | --- | --- |
| `status` | `pending`, `in_progress`, `completed` | Tam eşleşme |
| `priority` | `low`, `medium`, `high` | Tam eşleşme |
| `sort` | `createdAt`, `updatedAt`, `title`, `priority` | Varsayılan `createdAt`; başında `-` azalan sıra |
| `page` | Pozitif güvenli tam sayı | 1 tabanlı; `limit` tek başına verilirse 1 |
| `limit` | 1-100 arası tam sayı | `page` tek başına verilirse 10 |
| `keyword` | 1-200 uzunluğunda metin | Yalnız `/tasks/search` için; bu yolda zorunlu |

Filtreler kesişim olarak uygulanır; ardından sıralama, sonra sayfalama gelir. `total` sayfa diliminden önceki eşleşme sayısıdır. Sonuç yoksa `totalPages: 0`; geçerli fakat aralık dışındaki sayfada boş `data` döner.

Öncelik sırası `low < medium < high`; başlık sırası Türkçe yerel karşılaştırmadır. Sıralama değerleri eşitse `id` her zaman artan yönde belirleyicidir. Query anahtarları tek kez kullanılabilir; bilinmeyen anahtar, boş/geçersiz enum veya sort, `page=0`, `page=01`, kesirli/işaretli sayı ve `limit=101` gibi değerler `400 INVALID_QUERY` döndürür. `keyword` normal `/tasks` yolunda desteklenmez.

## Tamamlanan görev sayısı

```http
GET /reports/completed
```

`200 OK` örneği:

```json
{ "data": { "count": 2 } }
```

Yalnız `completed` kayıtlar sayılır.

## Bekleyen görev sayısı

```http
GET /reports/pending
```

`200 OK` örneği:

```json
{ "data": { "count": 1 } }
```

Yalnız `pending` sayılır; `in_progress` bu sayıya dahil değildir.

## Genel özet

```http
GET /reports/summary
```

`200 OK` örneği:

```json
{ "data": { "total": 4, "pending": 1, "inProgress": 1, "completed": 2 } }
```

Her rapor aynı istek içinde tek bir görev listesi okuyarak hesaplanır. Özette `pending + inProgress + completed = total` olur. Boş depoda tüm sayılar sıfırdır. Rapor yolları query parametresi kabul etmez; örneğin `/reports/summary?status=pending` `400 INVALID_QUERY` döndürür.

## Hatalar

Ortak hata zarfı:

```json
{
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Görev bulunamadı."
  }
}
```

Örneğin `POST /tasks` gövdesi `{"title":"  "}` ise `400` yanıtı:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Görev bilgileri geçersiz.",
    "details": [
      { "field": "title", "message": "Uzunluk 1-200 karakter arasında olmalıdır." }
    ]
  }
}
```

| HTTP | Kod | Örnek neden |
| --- | --- | --- |
| `400` | `INVALID_JSON` | Bozuk JSON veya JSON nesnesi yerine primitive gövde |
| `400` | `INVALID_BODY` | Gövdenin nesne olmaması veya bozuk sıkıştırılmış içerik |
| `400` | `VALIDATION_ERROR` | Başlık eksik/boş, enum yanlış, alan bilinmiyor veya boş `PATCH` |
| `400` | `INVALID_ID` | UUID biçimi geçersiz |
| `400` | `INVALID_QUERY` | Geçersiz, yinelenen veya desteklenmeyen query |
| `400` | `INVALID_PATH` | URL yolunda geçersiz kodlama |
| `404` | `TASK_NOT_FOUND` | Görev yok veya silinmiş |
| `404` | `ROUTE_NOT_FOUND` | Tanımsız endpoint |
| `413` | `PAYLOAD_TOO_LARGE` | 100 KB sınırı aşılmış |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | Yazma isteği JSON içerik türü kullanmıyor |
| `415` | `UNSUPPORTED_ENCODING` | İstek karakter/içerik kodlaması desteklenmiyor |
| `500` | `INTERNAL_ERROR` | Veri saklama veya beklenmeyen sunucu hatası |

Dosya yolu, hata yığını ve iç hata ayrıntıları HTTP yanıtına eklenmez. Veri dosyası bozuksa mevcut içerik korunur. Tanı ve yeniden çalıştırma adımları [test planında](test-plani.md), yapılandırma [README'de](../README.md) açıklanır.
