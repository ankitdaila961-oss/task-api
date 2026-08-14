const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Task API', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('GET /tasks', () => {
    test('should return all tasks', async () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });

      const response = await request(app)
        .get('/tasks')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });

    test('should filter tasks by status', async () => {
      taskService.create({
        title: 'Todo task',
        status: 'todo',
      });

      taskService.create({
        title: 'Done task',
        status: 'done',
      });

      const response = await request(app)
        .get('/tasks?status=todo')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('todo');
    });

    test('should return paginated tasks', async () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      taskService.create({ title: 'Task 3' });

      const response = await request(app)
        .get('/tasks?page=1&limit=2')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe('Task 1');
      expect(response.body[1].title).toBe('Task 2');
    });
  });

  describe('GET /tasks/stats', () => {
    test('should return task statistics', async () => {
      taskService.create({
        title: 'Todo',
        status: 'todo',
      });

      taskService.create({
        title: 'Progress',
        status: 'in_progress',
      });

      taskService.create({
        title: 'Done',
        status: 'done',
      });

      const response = await request(app)
        .get('/tasks/stats')
        .expect(200);

      expect(response.body.todo).toBe(1);
      expect(response.body.in_progress).toBe(1);
      expect(response.body.done).toBe(1);
      expect(response.body.overdue).toBe(0);
    });
  });

  describe('POST /tasks', () => {
    test('should create a new task', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          title: 'New Task',
          description: 'Test description',
          priority: 'high',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('New Task');
      expect(response.body.description).toBe('Test description');
      expect(response.body.priority).toBe('high');
      expect(response.body.status).toBe('todo');
    });

    test('should reject a task without a title', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          description: 'Missing title',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'title is required and must be a non-empty string'
      );
    });

    test('should reject an empty title', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          title: '   ',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'title is required and must be a non-empty string'
      );
    });

    test('should reject an invalid status', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          title: 'Invalid task',
          status: 'invalid_status',
        })
        .expect(400);

      expect(response.body.error).toContain(
        'status must be one of'
      );
    });

    test('should reject an invalid priority', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          title: 'Invalid task',
          priority: 'urgent',
        })
        .expect(400);

      expect(response.body.error).toContain(
        'priority must be one of'
      );
    });

    test('should reject an invalid due date', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          title: 'Task with invalid date',
          dueDate: 'not-a-date',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'dueDate must be a valid ISO date string'
      );
    });
  });

  describe('PUT /tasks/:id', () => {
    test('should update an existing task', async () => {
      const task = taskService.create({
        title: 'Old title',
      });

      const response = await request(app)
        .put(`/tasks/${task.id}`)
        .send({
          title: 'Updated title',
        })
        .expect(200);

      expect(response.body.title).toBe('Updated title');
      expect(response.body.id).toBe(task.id);
    });

    test('should return 404 for an unknown task', async () => {
      const response = await request(app)
        .put('/tasks/unknown-id')
        .send({
          title: 'Updated',
        })
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('DELETE /tasks/:id', () => {
    test('should delete an existing task', async () => {
      const task = taskService.create({
        title: 'Delete me',
      });

      await request(app)
        .delete(`/tasks/${task.id}`)
        .expect(204);

      expect(
        taskService.findById(task.id)
      ).toBeUndefined();
    });

    test('should return 404 for an unknown task', async () => {
      const response = await request(app)
        .delete('/tasks/unknown-id')
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    test('should complete an existing task', async () => {
      const task = taskService.create({
        title: 'Complete me',
        priority: 'high',
      });

      const response = await request(app)
        .patch(`/tasks/${task.id}/complete`)
        .expect(200);

      expect(response.body.status).toBe('done');
      expect(response.body.completedAt).not.toBeNull();
      expect(response.body.priority).toBe('high');
    });

    test('should return 404 for an unknown task', async () => {
      const response = await request(app)
        .patch('/tasks/unknown-id/complete')
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /tasks/:id/assign', () => {
    test('should assign a task to a user', async () => {
      const task = taskService.create({
        title: 'Assign me',
      });

      const response = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({
          assignee: 'Ritik',
        })
        .expect(200);

      expect(response.body.id).toBe(task.id);
      expect(response.body.assignee).toBe('Ritik');
    });

    test('should reject a missing assignee', async () => {
      const task = taskService.create({
        title: 'Missing assignee',
      });

      const response = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe(
        'assignee is required and must be a non-empty string'
      );
    });

    test('should reject an empty assignee', async () => {
      const task = taskService.create({
        title: 'Empty assignee',
      });

      const response = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({
          assignee: '',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'assignee is required and must be a non-empty string'
      );
    });

    test('should reject an assignee containing only spaces', async () => {
      const task = taskService.create({
        title: 'Spaces only',
      });

      const response = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({
          assignee: '   ',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'assignee is required and must be a non-empty string'
      );
    });

    test('should return 404 for an unknown task', async () => {
      const response = await request(app)
        .patch('/tasks/unknown-id/assign')
        .send({
          assignee: 'Ritik',
        })
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });

    test('should trim whitespace from a valid assignee', async () => {
      const task = taskService.create({
        title: 'Trim assignee',
      });

      const response = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({
          assignee: '  Ritik  ',
        })
        .expect(200);

      expect(response.body.assignee).toBe('Ritik');
    });

    test('should allow reassignment to another user', async () => {
      const task = taskService.create({
        title: 'Reassign me',
      });

      await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({
          assignee: 'Ritik',
        })
        .expect(200);

      const response = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({
          assignee: 'Aman',
        })
        .expect(200);

      expect(response.body.assignee).toBe('Aman');
    });
  });
});