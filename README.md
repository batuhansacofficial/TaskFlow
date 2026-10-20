# TaskFlow

Node.js ve Express.js ile geliştirilecek görev yönetimi REST API'si.

## Mevcut durum

Proje analiz ve tasarım aşamasındadır. Uygulama kodu, bağımlılıklar ve çalıştırma komutları henüz oluşturulmamıştır. Bu depo şu anda çalışan bir API içermez.

## Belgeler

- [Proje analizi](docs/proje-analizi.md): kaynak gereksinimler, öncelikler, belirsizlikler ve teslim planı.
- [Proje tanıtımı](docs/proje-tanitimi.md): amaç, senaryo ve hedeflenen sistem özellikleri.
- [Veri modeli](docs/veri-modeli.md): önerilen görev yapısı ve veri saklama yaklaşımı.
- [API tasarımı](docs/api-tasarimi.md): önerilen endpoint'ler, HTTP davranışları ve genişletmeler.

## Hedeflenen işlevler

Temel sürüm görev oluşturma, listeleme, detay görüntüleme, güncelleme ve silme işlemlerini sağlayacaktır. Görevler bir çalışana atanabilecek; durum ve öncelik bilgileri güncellenebilecektir. Her API isteğinin metodu, endpoint'i ve zaman damgası logger middleware ile kaydedilecektir.

İsteğe bağlı geliştirmeler alan doğrulama, filtreleme, arama, kullanıcı bazlı listeleme, sayfalama, sıralama, durum raporları ve ayrıntılı dokümantasyondur. Bunların tamamı analizde değerlendirilmiştir; uygulama sırası ve teslim öncelikleri proje analizi belgesindedir.

## Kurulum notunun tamamlanması

Backend oluşturulduğunda bu belgeye desteklenen Node.js sürümü, depoyu indirme, bağımlılıkları kurma, yapılandırma, sunucuyu başlatma ve test etme adımları eklenecektir. Şu aşamada çalıştığı doğrulanmamış komutlar kurulum talimatı olarak sunulmamaktadır.

## Teslim hedefi

Kaynak kodlar ve `package.json`, kısa proje tanıtım dokümanı, tamamlanmış kurulum notu ve beş temel CRUD işleminin gerçek Postman ekran görüntüleri aynı GitHub deposunda bulunmalıdır. Yönerge nihai deponun public olmasını ister; mevcut yerel Git başlangıcı bu teslimin tamamlandığı anlamına gelmez.
