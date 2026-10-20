# TaskFlow - Test Planı

Bu plan otomatik kontrolleri, gerçek Postman akışını ve teslim kanıtlarını ayrı olarak tanımlar. Son çalıştırma sonuçları [doğrulama sonuçlarında](test-sonuclari.md) tutulur. Gerçek Postman web arayüzünde health check ve temel CRUD akışı doğrulanmış, [altı ekran görüntüsü](test-kanitlari/README.md) eklenmiştir. Collection içindeki 37 request için yapılan otomatik HTTP denetimi, manuel Postman akışından ayrı bir kontroldür.

## Otomatik kontroller

Proje kökünde:

```sh
npm ci
npm run check
npm run test:core
npm test
```

| Komut / dosya | Kapsam |
| --- | --- |
| `npm run check` | `src/`, `test/`, `scripts/` JavaScript dosyalarının syntax check işlemi |
| `npm run test:core` | Zorunlu kapsam grubundaki gerçek yerel HTTP request akışı |
| `npm test` | Tüm HTTP, repository ve server process testleri |
| `test/api.test.js` | CRUD, logger, kimlik/body/query denetimi, filter seçenekleri, search, sorting, pagination, raporlar ve CORS |
| `test/tasks.repository.test.js` | Disk persistence, concurrency, copy isolation, schema/UUID bütünlüğü, bozuk dosyanın korunması ve hatadan sonra devam |
| `test/server.test.js` | Gerçek giriş dosyasıyla başlatma, process yeniden başlatıldığında verilerin korunması, bozuk başlangıç dosyası ve geçersiz port |

Testler kendi HTTP portlarını ve `tmp/test-data/` altındaki geçici dizinlerini kullanır. Varsayılan çalışma verisini silmez veya test kaydıyla doldurmaz. Test temizliği yalnız ilgili testin oluşturduğu dizinleri kaldırır. Windows'ta POSIX `SIGTERM` davranışının denetimi gerekçeli olarak atlanır; bu platform sınırı [sonuçlarda](test-sonuclari.md) açıklanır.

Beklenen davranışlar:

- Oluşturmada `201`, liste/detay/güncellemede `200`, silmede boş `204`; silinen kimlikte `404`.
- Atama/durum/öncelik değişiklikleri okunabilir; gönderilmeyen alanlar ve oluşturma zamanı korunur.
- Hatalı veri mevcut kayıtları değiştirmez; dosya ve stack trace HTTP response içine sızmaz.
- Aynı veri dosyasını kullanan repository örneklerinin concurrent işlemlerinde kayıt kaybolmaz.
- Listelemede filter intersection, Türkçe search, çalışanın tam eşleşmesi, sayfa sınırları, kararlı sorting ve rapor toplamları tutarlıdır.

## Postman hazırlığı

API'yi `npm start` ile çalıştırın. Varsayılan temel adres `http://127.0.0.1:3000` değeridir. Ayrı deneme verisi istenirse `.env` içinde `DATA_FILE=./data/postman-tasks.json` seçin; configuration değişince server uygulamasını yeniden başlatın. `data/` altındaki çalışma JSON dosyaları version control dışındadır.

Postman web kullanırken oturum açın. Yerel API için Browser Agent veya Desktop Agent kullanılır; Cloud Agent yerel kaynaklara erişemez. Kaydedilen manuel akış Desktop Agent `0.5.2` üzerinden yapılmıştır. Browser Agent seçeneğinde `.env` içine `CORS_ORIGIN=https://web.postman.co` ekleyip server uygulamasını yeniden başlatın. Origin tam eşleşmelidir. Tarayıcı yerel ağ izni isterse API'ye erişim için bu izni verin. Agent seçeneklerinin davranışı [Postman belgesinde](https://learning.postman.com/docs/getting-started/basics/about-postman-agent) açıklanır.

## Collection ve environment içe aktarma

1. Postman çalışma alanında **Use resources or import / Import** yolunu açın; mevcut sürüm yalnız **Import** düğmesi de gösterebilir.
2. [TaskFlow.postman_collection.json](../postman/TaskFlow.postman_collection.json) ve [TaskFlow.local.postman_environment.json](../postman/TaskFlow.local.postman_environment.json) dosyalarını seçin veya içe aktarma alanına sürükleyin.
3. Collection olarak **TaskFlow Görev Yönetimi API**, environment olarak **TaskFlow Yerel** seçin. `baseUrl` değerinin çalışan server ile aynı olduğunu kontrol edin.
4. `Hizmet durumu` request adımını çalıştırın; `200` ve `data.status: "ok"` bekleyin.

Dosya içe aktarma adımları [Postman içe aktarma belgesinde](https://learning.postman.com/docs/getting-started/importing-and-exporting/importing-data) açıklanır.

Collection 37 request içerir:

| Klasör | Request sayısı | Amaç |
| --- | --- | --- |
| `00 - Sağlık kontrolü` | 1 | API erişimini kontrol etme |
| `01 - Zorunlu CRUD` | 6 | Oluşturma, liste, detay, güncelleme, silme ve silme sonrası `404` |
| `02 - İsteğe bağlı özellikler` | 19 | Dört deneme kaydı, filtering/search/çalışan/sayfa/sorting/rapor request adımları ve dört temizleme request adımı |
| `03 - Doğrulama ve hata örnekleri` | 11 | Beklenen `400`, `413`, `415` response kodları |

Oluşturma response içindeki kimlik `taskId` collection variable içine kaydedilir. İsteğe bağlı örnekler `optionalTask1`-`optionalTask4` değişkenlerini kullanır. Environment içinde bu adları tekrar tanımlamayın. Klasör ve request sırasını koruyun; detay/güncelleme/silme için önce ilgili oluşturma request adımı çalışmalıdır.

## Collection Runner ile çalıştırma

İlgili collection için **Run** seçeneğini açın. Arayüz sunuyorsa **Functional → Local** çalıştırmasını ve **TaskFlow Yerel** environment seçeneğini seçin. Tek iterasyonla, tüm klasörleri sıraları korunmuş biçimde çalıştırın. Sonuçları incelemek için response verilerini oturumda saklama seçeneğini açık tutun. Başarılı koşuda tüm `pm.test` denetimleri geçmelidir. Yerel çalıştırma seçenekleri [Collection Runner belgesinde](https://learning.postman.com/docs/tests-and-scripts/running-collections/intro-to-collection-runs) açıklanır.

Hata örneklerinde beklenen status code değerinin gelmesi başarılı testtir. Son dört isteğe bağlı temizleme request adımı yalnız ilgili collection ile oluşturulan dört kaydı siler. Bir koşu yarıda kesilirse ilgili oluşturma response içindeki kimlikleri not edin ve yalnız bu deneme kayıtlarını temizleyin; çalışma dosyasını topluca boşaltmayın.

## Gerçek ekran görüntüleri

Temel CRUD akışı manuel olarak çalıştırılmış ve aşağıdaki görüntüler eklenmiştir. Akışı tekrarlamak için `01 - Zorunlu CRUD` klasöründeki request sırasını izleyin. Collection Runner sonucu tek başına bu görüntülerin yerine geçmez. Görüntüde HTTP method, tam URL, status code ve ilgili request/response alanları okunabilir olmalıdır.

| Sıra | Gözlem | Kaydedilen görüntü |
| --- | --- | --- |
| 1 | `POST /tasks`: gönderilen alanlar, dönen UUID ve `201` | [01-gorev-ekleme.png](test-kanitlari/01-gorev-ekleme.png) |
| 2 | `GET /tasks`: aynı UUID'nin listede olması ve `200` | [02-gorev-listeleme.png](test-kanitlari/02-gorev-listeleme.png) |
| 3 | `GET /tasks/:id`: aynı kayıt ve `200` | [03-gorev-detayi.png](test-kanitlari/03-gorev-detayi.png) |
| 4 | `PATCH /tasks/:id`: atama/durum/öncelik değişiklikleri ve `200` | [04-gorev-guncelleme.png](test-kanitlari/04-gorev-guncelleme.png) |
| 5 | `DELETE /tasks/:id`: `204` ve boş body | [05-gorev-silme.png](test-kanitlari/05-gorev-silme.png) |
| 6 | Silinen kayda `GET`: `404`, Headers sekmesi | [06-silinen-gorev-kontrolu.png](test-kanitlari/06-silinen-gorev-kontrolu.png) |

Dosyalar `docs/test-kanitlari/` altındadır. Görüntüler yalnız request/response alanlarını gösterecek biçimde kadrajlanmış, içerikleri değiştirilmemiştir. Altıncı görüntüde JSON error code görünmez; `404` durumu ve response header alanları görünür. Error envelope, otomatik testlerde ayrıca denetlenir. Yeni görüntülerde hesap menüsü, e-posta ve oturum bilgilerini kadraja almayın. Kanıt düzeni [ilgili dizinin açıklamasında](test-kanitlari/README.md) bulunur. Logger için ayrıca server konsolunda aynı request adımlarının `method`, `endpoint`, `timestamp` alanlarını kontrol edin.

## Hata durumunda

- Bağlantı kurulamıyorsa server adresini, portunu ve seçilen Postman agent seçeneğini kontrol edin.
- Tarayıcı CORS hatasında `CORS_ORIGIN` tam eşleşmesini ve yeniden başlatmayı kontrol edin.
- `400` response alındığında `error.code` ve varsa `error.details` alanlarını inceleyin; testin kasıtlı hata örneği olup olmadığını kontrol edin.
- Bozuk veri dosyası nedeniyle `500` veya başlangıç hatası varsa server uygulamasını durdurun, dosyayı koruyun ve geçerli bir yedekten geri yükleyin. Mevcut dosyayı boş diziyle değiştirmek tanı veya onarım adımı değildir.
- Yeni test veya kanıt eklendiğinde [analizin teslim listesini](proje-analizi.md) ve [sonuç belgesini](test-sonuclari.md) gerçek duruma göre güncelleyin.
