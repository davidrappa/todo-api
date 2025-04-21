const prisma = require("../database/prisma");
const Joi = require("joi");

const taskSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  done: Joi.boolean(),
});

async function createTask(req, res) {
  try {
    const { title, done } = req.body;

    await taskSchema.validateAsync({ title, done });

    const task = await prisma.task.create({
      data: {
        title,
        userId: req.userId,
        done: done || false,
      },
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.details[0].message });
  }
}

async function getTasks(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const tasks = await prisma.task.findMany({
    where: {
      userId: req.userId,
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await prisma.task.count({
    where: { userId: req.userId },
  });

  res.json({
    page,
    limit,
    total,
    data: tasks,
  });
}

// Atualizar tarefa
async function updateTask(req, res) {
  const { id } = req.params;
  const { title, done } = req.body;

  // Verifica se a tarefa existe
  const task = await prisma.task.findUnique({ where: { id: parseInt(id) } });
  if (!task) {
    return res.status(404).json({ error: "Tarefa não encontrada" });
  }

  // Verifica se o usuário logado é o dono da tarefa
  if (task.userId !== req.userId) {
    return res.status(403).json({ error: "Você não pode editar essa tarefa" });
  }

  const updatedTask = await prisma.task.update({
    where: { id: parseInt(id) },
    data: {
      title: title || task.title, // Só atualiza o que foi enviado
      done: done !== undefined ? done : task.done, // Se não passar "done", mantém o valor atual
    },
  });

  res.json(updatedTask);
}

// Deletar tarefa
async function deleteTask(req, res) {
  const { id } = req.params;

  // Verifica se a tarefa existe
  const task = await prisma.task.findUnique({ where: { id: parseInt(id) } });
  if (!task) {
    return res.status(404).json({ error: "Tarefa não encontrada" });
  }

  // Verifica se o usuário logado é o dono da tarefa
  if (task.userId !== req.userId) {
    return res.status(403).json({ error: "Você não pode deletar essa tarefa" });
  }

  await prisma.task.delete({
    where: { id: parseInt(id) },
  });

  res.status(204).send(); // Retorna sucesso sem corpo
}

module.exports = { createTask, getTasks, updateTask, deleteTask };
