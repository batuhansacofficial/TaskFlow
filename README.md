# TaskFlow

Node.js ve Express.js ile görev oluşturma, çalışan atama, durum ve öncelik takibi sağlayan REST API.

## Kapsam

Görevler için CRUD işlemleri ve routing uygulanmıştır. Logger, her request için HTTP method, endpoint ve timestamp değerlerini kaydeder. İsteğe bağlı kapsamda field validation, durum ve önceliğe göre filtering, Türkçe harf dönüşümünü gözeten search, çalışana göre listeleme, pagination, sorting ve durum raporları da bulunur.

Temel CRUD akışı gerçek Postman web arayüzünde doğrulanmış ve [altı ekran görüntüsü](docs/test-kanitlari/README.md) eklenmiştir. Source code, belgeler, Postman collection ve test kanıtları [herkese açık GitHub repository](https://github.com/batuhansacofficial/TaskFlow) içinde, `main` branch altında bulunur.

## Gereksinimler ve kurulum

- Node.js **24.x**; doğrulanan sürüm: **24.21.0**.
- npm; doğrulanan sürüm: **12.2.0**.
- Uygulama, dependency olarak **Express.js 5.3.0** kullanır. Sürümler `package-lock.json` ile sabitlenir.

Repository içeriğini clone edin ve proje klasörüne geçin:

```sh
git clone https://github.com/batuhansacofficial/TaskFlow.git
cd TaskFlow
```

Alternatif olarak [repository sayfasında](https://github.com/batuhansacofficial/TaskFlow) **Code → Download ZIP** seçeneğini kullanın ve arşivi çıkarın. Terminali `package.json` içeren klasörde açın. Yerel working copy zaten mevcutsa doğrudan bu proje klasörünü kullanın.

Proje klasöründe dependency kurulumunu yapın:

```sh
npm ci
```

Configuration dosyasını kopyalayın. PowerShell için:

```powershell
Copy-Item .env.example .env
```

POSIX shell için:

```sh
cp .env.example .env
```

Uygulamayı başlatın:

```sh
npm start
```

Varsayılan adres `http://127.0.0.1:3000`, health check endpoint adresi ise `GET /health` olarak tanımlıdır. Beklenen health check response değeri `{"data":{"status":"ok"}}` biçimindedir. Geliştirme sırasında dosya değiştiğinde otomatik yeniden başlatma için `npm run dev` kullanılır. Server `Ctrl+C` ile durdurulur.

## Configuration

| Değişken | Varsayılan / örnek | Davranış |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Server için dinleme adresi |
| `PORT` | `3000` | 1-65535 arasında tam sayı |
| `DATA_FILE` | `./data/tasks.json` | Görev dosyası; göreli yol server çalışma dizinine göre çözülür, mutlak yol da kabul edilir |
| `CORS_ORIGIN` | Tanımlı değil | İsteğe bağlı, tek ve tam HTTP origin eşleşmesi; yol veya son `/` içermez |

`DATA_FILE` tanımlı değilse proje içindeki `data/tasks.json` kullanılır. Örneğin `DATA_FILE=./data/postman-tasks.json` ayrı bir yerel deneme dosyası seçer. `.env` Git ile takip edilmez; çalışma görevleri ve kullanıcı verileri de commit kapsamına alınmaz. `data/` altındaki JSON çalışma dosyaları Git tarafından dışlanır; `*.example.json` örnekleri istisnadır. `data/` dışında özel bir veri yolu seçerseniz onu da version control dışında tutun.

Postman web arayüzündeki Browser Agent ile yerel API'ye erişmek için gerekirse `.env` dosyasına `CORS_ORIGIN=https://web.postman.co` ekleyip server uygulamasını yeniden başlatın. Bu ayar yalnız belirtilen origin için tarayıcı erişimine ilişkin HTTP header değerleri üretir. Yerel client kullanımında gerekli değildir.

## Endpoint listesi

| HTTP method | Endpoint | İşlem |
| --- | --- | --- |
| `GET` | `/health` | Hizmet durumu |
| `POST` | `/tasks` | Görev oluşturma |
| `GET` | `/tasks` | Listeleme; filter, sorting ve pagination |
| `GET` | `/tasks/search?keyword=backend` | Başlık ve açıklamada search |
| `GET` | `/tasks/assignee/:assignee` | Çalışana göre listeleme |
| `GET` | `/tasks/:id` | Görev detayı |
| `PATCH` | `/tasks/:id` | Kısmi güncelleme |
| `DELETE` | `/tasks/:id` | Görev silme |
| `GET` | `/reports/completed` | Tamamlanan sayısı |
| `GET` | `/reports/pending` | Bekleyen sayısı |
| `GET` | `/reports/summary` | Durum dağılımı |

Body içeren request için `Content-Type: application/json` kullanılır. Görev oluştururken `title` zorunludur. Ayrıntılı örnekler ve error code listesi [API kılavuzundadır](docs/api.md).

## Doğrulama

```sh
npm run check
npm run test:core
npm test
```

`check` JavaScript syntax kontrolünü, `test:core` zorunlu HTTP davranışlarını, `test` ise tüm HTTP ve repository senaryolarını denetler. Otomatik testler, çalışma verisi yerine `tmp/test-data/` altında kendilerine ait geçici dizinleri kullanır. Gerçek Postman doğrulaması için [collection](postman/TaskFlow.postman_collection.json) ve [yerel environment](postman/TaskFlow.local.postman_environment.json) dosyalarını içe aktarın; ayrıntılar [test planında](docs/test-plani.md) açıklanır.

## Saklama ve sınırlar

Görevler JSON dosyasında saklanır. Dosyanın bulunmaması, boş bir görev listesiyle başlangıç olarak kabul edilir; dosya ilk başarılı görev oluşturma işleminde yazılır. Bozuk JSON, geçersiz kayıt ve okuma hataları sessizce boş veriyle değiştirilmez. Aynı dosya üzerindeki işlemler tek process içinde sıraya alınır; yazma işlemi geçici dosya, file sync ve rename adımlarıyla yapılır.

Bu sürüm küçük ölçekli, **single-process** kullanım içindir. Aynı dosyayı kullanan birden fazla server process veya yoğun veri yükü için tasarlanmamıştır. Authentication, kullanıcı hesabı, ayrı proje yönetimi ve arayüz içermez. Server için varsayılan dinleme adresi yereldir.

## Belgeler

- [Proje analizi](docs/proje-analizi.md): yönerge kaynakları, zorunlu/isteğe bağlı ayrımı ve teslim durumu.
- [Proje tanıtımı](docs/proje-tanitimi.md): amaç ve kullanım senaryosu.
- [Veri modeli](docs/veri-modeli.md): alanlar ve persistence kuralları.
- [API tasarımı](docs/api-tasarimi.md): sözleşme kararları.
- [API kılavuzu](docs/api.md): tüm endpoint adresleri için request ve response örnekleri.
- [Test planı](docs/test-plani.md): otomatik testler, Postman ve ekran görüntüsü adımları.
- [Doğrulama sonuçları](docs/test-sonuclari.md): son kontroller ve doğrulama sınırları.
- [Kullanım kılavuzu](docs/kullanim-kilavuzu.md): görev yaşam döngüsü.
