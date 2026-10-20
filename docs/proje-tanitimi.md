# TaskFlow - Proje Tanıtımı

Durum: Yerel API ve gerçek Postman CRUD kanıtları tamamlanmıştır; public GitHub teslimi beklemektedir.

## Amaç

TaskFlow, bir yazılım ekibindeki görevlerin ve çalışan sorumluluklarının takibi için geliştirilmiş REST API projesidir. Node.js ve Express.js ile görev oluşturma, listeleme, detay görüntüleme, güncelleme ve silme işlemlerini sunar.

## Senaryo

Bir yazılım şirketinde yapılacak işler görev olarak kaydedilir. Görev bir çalışana atanır; işin önceliği ve mevcut durumu tutulur. Ekip, görev listesinden işlerini izler ve iş ilerledikçe ilgili kaydın bilgilerini günceller. Kullanılmayacak bir görev sistemden kaldırılabilir.

Örneğin bir ekip üyesi "Görev API'sini geliştirme" başlıklı iş kaydını oluşturur, bir çalışana atar ve önceliğini yüksek olarak belirler. Çalışmaya başlandığında durum güncellenir; iş tamamlandığında kayıt tamamlandı durumuna geçirilir.

## Temel sistem özellikleri

- Görev ekleme, listeleme, detay görüntüleme, güncelleme ve silme.
- Görev üzerinde çalışan ataması, durum ve öncelik yönetimi.
- Node.js ve Express.js tabanlı routing yapısı.
- Her API isteğinin metot, endpoint ve zaman damgasını kaydeden logger middleware.
- Yeniden başlatma sonrasında kayıtları koruyan JSON dosyası ve merkezi hata yönetimi.

Görev, sistemin temel veri varlığıdır. Kullanıcı ve proje yönetimi için ayrı modüller bulunmaz. Çalışan ataması metin tanımlayıcısıyla yapılır; kullanıcı hesabı veya oturum açma gerektirmez. API, Postman gibi HTTP istemcileriyle kullanılır.

## Uygulanan isteğe bağlı genişletmeler

Alan doğrulama; duruma ve önceliğe göre birleşik filtreleme; başlık ve açıklamada Türkçe harf dönüşümünü gözeten arama; atanan kişiye göre listeleme; sayfalama ve sıralama uygulanmıştır. Rapor endpoint'leri tamamlanan ve bekleyen görev sayılarını ve genel durum dağılımını verir. API, test ve kullanım kılavuzları bu davranışları açıklar. Bu özellikler yönergede isteğe bağlıdır; temel CRUD gereksinimlerinden ayrı değerlendirilir.

Görevler varsayılan olarak `data/tasks.json` içinde tutulur. Veri dosyası bulunmuyorsa boş başlangıç yapılır; bozuk veya okunamayan mevcut veri için hata verilir. Aynı dosyaya erişim tek süreç içinde sıraya alınır. Saklama yaklaşımı küçük, tek süreçli kullanımla sınırlıdır.

## Hedeflenen teslim

Kaynak kodları, `package.json`/kilit dosyası, bu tanıtım, çalıştırma README'si, tasarım ve kullanım belgeleri, otomatik testler ve Postman koleksiyonu depoda bulunur. Beş temel CRUD işlemi ve silme sonrası bulunamama kontrolünün [gerçek Postman ekran görüntüleri](test-kanitlari/README.md) eklenmiştir. Nihai teslimin yapılacağı tek public GitHub deposu henüz oluşturulmamıştır.

Kaynak: Backend Geliştirme Proje Yönergesi.1.pdf, s.2-7 ve s.12-15. Yönergenin belirlemediği veri modeli, HTTP sözleşmesi ve saklama kararları [analizde](proje-analizi.md) ayrıca ayrılır. Otomatik test kapsamı ve Postman kanıtlarının tekrarlanması [test planında](test-plani.md) açıklanır.
