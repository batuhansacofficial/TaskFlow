import { HttpError } from '../lib/http-error.js';

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let problem = error;
  if (error.type === 'entity.parse.failed') {
    problem = new HttpError(400, 'INVALID_JSON', 'Geçerli bir JSON nesnesi gönderilmelidir.');
  } else if (error.type === 'entity.too.large') {
    problem = new HttpError(413, 'PAYLOAD_TOO_LARGE', 'İstek gövdesi 100 KB sınırını aşamaz.');
  } else if (error.type === 'charset.unsupported' || error.type === 'encoding.unsupported') {
    problem = new HttpError(415, 'UNSUPPORTED_ENCODING', 'İstek kodlaması desteklenmiyor.');
  } else if (!(error instanceof HttpError) && error.status === 400 && error.expose === true) {
    problem = new HttpError(400, 'INVALID_BODY', 'İstek gövdesi okunamadı. İçerik ve sıkıştırma biçimini kontrol edin.');
  } else if (error instanceof URIError) {
    problem = new HttpError(400, 'INVALID_PATH', 'İstek yolunun kodlaması geçersiz.');
  }

  if (!(problem instanceof HttpError)) {
    problem = new HttpError(500, 'INTERNAL_ERROR', 'İşlem tamamlanamadı. Sunucu kayıtlarını kontrol edin.');
    console.error('İstek işlenirken sunucu hatası oluştu:', error.message);
  }

  const payload = { code: problem.code, message: problem.message };
  if (problem.details) payload.details = problem.details;
  res.status(problem.status).json({ error: payload });
}
