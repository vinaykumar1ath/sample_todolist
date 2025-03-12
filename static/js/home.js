document.addEventListener('DOMContentLoaded', () => {
  let currentMode = 'create'; // 'create' or 'edit'
  let editingTaskId = null;

  // References to DOM elements
  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task');
  const descriptionInput = document.getElementById('description');
  const finishDateInput = document.getElementById('finishDate');
  const startDateInput = document.getElementById('startDate')
  const submitButton = document.getElementById('submit-button');
  const activeTaskList = document.getElementById('active-task-list');
  const completedTaskList = document.getElementById('completed-task-list');
  const editTabTitle = document.getElementById('edit-tab-title');

  // Fetch data for active tasks (completed: false) and completed tasks (completed: true)
  const fetchTasks = (completed) => {
    const url = `/taskapi/queryUserTasks?completed=${completed}`; // Use query params for GET request
    fetch(url)
      .then(response => response.json())
      .then(data => {
        const taskList = completed ? completedTaskList : activeTaskList;
        taskList.innerHTML = ''; // Clear the current list before appending new tasks
        data.tasklist.forEach(task => {
          const taskComponent = createTaskComponent(task);
          taskList.appendChild(taskComponent);
        });
      })
      .catch(error => console.error('Error fetching tasks:', error));
  };

  // Create a task component for rendering
  const createTaskComponent = (task) => {
    const taskComponent = document.createElement('div');
    taskComponent.classList.add('task-component');
    taskComponent.innerHTML = `
      <p><strong>Task:</strong> ${task.task}</p>
      <p><strong>Description:</strong> ${task.description}</p>
      <p><strong>Finish Date:</strong> ${new Date(task.finishDate)}</p>
      <p><strong>Completed:</strong> ${task.completed ? 'Yes' : 'No'}</p>
      <!-- Buttons below task details -->
      <div class="task-actions">
        <button class="task-action complete" style="display: ${task.completed ? 'none' : 'inline-block'}">Complete</button>
        <button class="task-action edit">Edit</button>
        <button class="task-action remove">Remove</button>
      </div>
    `;

    taskComponent.querySelector('.complete').addEventListener('click', () => {
      markTaskComplete(task);
    });

    taskComponent.querySelector('.edit').addEventListener('click', () => {
      startEditTask(task);
    });

    taskComponent.querySelector('.remove').addEventListener('click', () => {
      removeTask(task);
    });

    return taskComponent;
  };
  
  //Date formatting for datetime-localName
  function localToDatetimeLocal(localDate) {
  const date = new Date(localDate);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

  // Start editing a task
  const startEditTask = (task) => {
    currentMode = 'edit';
    editingTaskId = task._id;
    taskInput.value = task.task;
    descriptionInput.value = task.description;
    finishDateInput.value = localToDatetimeLocal(new Date(task.finishDate))
	startDateInput.value = task.startDate
    editTabTitle.textContent = 'Edit Task';
    submitButton.textContent = 'Edit';
  };

  // Mark a task as completed
  const markTaskComplete = (task) => {
    const url = '/taskapi/completeTask';
    fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify( task ),
    })
      .then(response => response.json())
      .then(data => {
        alert(data.message); // Show alert on response
        // Refresh both the active and completed task lists
        fetchTasks(false); // refresh active tab
        fetchTasks(true); // refresh completed tab
      })
      .catch(error => console.error('Error completing task:', error));
  };

  // Remove a task
  const removeTask = (task) => {
    const url = '/taskapi/deleteTask';
    fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify( task ),
    })
      .then(response => response.json())
      .then(data => {
        alert(data.message); // Show alert on response
        // Refresh both the active and completed task lists
        fetchTasks(false); // refresh active tab
        fetchTasks(true); // refresh completed tab
      })
      .catch(error => console.error('Error removing task:', error));
  };

  // Handle form submit for creating/editing tasks
  taskForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const taskData = {
      task: taskInput.value,
      description: descriptionInput.value,
      finishDate: new Date(finishDateInput.value).toISOString(), // Convert the finish date to ISO string
	  startDate: startDateInput.value
    };

    const url = currentMode === 'create' ? '/taskapi/createTask' : '/taskapi/editTask';
    const method = currentMode === 'create' ? 'POST' : 'PUT';

    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData), // Send taskData exactly as required
    })
      .then(response => response.json())
      .then(data => {
        alert(data.message); // Show alert on response
        // After creating or editing, refresh both task lists
        fetchTasks(false); // refresh active tab
        fetchTasks(true); // refresh completed tab
        taskInput.value = '';
        descriptionInput.value = '';
        finishDateInput.value = '';
        currentMode = 'create';
        editingTaskId = null;
        editTabTitle.textContent = 'Create Task';
        submitButton.textContent = 'Create';
      })
      .catch(error => console.error('Error submitting task:', error));
  });
  
  document.getElementById("logoutBtn").addEventListener("click", function() {
  fetch("/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
  .then(response => {
    if (response.ok) {
      // Logout successful, handle accordingly (e.g., redirect to login page)
      window.location.href = "/login"; // Example: redirect to login page
    } else {
      // Handle error if logout fails
      alert("Logout failed. Please try again.");
    }
  })
  .catch(error => {
    console.error("Error:", error);
    alert("An error occurred during logout. Please try again.");
  });
});

  // Initial fetch of tasks when the page loads
  fetchTasks(false); // Fetch active tasks
  fetchTasks(true); // Fetch completed tasks
});