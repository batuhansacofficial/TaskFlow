# TaskFlow - Test Planı

Bu plan otomatik denetimleri, gerçek Postman akışını ve teslim kanıtlarını ayrı olarak tanımlar. Son çalıştırma sonuçları [doğrulama sonuçlarında](test-sonuclari.md) tutulur. Gerçek Postman web arayüzünde sağlık ve temel CRUD akışı doğrulanmış, [altı ekran görüntüsü](test-kanitlari/README.md) eklenmiştir. Koleksiyonun 37 isteğinin otomatik HTTP denetimi, manuel Postman akışından ayrı bir kontroldür.

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
| `npm run check` | `src/`, `test/`, `scripts/` JavaScript dosyalarının sözdizimi |
| `npm run test:core` | Zorunlu kapsam grubundaki gerçek yerel HTTP istekleri |
| `npm test` | Tüm HTTP, repository ve sunucu süreci testleri |
| `test/api.test.js` | CRUD, logger, kimlik/gövde/query denetimi, filtreler, arama, sıralama, sayfalama, raporlar ve CORS |
| `test/tasks.repository.test.js` | Disk kalıcılığı, eşzamanlılık, kopya yalıtımı, şema/UUID bütünlüğü, bozuk dosyanın korunması ve hatadan sonra devam |
| `test/server.test.js` | Gerçek giriş dosyasının başlaması, süreç yeniden açıldığında veri, bozuk başlangıç dosyası ve geçersiz port |

Testler kendi HTTP portlarını ve `tmp/test-data/` altındaki geçici dizinlerini kullanır. Varsayılan çalışma verisini silmez veya test kaydıyla doldurmaz. Test temizliği yalnız ilgili testin oluşturduğu dizinleri kaldırır. Windows'ta POSIX `SIGTERM` davranışının denetimi gerekçeli olarak atlanır; bu platform sınırı [sonuçlarda](test-sonuclari.md) açıklanır.

Beklenen davranışlar:

- Oluşturmada `201`, liste/detay/güncellemede `200`, silmede boş `204`; silinen kimlikte `404`.
- Atama/durum/öncelik değişiklikleri okunabilir; gönderilmeyen alanlar ve oluşturma zamanı korunur.
- Hatalı veri mevcut kayıtları değiştirmez; dosya ve hata yığını HTTP yanıtına sızmaz.
- Aynı veri dosyasını kullanan repository örneklerinin eşzamanlı işlemlerinde kayıt kaybolmaz.
- Listeleme filtrelerinin kesişimi, Türkçe arama, tam çalışan eşleşmesi, sayfa sınırları, kararlı sıralama ve rapor toplamları tutarlıdır.

## Postman hazırlığı

API'yi `npm start` ile çalıştırın. Varsayılan temel adres `http://127.0.0.1:3000` değeridir. Ayrı deneme verisi istenirse `.env` içinde `DATA_FILE=./data/postman-tasks.json` seçin; yapılandırma değişince sunucuyu yeniden başlatın. `data/` altındaki çalışma JSON dosyaları sürüm kontrolünün dışındadır.

Postman web kullanırken oturum açın. Yerel API için Browser Agent veya Desktop Agent kullanılır; Cloud Agent yerel kaynaklara erişemez. Kaydedilen manuel akış Desktop Agent `0.5.2` üzerinden yapılmıştır. Browser Agent seçeneğinde `.env` içine `CORS_ORIGIN=https://web.postman.co` ekleyip sunucuyu yeniden başlatın. Origin tam eşleşmelidir. Tarayıcı yerel ağ izni isterse API'ye erişim için bu izni verin. Agent seçeneklerinin davranışı [Postman belgesinde](https://learning.postman.com/docs/getting-started/basics/about-postman-agent) açıklanır.

## Koleksiyon ve ortamı içe aktarma

1. Postman çalışma alanında **Use resources or import / Import** yolunu açın; mevcut sürüm yalnız **Import** düğmesi de gösterebilir.
2. [TaskFlow.postman_collection.json](../postman/TaskFlow.postman_collection.json) ve [TaskFlow.local.postman_environment.json](../postman/TaskFlow.local.postman_environment.json) dosyalarını seçin veya içe aktarma alanına sürükleyin.
3. **TaskFlow Görev Yönetimi API** koleksiyonunu ve **TaskFlow Yerel** ortamını seçin. `baseUrl` değerinin çalışan sunucuyla aynı olduğunu kontrol edin.
4. `Hizmet durumu` isteğini gönderin; `200` ve `data.status: "ok"` bekleyin.

Dosya içe aktarma adımları [Postman içe aktarma belgesinde](https://learning.postman.com/docs/getting-started/importing-and-exporting/importing-data) açıklanır.

Koleksiyon 37 istek içerir:

| Klasör | İstek sayısı | Amaç |
| --- | --- | --- |
| `00 - Sağlık kontrolü` | 1 | API erişimini kontrol etme |
| `01 - Zorunlu CRUD` | 6 | Oluşturma, liste, detay, güncelleme, silme ve silme sonrası `404` |
| `02 - İsteğe bağlı özellikler` | 19 | Dört deneme kaydı, filtre/arama/çalışan/sayfa/sıralama/rapor istekleri ve dört temizleme isteği |
| `03 - Doğrulama ve hata örnekleri` | 11 | Beklenen `400`, `413`, `415` yanıtları |

Oluşturma yanıtı `taskId` koleksiyon değişkenine kaydedilir. İsteğe bağlı örnekler `optionalTask1`-`optionalTask4` değişkenlerini kullanır. Bunları ortamda aynı adlarla gölgelemeyin. Klasör ve istek sırasını koruyun; detay/güncelleme/silme için önce ilgili oluşturma isteği çalışmalıdır.

## Collection Runner

Koleksiyonu seçip **Run** ile açın. Arayüz sunuyorsa **Functional → Local** çalıştırmasını ve **TaskFlow Yerel** ortamını seçin. Tek iterasyonla, tüm klasörleri sıraları korunmuş biçimde çalıştırın. Sonuçları incelemek için yanıtları oturumda saklama seçeneğini açık tutun. Başarılı koşuda tüm `pm.test` denetimleri geçmelidir. Yerel çalıştırma seçenekleri [Collection Runner belgesinde](https://learning.postman.com/docs/tests-and-scripts/running-collections/intro-to-collection-runs) açıklanır.

Hata örneklerinde beklenen durum kodunun gelmesi başarılı testtir. Son dört isteğe bağlı temizleme isteği yalnız koleksiyonun oluşturduğu dört kaydı siler. Bir koşu yarıda kesilirse ilgili oluşturma yanıtlarının kimliklerini not edin ve yalnız bu deneme kayıtlarını temizleyin; çalışma dosyasını topluca boşaltmayın.

## Gerçek ekran görüntüleri

Temel CRUD akışı manuel olarak çalıştırılmış ve aşağıdaki görüntüler eklenmiştir. Akışı tekrarlamak için `01 - Zorunlu CRUD` klasörünü istek istek gönderin. Collection Runner sonucu tek başına bu görüntülerin yerine geçmez. Görüntüde metot, tam URL, durum kodu ve ilgili istek/yanıt alanları okunabilir olmalıdır.

| Sıra | Gözlem | Kaydedilen görüntü |
| --- | --- | --- |
| 1 | `POST /tasks`: gönderilen alanlar, dönen UUID ve `201` | [01-gorev-ekleme.png](test-kanitlari/01-gorev-ekleme.png) |
| 2 | `GET /tasks`: aynı UUID'nin listede olması ve `200` | [02-gorev-listeleme.png](test-kanitlari/02-gorev-listeleme.png) |
| 3 | `GET /tasks/:id`: aynı kayıt ve `200` | [03-gorev-detayi.png](test-kanitlari/03-gorev-detayi.png) |
| 4 | `PATCH /tasks/:id`: atama/durum/öncelik değişiklikleri ve `200` | [04-gorev-guncelleme.png](test-kanitlari/04-gorev-guncelleme.png) |
| 5 | `DELETE /tasks/:id`: `204` ve boş gövde | [05-gorev-silme.png](test-kanitlari/05-gorev-silme.png) |
| 6 | Silinen kayda `GET`: `404`, Headers sekmesi | [06-silinen-gorev-kontrolu.png](test-kanitlari/06-silinen-gorev-kontrolu.png) |

Dosyalar `docs/test-kanitlari/` altındadır. Görüntüler yalnız istek/yanıt alanlarına kadrajlanmış, içerikleri değiştirilmemiştir. Altıncı görüntüde JSON hata kodu görünmez; `404` durumu ve yanıt başlıkları görünür. Hata zarfı otomatik testlerde ayrıca denetlenir. Yeni görüntülerde hesap menüsü, e-posta ve oturum bilgilerini kadraja almayın. Kanıt düzeni [ilgili dizinin açıklamasında](test-kanitlari/README.md) bulunur. Logger için ayrıca sunucu konsolunda aynı isteklerin `method`, `endpoint`, `timestamp` alanlarını kontrol edin.

## Hata durumunda

- Bağlantı kurulamıyorsa sunucu adresini, portunu ve seçilen Postman agent'ını kontrol edin.
- Tarayıcı CORS hatasında `CORS_ORIGIN` tam eşleşmesini ve yeniden başlatmayı kontrol edin.
- `400` yanıtında `error.code` ve varsa `error.details` alanlarını inceleyin; testin kasıtlı hata örneği olup olmadığını kontrol edin.
- Bozuk veri dosyası nedeniyle `500` veya başlangıç hatası varsa sunucuyu durdurun, dosyayı koruyun ve geçerli bir yedekten geri yükleyin. Mevcut dosyayı boş diziyle değiştirmek tanı veya onarım adımı değildir.
- Kalan public GitHub teslimi tamamlandığında [analizin teslim listesini](proje-analizi.md) ve [sonuç belgesini](test-sonuclari.md) gerçek duruma göre güncelleyin.
