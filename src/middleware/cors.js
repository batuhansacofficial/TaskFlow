export function cors(allowedOrigin) {
  return (req, res, next) => {
    if (!allowedOrigin) return next();
    res.vary('Origin');
    if (req.headers.origin !== allowedOrigin) return next();

    res.set('Access-Control-Allow-Origin', allowedOrigin);
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Max-Age', '600');
      if (req.headers['access-control-request-private-network'] === 'true') {
        res.set('Access-Control-Allow-Private-Network', 'true');
      }
      return res.status(204).end();
    }
    next();
  };
}
