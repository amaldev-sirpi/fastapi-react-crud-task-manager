
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;

  return response.json();
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPriority, setEditPriority] = useState("medium");

  // Fetch tasks from FastAPI
  async function fetchTasks() {
    try {
      setError("");
      const data = await apiRequest("/tasks/");
      setTasks(data);
    } catch (err) {
      setError(
        "Unable to connect to the backend. Please check that FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  // Task statistics
  const completedCount = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingCount = tasks.length - completedCount;

  const filteredTasks = useMemo(() => {
    if (filter === "active") {
      return tasks.filter((task) => !task.completed);
    }

    if (filter === "completed") {
      return tasks.filter((task) => task.completed);
    }

    return tasks;
  }, [tasks, filter]);

  // Create a new task
  async function handleAddTask(event) {
    event.preventDefault();

    const title = newTitle.trim();

    if (!title) return;

    try {
      setSaving(true);
      setError("");

      await apiRequest("/tasks/", {
        method: "POST",
        body: JSON.stringify({
          title,
          due_date: newDueDate || null,
          priority: newPriority,
        }),
      });

      setNewTitle("");
      setNewDueDate("");
      setNewPriority("medium");
      await fetchTasks();
    } catch (err) {
      setError(err.message || "Could not create task.");
    } finally {
      setSaving(false);
    }
  }

  // Mark task as completed or pending
  async function handleToggle(task) {
    try {
      setError("");

      await apiRequest(`/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({
          completed: !task.completed,
        }),
      });

      await fetchTasks();
    } catch (err) {
      setError(err.message || "Could not update task.");
    }
  }

  // Start editing
  function startEditing(task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDueDate(task.due_date || "");
    setEditPriority(task.priority || "medium");
  }

  // Save edited task
  async function handleEdit(event, taskId) {
    event.preventDefault();

    const title = editTitle.trim();

    if (!title) return;

    try {
      setError("");

      await apiRequest(`/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          due_date: editDueDate || null,
          priority: editPriority,
        }),
      });

      setEditingId(null);
      setEditTitle("");
      setEditDueDate("");
      setEditPriority("medium");
      await fetchTasks();
    } catch (err) {
      setError(err.message || "Could not edit task.");
    }
  }

  // Delete task
  async function handleDelete(taskId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await apiRequest(`/tasks/${taskId}`, {
        method: "DELETE",
      });

      await fetchTasks();
    } catch (err) {
      setError(err.message || "Could not delete task.");
    }
  }

  return (
    <div className="app-container">

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">✓</div>
          <span>TaskFlow</span>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">WORKSPACE</p>

          <button
            className={`nav-item ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            <span>▦</span> All Tasks
          </button>

          <button
            className={`nav-item ${filter === "active" ? "active" : ""}`}
            onClick={() => setFilter("active")}
          >
            <span>◷</span> My Tasks
          </button>

          <button
            className={`nav-item ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            <span>✓</span> Completed
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="profile-avatar">TF</div>
          <div>
            <strong>My Workspace</strong>
            <small>Personal task manager</small>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">

        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace / Tasks</span>
            <h1>My Dashboard</h1>
          </div>

          <div className="topbar-right">
            <span className="online-dot"></span>
            <span>Backend connected</span>
          </div>
        </header>

        <section className="welcome-section">
          <div>
            <p className="eyebrow">YOUR PRODUCTIVITY SPACE</p>
            <h2>Let's get things done! 👋</h2>
            <p className="welcome-text">
              Organize your day and keep moving forward.
            </p>
          </div>

          <div className="welcome-decoration">✦</div>
        </section>

        {/* Statistics */}
        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon purple">▦</div>
            <p>Total Tasks</p>
            <h3>{tasks.length}</h3>
            <span>All your tasks</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">◷</div>
            <p>Pending Tasks</p>
            <h3>{pendingCount}</h3>
            <span>Waiting to be done</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">✓</div>
            <p>Completed Tasks</p>
            <h3>{completedCount}</h3>
            <span>Successfully finished</span>
          </div>

        </section>

        {/* Add task form */}
        <section className="task-panel">

          <div className="panel-heading">
            <div>
              <h2>My Tasks</h2>
              <p>Manage your daily activities</p>
            </div>

            <span className="task-count">
              {tasks.length} tasks
            </span>
          </div>

          <form className="add-task-form" onSubmit={handleAddTask}>
            <input
              className="task-title-input"
              type="text"
              placeholder="What needs to be done today?"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              maxLength={200}
              required
            />

            <div className="add-task-fields">
              <label className="form-field">
                <span>Due date</span>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(event) => setNewDueDate(event.target.value)}
                />
              </label>

              <label className="form-field">
                <span>Priority</span>
                <select
                  value={newPriority}
                  onChange={(event) => setNewPriority(event.target.value)}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>

              <button type="submit" disabled={saving}>
                {saving ? "Adding..." : "+ Add Task"}
              </button>
            </div>
          </form>

          {/* Error message */}
          {error && (
            <div className="error-message" role="alert">
              ⚠ {error}
              <button
                type="button"
                onClick={fetchTasks}
                className="retry-button"
              >
                Retry
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="filter-row">
            <div className="filter-buttons">
              {["all", "active", "completed"].map((item) => (
                <button
                  key={item}
                  className={`filter-button ${
                    filter === item ? "selected" : ""
                  }`}
                  onClick={() => setFilter(item)}
                  type="button"
                >
                  {item === "all"
                    ? "All"
                    : item === "active"
                    ? "Active"
                    : "Completed"}
                </button>
              ))}
            </div>

            <span className="showing-text">
              Showing {filteredTasks.length} tasks
            </span>
          </div>

          {/* Task list */}
          <div className="task-list">

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading your tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✦</div>
                <h3>No tasks found</h3>
                <p>
                  {filter === "all"
                    ? "Add your first task and start being productive!"
                    : "There are no tasks in this category."}
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div className="task-item" key={task.id}>

                  <button
                    className={`task-checkbox ${
                      task.completed ? "checked" : ""
                    }`}
                    onClick={() => handleToggle(task)}
                    type="button"
                    aria-label="Toggle task completion"
                  >
                    {task.completed ? "✓" : ""}
                  </button>

                  {editingId === task.id ? (
                    <form
                      className="edit-form"
                      onSubmit={(event) =>
                        handleEdit(event, task.id)
                      }
                    >
                      <input
                        value={editTitle}
                        onChange={(event) =>
                          setEditTitle(event.target.value)
                        }
                        autoFocus
                        maxLength={200}
                        required
                      />

                      <label className="form-field">
                        <span>Due date</span>
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={(event) =>
                            setEditDueDate(event.target.value)
                          }
                        />
                      </label>

                      <label className="form-field">
                        <span>Priority</span>
                        <select
                          value={editPriority}
                          onChange={(event) =>
                            setEditPriority(event.target.value)
                          }
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </label>

                      <button type="submit" className="save-button">
                        Save
                      </button>

                      <button
                        type="button"
                        className="cancel-button"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="task-details">
                        <p
                          className={
                            task.completed ? "task-title done" : "task-title"
                          }
                        >
                          {task.title}
                        </p>

                        <span className="task-status">
                          {task.completed ? "Completed" : "In progress"}
                        </span>
                        <div className="task-meta">
                          {task.due_date && (
                            <span className="task-due-date">
                              Due{" "}
                              {new Date(
                                `${task.due_date}T00:00:00`
                              ).toLocaleDateString()}
                            </span>
                          )}
                          <span
                            className={`priority-badge priority-${task.priority || "medium"}`}
                          >
                            {task.priority || "medium"} priority
                          </span>
                        </div>
                      </div>

                      <div className="task-actions">
                        <button
                          type="button"
                          title="Edit task"
                          onClick={() => startEditing(task)}
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          title="Delete task"
                          onClick={() => handleDelete(task.id)}
                        >
                          🗑
                        </button>
                      </div>
                    </>
                  )}

                </div>
              ))
            )}

          </div>

          <div className="panel-footer">
            <span>TaskFlow · Stay organized, stay productive.</span>
            <span>{completedCount} of {tasks.length} completed</span>
          </div>

        </section>

        <footer className="page-footer">
          Built with React + FastAPI + SQLite
        </footer>

      </main>
    </div>
  );
}

export default App;
