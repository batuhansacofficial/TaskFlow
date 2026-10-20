export function requestLogger(write = console.log) {
  return (req, res, next) => {
    write(JSON.stringify({
      method: req.method,
      endpoint: req.originalUrl,
      timestamp: new Date().toISOString(),
    }));
    next();
  };
}
