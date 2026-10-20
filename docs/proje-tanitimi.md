# TaskFlow - Proje Tanıtımı

Durum: Geliştirme öncesi tasarım taslağı.

## Amaç

TaskFlow, bir yazılım ekibindeki görevlerin ve çalışan sorumluluklarının takip edilmesi için tasarlanan bir REST API projesidir. Node.js ve Express.js kullanılarak görev oluşturma, listeleme, detay görüntüleme, güncelleme ve silme işlemlerinin sunulması hedeflenir.

## Senaryo

Bir yazılım şirketinde yapılacak işler görev olarak kaydedilir. Görev bir çalışana atanır; işin önceliği ve mevcut durumu tutulur. Ekip, görev listesinden işlerini izler ve iş ilerledikçe ilgili kaydın bilgilerini günceller. Kullanılmayacak bir görev sistemden kaldırılabilir.

Örneğin bir ekip üyesi "Görev API'sini geliştirme" başlıklı iş kaydını oluşturur, bir çalışana atar ve önceliğini yüksek olarak belirler. Çalışmaya başlandığında durum güncellenir; iş tamamlandığında kayıt tamamlandı durumuna geçirilir.

## Temel sistem özellikleri

- Görev ekleme, listeleme, detay görüntüleme, güncelleme ve silme.
- Görev üzerinde çalışan ataması, durum ve öncelik yönetimi.
- Node.js ve Express.js tabanlı routing yapısı.
- Her API isteğinin metot, endpoint ve zaman damgasını kaydeden logger middleware.
- Temel CRUD akışlarının Postman üzerinden doğrulanması.

Görev, tasarımın temel veri varlığıdır. Kullanıcı ve proje yönetimi için ayrı modüller bu ilk kapsamda tanımlanmamıştır. API'nin tüketimi Postman gibi HTTP istemcileri üzerinden planlanmaktadır.

## Değerlendirilecek genişletmeler

Alan doğrulama, duruma ve önceliğe göre filtreleme, görev arama, atanan kişiye göre listeleme, sayfalama, sıralama, tamamlanan/bekleyen görev sayıları ve genel sistem özeti değerlendirmeye alınmıştır. Ayrıntılı API, test ve kullanım belgeleri de çalışan uygulama üzerinden genişletilebilir. Bu özellikler yönergede isteğe bağlıdır; temel teslimin tamamlanmasına göre önceliklendirilir.

## Hedeflenen teslim

Teslim paketi kaynak kodları ve `package.json`, bu kısa proje tanıtımı, çalıştırma adımlarını içeren README ve beş temel CRUD işleminin gerçek Postman ekran görüntülerinden oluşacaktır. Nihai teslim tek public GitHub deposu üzerinden yapılacaktır.

Kaynak: Backend Geliştirme Proje Yönergesi.1.pdf, s.2-7 ve s.12-15. Veri modeli, HTTP sözleşmesi ve saklama yöntemi için seçilen teknik ayrıntılar ayrıca tasarım belgelerinde açıklanır. Bu tanıtım hedeflenen davranışı anlatır; çalışan uygulama veya tamamlanmış test kanıtı değildir.
