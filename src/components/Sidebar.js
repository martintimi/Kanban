const menuItems = [
  // ... existing items ...
  {
    title: 'Resources',
    path: '/resources',
    icon: <PeopleIcon />,
    roles: ['admin', 'project_manager']  // Only visible to managers
  },
  {
    title: 'Calendar',
    path: '/calendar',
    icon: <CalendarIcon />,
    roles: ['admin', 'project_manager', 'developer']
  }
]; 