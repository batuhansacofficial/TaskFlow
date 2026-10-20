# TaskFlow - Proje Tanıtımı

Durum: API, gerçek Postman CRUD evidence ve [public GitHub teslimi](https://github.com/batuhansacofficial/TaskFlow) tamamlanmıştır.

## Amaç

TaskFlow, bir yazılım ekibindeki görevlerin ve çalışan sorumluluklarının takibi için geliştirilmiş REST API projesidir. Node.js ve Express.js ile görev oluşturma, listeleme, detay görüntüleme, güncelleme ve silme işlemlerini sunar.

## Senaryo

Bir yazılım şirketinde yapılacak işler görev olarak kaydedilir. Görev bir çalışana atanır; işin önceliği ve mevcut durumu tutulur. Ekip, görev listesinden işlerini izler ve iş ilerledikçe ilgili kaydın bilgilerini günceller. Kullanılmayacak bir görev sistemden kaldırılabilir.

Örneğin bir ekip üyesi "Görev API'sini geliştirme" başlıklı iş kaydını oluşturur, bir çalışana atar ve önceliğini yüksek olarak belirler. Çalışmaya başlandığında durum güncellenir; iş tamamlandığında kayıt tamamlandı durumuna geçirilir.

## Temel sistem özellikleri

- Görev ekleme, listeleme, detay görüntüleme, güncelleme ve silme.
- Görev üzerinde çalışan ataması, durum ve öncelik yönetimi.
- Node.js ve Express.js tabanlı routing yapısı.
- Her API request'inin HTTP method, endpoint ve timestamp alanlarını kaydeden logger middleware.
- Yeniden başlatma sonrasında kayıtları koruyan JSON dosyası ve merkezi hata yönetimi.

Görev, sistemin temel veri varlığıdır. Kullanıcı ve proje yönetimi için ayrı modüller bulunmaz. Çalışan ataması metin tanımlayıcısıyla yapılır; kullanıcı hesabı veya oturum açma gerektirmez. API, Postman gibi HTTP client'larıyla kullanılır.

## Uygulanan isteğe bağlı genişletmeler

Field validation; duruma ve önceliğe göre birleşik filtering; başlık ve açıklamada Türkçe harf dönüşümünü gözeten search; atanan kişiye göre listeleme; pagination ve sorting uygulanmıştır. Rapor endpoint'leri tamamlanan ve bekleyen görev sayılarını ve genel durum dağılımını verir. API, test ve kullanım kılavuzları bu davranışları açıklar. Bu özellikler yönergede isteğe bağlıdır; temel CRUD gereksinimlerinden ayrı değerlendirilir.

Görevler varsayılan olarak `data/tasks.json` içinde tutulur. Veri dosyası bulunmuyorsa boş başlangıç yapılır; bozuk veya okunamayan mevcut veri için hata verilir. Aynı dosyaya erişim tek process içinde sıraya alınır. Saklama yaklaşımı küçük, single-process kullanımla sınırlıdır.

## Hedeflenen teslim

Source code, `package.json`/lockfile, bu tanıtım, çalıştırma README'si, tasarım ve kullanım belgeleri, automated test'ler ve Postman collection [public TaskFlow repository](https://github.com/batuhansacofficial/TaskFlow) içinde bulunur. Beş temel CRUD işlemi ve silme sonrası bulunamama kontrolünün [gerçek Postman ekran görüntüleri](test-kanitlari/README.md) de `main` branch'ine push edilmiştir.

Kaynak: Backend Geliştirme Proje Yönergesi.1.pdf, s.2-7 ve s.12-15. Yönergenin belirlemediği veri modeli, HTTP contract ve saklama kararları [analizde](proje-analizi.md) ayrıca ayrılır. Automated test kapsamı ve Postman kanıtlarının tekrarlanması [test planında](test-plani.md) açıklanır.
