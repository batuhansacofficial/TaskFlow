# TaskFlow

Node.js ve Express.js ile görev oluşturma, çalışan atama, durum ve öncelik takibi sağlayan REST API.

## Kapsam

Görev CRUD işlemleri, routing ve her isteğin metot/endpoint/zaman damgasını kaydeden logger uygulanmıştır. İsteğe bağlı alan doğrulama, durum/öncelik filtreleri, Türkçe harf dönüşümünü gözeten arama, çalışana göre listeleme, sayfalama, sıralama ve durum raporları da bulunur.

Temel CRUD akışı gerçek Postman web arayüzünde doğrulanmış ve [altı ekran görüntüsü](docs/test-kanitlari/README.md) eklenmiştir. Public GitHub deposu henüz oluşturulmamıştır; kalan teslim maddesi budur.

## Gereksinimler ve kurulum

- Node.js **24.x**; doğrulanan sürüm: **24.21.0**.
- npm; doğrulanan sürüm: **12.2.0**.
- Uygulama bağımlılığı: **Express 5.3.0**. Sürümler `package-lock.json` ile sabitlenir.

Kaynakları GitHub'dan indirirken depo sayfasında **Code → Download ZIP** seçin, arşivi çıkarın ve terminali çıkarılan projenin `package.json` içeren klasöründe açın. Yerel çalışma kopyası zaten mevcutsa terminali doğrudan bu proje klasöründe açın. Public depo adresi henüz yayımlanmamıştır.

Proje klasöründe bağımlılıkları kurun:

```sh
npm ci
```

Yapılandırma dosyasını kopyalayın. PowerShell:

```powershell
Copy-Item .env.example .env
```

POSIX kabuk:

```sh
cp .env.example .env
```

Sunucuyu başlatın:

```sh
npm start
```

Varsayılan adres `http://127.0.0.1:3000`, sağlık kontrolü `GET /health` yoludur. Beklenen sağlık yanıtı `{"data":{"status":"ok"}}` biçimindedir. Geliştirmede dosya değişikliklerinde yeniden başlatmak için `npm run dev` kullanılır. Sunucu `Ctrl+C` ile durdurulur.

## Yapılandırma

| Değişken | Varsayılan / örnek | Davranış |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Sunucunun dinlediği adres |
| `PORT` | `3000` | 1-65535 arasında tam sayı |
| `DATA_FILE` | `./data/tasks.json` | Görev dosyası; göreli yol sunucunun çalışma dizinine göre çözülür, mutlak yol da kabul edilir |
| `CORS_ORIGIN` | Tanımlı değil | İsteğe bağlı, tek ve tam HTTP origin eşleşmesi; yol veya son `/` içermez |

`DATA_FILE` tanımlı değilse proje içindeki `data/tasks.json` kullanılır. Örneğin `DATA_FILE=./data/postman-tasks.json` ayrı bir yerel deneme dosyası seçer. `.env` Git'e alınmaz; çalışma görevleri ve kullanıcı verileri de commit edilmez. `data/` altındaki JSON çalışma dosyaları Git tarafından dışlanır; `*.example.json` örnekleri istisnadır. `data/` dışında özel bir veri yolu seçerseniz onu da sürüm kontrolünün dışında tutun.

Postman web Browser Agent ile yerel API'ye erişmek için gerekirse `.env` dosyasına `CORS_ORIGIN=https://web.postman.co` ekleyip sunucuyu yeniden başlatın. Bu ayar yalnız belirtilen origin için tarayıcı erişim başlıkları üretir. Yerel istemci kullanımında gerekli değildir.

## Endpoint'ler

| Metot | Yol | İşlem |
| --- | --- | --- |
| `GET` | `/health` | Hizmet durumu |
| `POST` | `/tasks` | Görev oluşturma |
| `GET` | `/tasks` | Listeleme; filtre, sıralama ve sayfalama |
| `GET` | `/tasks/search?keyword=backend` | Başlık ve açıklamada arama |
| `GET` | `/tasks/assignee/:assignee` | Çalışana göre listeleme |
| `GET` | `/tasks/:id` | Görev detayı |
| `PATCH` | `/tasks/:id` | Kısmi güncelleme |
| `DELETE` | `/tasks/:id` | Görev silme |
| `GET` | `/reports/completed` | Tamamlanan sayısı |
| `GET` | `/reports/pending` | Bekleyen sayısı |
| `GET` | `/reports/summary` | Durum dağılımı |

İstek gövdeleri `Content-Type: application/json` kullanır. Görev oluştururken `title` zorunludur. Ayrıntılı örnekler ve hata kodları [API kılavuzundadır](docs/api.md).

## Doğrulama

```sh
npm run check
npm run test:core
npm test
```

`check` JavaScript sözdizimini, `test:core` zorunlu HTTP davranışlarını, `test` tüm HTTP ve repository senaryolarını kontrol eder. Otomatik testler çalışma verisi yerine `tmp/test-data/` altında kendilerine ait geçici dizinleri kullanır. Gerçek Postman doğrulaması için [koleksiyon](postman/TaskFlow.postman_collection.json) ve [yerel ortam](postman/TaskFlow.local.postman_environment.json) dosyalarını içe aktarın; ayrıntılar [test planında](docs/test-plani.md) açıklanır.

## Saklama ve sınırlar

Görevler JSON dosyasında saklanır. Eksik dosya boş başlangıç kabul edilir; ilk başarılı oluşturmada yazılır. Bozuk JSON, geçersiz kayıt ve okuma hataları sessizce boş veriyle değiştirilmez. Aynı dosyanın işlemleri tek süreç içinde sıraya alınır; yazma geçici dosya, dosya senkronizasyonu ve yeniden adlandırma üzerinden yapılır.

Bu sürüm küçük, **tek süreçli** kullanım içindir. Aynı dosyayı kullanan birden fazla sunucu süreci veya yoğun veri yükü için tasarlanmamıştır. Kimlik doğrulama, kullanıcı hesabı, ayrı proje yönetimi ve arayüz içermez. Sunucunun varsayılan dinleme adresi yereldir.

## Belgeler

- [Proje analizi](docs/proje-analizi.md): yönerge kaynakları, zorunlu/isteğe bağlı ayrımı ve teslim durumu.
- [Proje tanıtımı](docs/proje-tanitimi.md): amaç ve kullanım senaryosu.
- [Veri modeli](docs/veri-modeli.md): alanlar ve kalıcılık kuralları.
- [API tasarımı](docs/api-tasarimi.md): sözleşme kararları.
- [API kılavuzu](docs/api.md): tüm endpoint'ler için istek ve yanıt örnekleri.
- [Test planı](docs/test-plani.md): otomatik testler, Postman ve ekran görüntüsü adımları.
- [Doğrulama sonuçları](docs/test-sonuclari.md): son kontroller ve doğrulama sınırları.
- [Kullanım kılavuzu](docs/kullanim-kilavuzu.md): görev yaşam döngüsü.
