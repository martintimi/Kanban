const handleDeleteTask = async (taskId) => {
  try {
    setLoading(true);
    await TaskService.deleteTask(projectId, taskId);
    
    // Update local state immediately
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    
    showToast('Task deleted successfully', 'success');
  } catch (error) {
    console.error('Error deleting task:', error);
    showToast('Failed to delete task: ' + error.message, 'error');
  } finally {
    setLoading(false);
  }
}; 