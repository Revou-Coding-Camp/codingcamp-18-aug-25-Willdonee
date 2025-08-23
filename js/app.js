class TodoApp {
  constructor() {
    this.todos = JSON.parse(localStorage.getItem("todos")) || []
    this.currentFilter = "all"
    this.init()
  }

  init() {
    this.bindEvents()
    this.render()
    this.setMinDate()
  }

  bindEvents() {
    // Form submission
    document.getElementById("todoForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.addTodo()
    })

    // Filter buttons
    document.getElementById("filterAll").addEventListener("click", () => this.setFilter("all"))
    document.getElementById("filterPending").addEventListener("click", () => this.setFilter("pending"))
    document.getElementById("filterCompleted").addEventListener("click", () => this.setFilter("completed"))
    document.getElementById("filterOverdue").addEventListener("click", () => this.setFilter("overdue"))

    // Delete all button
    document.getElementById("deleteAllBtn").addEventListener("click", () => this.deleteAll())

    // Input validation
    document.getElementById("todoInput").addEventListener("input", () => this.clearError())
    document.getElementById("dateInput").addEventListener("input", () => this.clearError())
  }

  setMinDate() {
    const today = new Date().toISOString().split("T")[0]
    document.getElementById("dateInput").setAttribute("min", today)
  }

  addTodo() {
    const todoInput = document.getElementById("todoInput")
    const dateInput = document.getElementById("dateInput")
    const todoText = todoInput.value.trim()
    const dueDate = dateInput.value

    // Validation
    if (!this.validateInput(todoText, dueDate)) {
      return
    }

    // Check for duplicates
    if (this.todos.some((todo) => todo.text.toLowerCase() === todoText.toLowerCase())) {
      this.showError("This todo already exists!")
      return
    }

    const newTodo = {
      id: Date.now(),
      text: todoText,
      dueDate: dueDate,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    this.todos.push(newTodo)
    this.saveTodos()
    this.render()

    // Clear form
    todoInput.value = ""
    dateInput.value = ""
    this.clearError()

    // Show success feedback
    this.showSuccess("Todo added successfully!")
  }

  validateInput(text, date) {
    this.clearError()

    if (!text) {
      this.showError("Please enter a todo task")
      return false
    }

    if (text.length < 3) {
      this.showError("Todo must be at least 3 characters long")
      return false
    }

    if (text.length > 100) {
      this.showError("Todo must be less than 100 characters")
      return false
    }

    if (!date) {
      this.showError("Please select a due date")
      return false
    }

    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      this.showError("Due date cannot be in the past")
      return false
    }

    return true
  }

  showError(message) {
    const errorElement = document.getElementById("errorMessage")
    errorElement.textContent = message
    errorElement.style.color = "#ef4444"
  }

  showSuccess(message) {
    const errorElement = document.getElementById("errorMessage")
    errorElement.textContent = message
    errorElement.style.color = "#22c55e"
    setTimeout(() => this.clearError(), 3000)
  }

  clearError() {
    document.getElementById("errorMessage").textContent = ""
  }

  deleteTodo(id) {
    if (confirm("Are you sure you want to delete this todo?")) {
      this.todos = this.todos.filter((todo) => todo.id !== id)
      this.saveTodos()
      this.render()
    }
  }

  toggleComplete(id) {
    const todo = this.todos.find((todo) => todo.id === id)
    if (todo) {
      todo.completed = !todo.completed
      this.saveTodos()
      this.render()
    }
  }

  deleteAll() {
    if (this.todos.length === 0) {
      this.showError("No todos to delete")
      return
    }

    if (confirm("Are you sure you want to delete all todos? This action cannot be undone.")) {
      this.todos = []
      this.saveTodos()
      this.render()
      this.showSuccess("All todos deleted successfully!")
    }
  }

  setFilter(filter) {
    this.currentFilter = filter

    // Update active filter button
    document.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"))
    document.getElementById(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`).classList.add("active")

    this.render()
  }

  getFilteredTodos() {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    switch (this.currentFilter) {
      case "pending":
        return this.todos.filter((todo) => !todo.completed)
      case "completed":
        return this.todos.filter((todo) => todo.completed)
      case "overdue":
        return this.todos.filter((todo) => {
          const dueDate = new Date(todo.dueDate)
          return !todo.completed && dueDate < today
        })
      default:
        return this.todos
    }
  }

  getStatus(todo) {
    if (todo.completed) {
      return { class: "status-completed", text: "Completed" }
    }

    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const dueDate = new Date(todo.dueDate)

    if (dueDate < today) {
      return { class: "status-overdue", text: "Overdue" }
    }

    return { class: "status-pending", text: "Pending" }
  }

  formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  render() {
    const todoList = document.getElementById("todoList")
    const filteredTodos = this.getFilteredTodos()

    if (filteredTodos.length === 0) {
      todoList.innerHTML = '<div class="no-tasks">No task found</div>'
      return
    }

    // Sort todos: incomplete first, then by due date
    filteredTodos.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed - b.completed
      }
      return new Date(a.dueDate) - new Date(b.dueDate)
    })

    todoList.innerHTML = filteredTodos
      .map((todo) => {
        const status = this.getStatus(todo)
        return `
                <div class="todo-item">
                    <div class="todo-text ${todo.completed ? "completed" : ""}">${this.escapeHtml(todo.text)}</div>
                    <div class="todo-date">${this.formatDate(todo.dueDate)}</div>
                    <div class="todo-status ${status.class}">${status.text}</div>
                    <div class="todo-actions">
                        <button class="action-btn ${todo.completed ? "undo-btn" : "complete-btn"}" 
                                onclick="todoApp.toggleComplete(${todo.id})">
                            ${todo.completed ? "Undo" : "Done"}
                        </button>
                        <button class="action-btn delete-btn" onclick="todoApp.deleteTodo(${todo.id})">
                            Delete
                        </button>
                    </div>
                </div>
            `
      })
      .join("")
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  saveTodos() {
    localStorage.setItem("todos", JSON.stringify(this.todos))
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.todoApp = new TodoApp()
})
