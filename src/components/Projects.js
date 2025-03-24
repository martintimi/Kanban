const handleCreateProject = async (projectData) => {
  try {
    setCreating(true);
    const newProject = await ProjectService.createProject({
      ...projectData,
      organizationId: selectedOrg.id,
      userId: user.uid
    });
    
    showToast('Project created successfully');
    setProjects(prev => [...prev, newProject]);
    setCreateDialogOpen(false);
  } catch (error) {
    console.error('Error creating project:', error);
    showToast(error.message || 'Failed to create project', 'error');
  } finally {
    setCreating(false);
  }
}; 