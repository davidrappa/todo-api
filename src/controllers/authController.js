const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../database/prisma");
const Joi = require("joi");
const generateTokens = require("../utils/generateTokens");

const registerSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    await registerSchema.validateAsync({ name, email, password });

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists)
      return res.status(400).json({ error: "Email já registrado" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({
      message: "Usuário criado com sucesso",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(400).json({ error: err.details[0].message });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const { accessToken, refreshToken } = generateTokens(user);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  res.json({ accessToken, refreshToken });
}

async function refreshToken(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(401).json({ error: "Token não enviado" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: "Refresh token inválido" });
    }

    const tokens = generateTokens(user);

    // Salva novo refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    res.json(tokens);
  } catch (err) {
    res.status(403).json({ error: "Token expirado ou inválido" });
  }
}

async function logout(req, res) {
  const { id } = req.body;

  await prisma.user.update({
    where: { id },
    data: { refreshToken: null },
  });

  res.json({ message: "Logout feito com sucesso" });
}

module.exports = { register, login, refreshToken, logout };
