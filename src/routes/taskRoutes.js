const express = require("express");
const router = express.Router();
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const authMiddleware = require("../middleware/authMiddleware");

// Proteger as rotas com o middleware de autenticação
router.post("/", authMiddleware, createTask); // Criar tarefa
router.get("/", authMiddleware, getTasks); // Buscar tarefas
router.put("/:id", authMiddleware, updateTask); // Atualizar tarefa
router.delete("/:id", authMiddleware, deleteTask); // Deletar tarefa

module.exports = router;
