const taskService = require('../src/services/taskService');

describe('Task Service', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create()', () => {
    test('should create a task with default values', () => {
      const task = taskService.create({
        title: 'Learn Node.js',
      });

      expect(task).toHaveProperty('id');
      expect(task.title).toBe('Learn Node.js');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.completedAt).toBeNull();
      expect(task).toHaveProperty('createdAt');
    });

    test('should create a task with custom values', () => {
      const task = taskService.create({
        title: 'Build API',
        description: 'Complete the assignment',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-08-20T10:00:00.000Z',
      });

      expect(task.title).toBe('Build API');
      expect(task.description).toBe('Complete the assignment');
      expect(task.status).toBe('in_progress');
      expect(task.priority).toBe('high');
      expect(task.dueDate).toBe('2026-08-20T10:00:00.000Z');
    });
  });

  describe('getAll()', () => {
    test('should return all tasks', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });

      const tasks = taskService.getAll();

      expect(tasks).toHaveLength(2);
    });
  });

  describe('findById()', () => {
    test('should find a task by id', () => {
      const created = taskService.create({
        title: 'Find me',
      });

      const task = taskService.findById(created.id);

      expect(task).toBeDefined();
      expect(task.id).toBe(created.id);
    });

    test('should return undefined for unknown id', () => {
      expect(taskService.findById('unknown-id')).toBeUndefined();
    });
  });

  describe('getByStatus()', () => {
    test('should return tasks matching the exact status', () => {
      taskService.create({
        title: 'Todo task',
        status: 'todo',
      });

      taskService.create({
        title: 'Progress task',
        status: 'in_progress',
      });

      const tasks = taskService.getByStatus('todo');

      expect(tasks).toHaveLength(1);
      expect(tasks[0].status).toBe('todo');
    });

    test('should not match a partial status', () => {
      taskService.create({
        title: 'Progress task',
        status: 'in_progress',
      });

      const tasks = taskService.getByStatus('progress');

      expect(tasks).toHaveLength(0);
    });
  });

  describe('getPaginated()', () => {
    test('should return the first page correctly', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      taskService.create({ title: 'Task 3' });

      const tasks = taskService.getPaginated(1, 2);

      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe('Task 1');
      expect(tasks[1].title).toBe('Task 2');
    });
  });

  describe('update()', () => {
    test('should update an existing task', () => {
      const created = taskService.create({
        title: 'Old title',
      });

      const updated = taskService.update(created.id, {
        title: 'New title',
      });

      expect(updated.title).toBe('New title');
      expect(updated.id).toBe(created.id);
    });

    test('should return null for unknown task', () => {
      const result = taskService.update('unknown-id', {
        title: 'New title',
      });

      expect(result).toBeNull();
    });
  });

  describe('remove()', () => {
    test('should remove an existing task', () => {
      const created = taskService.create({
        title: 'Delete me',
      });

      expect(taskService.remove(created.id)).toBe(true);
      expect(taskService.findById(created.id)).toBeUndefined();
    });

    test('should return false for unknown task', () => {
      expect(taskService.remove('unknown-id')).toBe(false);
    });
  });

  describe('completeTask()', () => {
    test('should mark a task as done', () => {
      const created = taskService.create({
        title: 'Complete me',
        priority: 'high',
      });

      const completed = taskService.completeTask(created.id);

      expect(completed.status).toBe('done');
      expect(completed.completedAt).not.toBeNull();
      expect(completed.priority).toBe('high');
    });

    test('should return null for unknown task', () => {
      const result = taskService.completeTask('unknown-id');

      expect(result).toBeNull();
    });
  });

  describe('getStats()', () => {
    test('should return correct task statistics', () => {
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

      const stats = taskService.getStats();

      expect(stats.todo).toBe(1);
      expect(stats.in_progress).toBe(1);
      expect(stats.done).toBe(1);
      expect(stats.overdue).toBe(0);
    });
  });
});