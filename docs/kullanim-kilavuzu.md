# TaskFlow - Kullanım Kılavuzu

Kurulum ve configuration [README'de](../README.md), tüm alan ve hata örnekleri [API kılavuzundadır](api.md). Buradaki akış Postman veya başka bir HTTP client ile uygulanabilir. Temel adres varsayılan olarak `http://127.0.0.1:3000` değeridir.

## 1. Server'ı kontrol etme

`npm start` sonrasında `GET /health` gönderin. `200` ve `{"data":{"status":"ok"}}` response'u beklenir.

## 2. Görev oluşturma

`POST /tasks`, `Content-Type: application/json`:

```json
{
  "title": "Görev API'sini geliştirme",
  "description": "Endpoint ve testleri tamamlama",
  "priority": "high"
}
```

`201` response içindeki `data.id` değerini kaydedin. Durum başlangıçta `pending`, atama `null` olur. Sonraki endpoint'lerde `<id>` yerine bu gerçek UUID'yi kullanın. Postman collection içindeki oluşturma request'i kimliği `taskId` değişkenine kendisi kaydeder.

## 3. Atama ve ilerleme

`PATCH /tasks/<id>`:

```json
{ "assignee": "musa", "status": "in_progress" }
```

Gönderilmeyen başlık, açıklama ve öncelik korunur. Görevi `GET /tasks/<id>` ile okuyun. `GET /tasks/assignee/musa` atanan kişinin görevlerini listeler. Çalışan tanımlayıcısında case-sensitive tam eşleşme kullanılır.

Atamayı kaldırmak için `PATCH /tasks/<id>` request body içinde `{"assignee":null}` gönderilir. Çalışanlar ayrı bir kullanıcı tablosunda kayıtlı olmak zorunda değildir.

## 4. Listeyi daraltma

```http
GET /tasks?status=in_progress&priority=high
GET /tasks/search?keyword=endpoint
GET /tasks?sort=-priority&page=1&limit=10
```

Farklı filter'lar birlikte uygulanır. Search başlık ve açıklamayı kapsar; Türkçe harf dönüşümünü gözetir. Pagination kullanıldığında `meta.total` tüm eşleşmeleri, `data` yalnız istenen sayfayı gösterir. Boş eşleşme hata değildir; `200` ve boş liste döner.

## 5. Tamamlama ve rapor

`PATCH /tasks/<id>` request body örneği:

```json
{ "status": "completed" }
```

Ardından `GET /reports/completed`, `GET /reports/pending` veya `GET /reports/summary` gönderin. Özette `total`, `pending`, `inProgress`, `completed` sayıları bulunur. Bekleyen raporu yalnız `pending` kayıtları sayar; devam edenler `inProgress` alanındadır. Raporlar query parametresi kabul etmez.

## 6. Silme

Kaldırılacak görev için `DELETE /tasks/<id>` gönderin. `204` response'u body içermez. Aynı kayda sonraki `GET` request'i `404 TASK_NOT_FOUND` döndürmelidir. Silme işlemi kalıcıdır; yalnız kaldırmak istediğiniz kaydın kimliğini kullanın.

## Veri ve doğrulama

Normal server yeniden başlatmalarında görevler seçilen JSON dosyasından geri okunur. Çalışma verilerini version control kapsamına eklemeyin. Aynı dosyaya bağlı tek server process kullanın. `400` response'unda `error.details` alanını, `500` response'unda server konsolunu inceleyin.

Akışı tekrarlanabilir biçimde çalıştırmak ve gerçek Postman görüntülerini kaydetmek için [test planını](test-plani.md) izleyin.
