const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "segredin";

function authMiddleware(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(403)
      .json({ error: "Acesso negado. Token não encontrado." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId; // Adiciona o userId no request
    next(); // Passa o controle pra próxima função (como as rotas)
  } catch (err) {
    return res.status(401).json({ error: "Token inválido." });
  }
}

module.exports = authMiddleware;
