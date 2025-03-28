import React, { useState, useEffect } from 'react';
import { useAdminContext } from '../../context/AdminContext';
import { LoadingSpinner, EmptyState, useConfirmDialog } from '../../utils/uiUtils';

const RolesPermissionsTab = () => {
  const { state, actions, showAlert } = useAdminContext();
  const { roles, isLoading } = state;
  const { openConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // Local state for role form
  const [newRole, setNewRole] = useState({ name: '', permissions: [] });
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Define available permissions
  const availablePermissions = [
    { id: 'view_appointments', label: 'View Appointments', description: 'Can view appointment calendar and details' },
    { id: 'create_appointments', label: 'Create Appointments', description: 'Can create new appointments' },
    { id: 'edit_appointments', label: 'Edit Appointments', description: 'Can modify existing appointments' },
    { id: 'delete_appointments', label: 'Delete Appointments', description: 'Can cancel or delete appointments' },
    { id: 'view_clients', label: 'View Clients', description: 'Can view client list and details' },
    { id: 'create_clients', label: 'Create Clients', description: 'Can add new clients' },
    { id: 'edit_clients', label: 'Edit Clients', description: 'Can edit client information' },
    { id: 'view_staff', label: 'View Staff', description: 'Can view staff list and profiles' },
    { id: 'manage_staff', label: 'Manage Staff', description: 'Can add, edit, and remove staff' },
    { id: 'view_services', label: 'View Services', description: 'Can view service catalog' },
    { id: 'manage_services', label: 'Manage Services', description: 'Can add, edit, and remove services' },
    { id: 'view_reports', label: 'View Reports', description: 'Can access business reports and analytics' },
    { id: 'manage_settings', label: 'Manage Settings', description: 'Can modify salon settings' },
    { id: 'manage_roles', label: 'Manage Roles', description: 'Can create and modify roles' },
  ];

  // Load roles on component mount
  useEffect(() => {
    actions.loadRoles();
  }, []);

  // Handle role form change
  const handleRoleChange = (e) => {
    const { name, value } = e.target;
    setNewRole(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle permission selection
  const handlePermissionToggle = (permissionId) => {
    setNewRole(prev => {
      const permissions = [...prev.permissions];
      if (permissions.includes(permissionId)) {
        return {
          ...prev,
          permissions: permissions.filter(id => id !== permissionId)
        };
      } else {
        return {
          ...prev,
          permissions: [...permissions, permissionId]
        };
      }
    });
  };

  // Create new role
  const handleCreateRole = async (e) => {
    e.preventDefault();
    
    if (!newRole.name) {
      showAlert('Role name is required', 'error');
      return;
    }
    
    try {
      await actions.createRole(newRole);
      setNewRole({ name: '', permissions: [] });
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  // Set up role for editing
  const handleEditRole = (role) => {
    setEditingRoleId(role.id);
    setNewRole({
      name: role.name,
      permissions: [...role.permissions]
    });
  };

  // Update existing role
  const handleUpdateRole = async (e) => {
    e.preventDefault();
    
    if (!newRole.name) {
      showAlert('Role name is required', 'error');
      return;
    }
    
    try {
      await actions.updateRole(editingRoleId, newRole);
      setEditingRoleId(null);
      setNewRole({ name: '', permissions: [] });
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingRoleId(null);
    setNewRole({ name: '', permissions: [] });
  };

  // Delete role
  const handleDeleteRole = async (roleId) => {
    const confirmed = await openConfirmDialog({
      title: 'Delete Role',
      message: 'Are you sure you want to delete this role? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      confirmVariant: 'danger'
    });
    
    if (confirmed) {
      try {
        await actions.deleteRole(roleId);
      } catch (error) {
        console.error('Error deleting role:', error);
      }
    }
  };

  // Filter roles based on search term
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-serif font-bold text-primary-800">Roles & Permissions Management</h2>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif font-bold text-primary-800">Roles & Permissions Management</h2>
      <p className="text-gray-600">Create and manage custom roles with specific permissions for your staff.</p>
      
      {/* Role Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-medium text-primary-800 mb-4">
          {editingRoleId ? 'Edit Role' : 'Create New Role'}
        </h3>
        
        <form onSubmit={editingRoleId ? handleUpdateRole : handleCreateRole} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
            <input 
              type="text" 
              name="name"
              value={newRole.name}
              onChange={handleRoleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Receptionist, Junior Stylist, Manager"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            <p className="text-sm text-gray-500 mb-4">Select the permissions this role should have:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availablePermissions.map(permission => (
                <div key={permission.id} className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id={`permission-${permission.id}`}
                    checked={newRole.permissions.includes(permission.id)}
                    onChange={() => handlePermissionToggle(permission.id)}
                    className="mt-1 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor={`permission-${permission.id}`} className="text-sm">
                    <span className="font-medium block">{permission.label}</span>
                    <span className="text-gray-500 text-xs">{permission.description}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            {editingRoleId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
            >
              {editingRoleId ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Roles List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-primary-800">Existing Roles</h3>
          <div className="relative">
            <input 
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <svg className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {filteredRoles.length === 0 ? (
          <EmptyState 
            title="No roles found"
            message={searchTerm ? "No roles match your search." : "You haven't created any roles yet."}
            actionLabel={searchTerm ? "Clear search" : "Create your first role"}
            onAction={() => searchTerm ? setSearchTerm('') : null}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Count</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRoles.map(role => (
                  <tr key={role.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{role.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.length > 0 ? (
                          role.permissions.slice(0, 3).map(permId => (
                            <span key={permId} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                              {availablePermissions.find(p => p.id === permId)?.label || permId}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No permissions</span>
                        )}
                        {role.permissions.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{role.permissions.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {role.staffCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEditRole(role)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Permission testing tool - to be implemented */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-primary-800 mb-4">Permission Test Tool</h3>
        <p className="text-gray-600 mb-4">Test what a specific role can access in your salon.</p>
        
        <div className="text-center p-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">Permission testing tool will be implemented soon.</p>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmDialog />
    </div>
  );
};

export default RolesPermissionsTab; 