import React, { useState } from 'react';
import { AdminProvider } from '../context/AdminContext';
import SalonProfileTab from './admin/SalonProfileTab';
import ServiceCatalogTab from './admin/ServiceCatalogTab';
import RolesPermissionsTab from './admin/RolesPermissionsTab';
import StaffManagementTab from './admin/StaffManagementTab';
import AlertContainer from './common/AlertContainer';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('salon-profile');

  // Authentication check
  const checkAuth = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      window.location.href = '/login?redirect=/admin';
      return false;
    }
    return true;
  };
  
  if (!checkAuth()) {
    return null; // Don't render anything if not authenticated
  }

  const tabClass = (tabId) => 
    `px-4 py-2 text-sm font-medium rounded-t-lg ${activeTab === tabId 
      ? 'bg-white text-primary-600 border-b-2 border-primary-500' 
      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`;

  return (
    <AdminProvider>
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-primary-600">Aesthenda Admin</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-2 px-4 pt-4">
                <button 
                  className={tabClass('salon-profile')} 
                  onClick={() => setActiveTab('salon-profile')}
                >
                  Salon Profile
                </button>
                <button 
                  className={tabClass('service-catalog')} 
                  onClick={() => setActiveTab('service-catalog')}
                >
                  Service Catalog
                </button>
                <button 
                  className={tabClass('roles-permissions')} 
                  onClick={() => setActiveTab('roles-permissions')}
                >
                  Roles & Permissions
                </button>
                <button 
                  className={tabClass('staff-management')} 
                  onClick={() => setActiveTab('staff-management')}
                >
                  Staff Management
                </button>
              </nav>
            </div>
            
            <div className="p-6">
              {activeTab === 'salon-profile' && <SalonProfileTab />}
              {activeTab === 'service-catalog' && <ServiceCatalogTab />}
              {activeTab === 'roles-permissions' && <RolesPermissionsTab />}
              {activeTab === 'staff-management' && <StaffManagementTab />}
            </div>
          </div>
        </main>
        
        {/* Alert container */}
        <AlertContainer />
      </div>
    </AdminProvider>
  );
};

export default AdminPanel;
  
  // Roles & Permissions Tab - already implemented in previous steps
  const RolesPermissionsTab = () => {
    // States for role management
    const [roles, setRoles] = useState([]);
    const [staff, setStaff] = useState([]);
    const [newRole, setNewRole] = useState({ name: '', permissions: [] });
    const [editingRole, setEditingRole] = useState(null);
    const [editRoleForm, setEditRoleForm] = useState({ name: '', permissions: [] });
    
    // List of all available permissions
    const availablePermissions = [
      'view_appointments', 'create_appointments', 'edit_appointments', 'delete_appointments', 
      'view_clients', 'create_clients', 'edit_clients', 'delete_clients',
      'view_staff', 'manage_staff', 
      'view_services', 'manage_services', 
      'view_reports', 'view_analytics',
      'manage_salon', 'manage_billing', 'access_settings'
    ];
    
    // Fetch roles on component mount
    useEffect(() => {
      fetchRoles();
      fetchStaff();
    }, []);
    
    // Fetch roles from API
    const fetchRoles = async () => {
      try {
        const response = await fetch('/api/roles', { 
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch roles');
        
        const data = await response.json();
        setRoles(data);
      } catch (error) {
        console.error('Error fetching roles:', error);
        showAlert(`Error fetching roles: ${error.message}`, 'error');
      }
    };
    
    // Fetch staff from API
    const fetchStaff = async () => {
      try {
        const response = await fetch('/api/staff', { 
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch staff');
        
        const data = await response.json();
        setStaff(data);
      } catch (error) {
        console.error('Error fetching staff:', error);
        showAlert(`Error fetching staff: ${error.message}`, 'error');
      }
    };
    
    // Handle input change for new role form
    const handleNewRoleChange = (e) => {
      setNewRole({
        ...newRole,
        [e.target.name]: e.target.value
      });
    };
    
    // Handle permission checkbox change for new role
    const handlePermissionChange = (permission) => {
      setNewRole(prev => {
        const permissions = [...prev.permissions];
        if (permissions.includes(permission)) {
          return { ...prev, permissions: permissions.filter(p => p !== permission) };
        } else {
          return { ...prev, permissions: [...permissions, permission] };
        }
      });
    };
    
    // Handle permission checkbox change for editing role
    const handleEditPermissionChange = (permission) => {
      setEditRoleForm(prev => {
        const permissions = [...prev.permissions];
        if (permissions.includes(permission)) {
          return { ...prev, permissions: permissions.filter(p => p !== permission) };
        } else {
          return { ...prev, permissions: [...permissions, permission] };
        }
      });
    };
    
    // Create a new role
    const createRole = async (e) => {
      e.preventDefault();
      
      if (!newRole.name) {
        showAlert('Role name is required', 'error');
        return;
      }
      
      if (newRole.permissions.length === 0) {
        showAlert('Please select at least one permission', 'error');
        return;
      }
      
      try {
        const response = await fetch('/api/roles', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
          },
          body: JSON.stringify(newRole)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create role');
        }
        
        const createdRole = await response.json();
        setRoles([...roles, createdRole]);
        setNewRole({ name: '', permissions: [] });
        showAlert('Role created successfully', 'success');
      } catch (error) {
        console.error('Error creating role:', error);
        showAlert(`Error creating role: ${error.message}`, 'error');
      }
    };
    
    // Start editing a role
    const startEditRole = (role) => {
      setEditingRole(role.id);
      setEditRoleForm({
        name: role.name,
        permissions: [...role.permissions]
      });
    };
    
    // Cancel editing a role
    const cancelEditRole = () => {
      setEditingRole(null);
      setEditRoleForm({ name: '', permissions: [] });
    };
    
    // Update a role
    const updateRole = async (e) => {
      e.preventDefault();
      
      if (!editRoleForm.name) {
        showAlert('Role name is required', 'error');
        return;
      }
      
      if (editRoleForm.permissions.length === 0) {
        showAlert('Please select at least one permission', 'error');
        return;
      }
      
      try {
        const response = await fetch(`/api/roles/${editingRole}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
          },
          body: JSON.stringify(editRoleForm)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update role');
        }
        
        const updatedRole = await response.json();
        setRoles(roles.map(role => role.id === editingRole ? updatedRole : role));
        setEditingRole(null);
        setEditRoleForm({ name: '', permissions: [] });
        showAlert('Role updated successfully', 'success');
      } catch (error) {
        console.error('Error updating role:', error);
        showAlert(`Error updating role: ${error.message}`, 'error');
      }
    };
    
    // Delete a role
    const deleteRole = async (roleId) => {
      // Show a confirmation dialog
      if (!window.confirm('Are you sure you want to delete this role?')) {
        return;
      }
      
      try {
        const response = await fetch(`/api/roles/${roleId}`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete role');
        }
        
        setRoles(roles.filter(role => role.id !== roleId));
        showAlert('Role deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting role:', error);
        showAlert(`Error deleting role: ${error.message}`, 'error');
      }
    };
    
    // Assign role to staff
    const assignRoleToStaff = async (staffId, roleId) => {
      try {
        const response = await fetch(`/api/staff/${staffId}/roles`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({ roleId })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to assign role');
        }
        
        const updatedStaff = await response.json();
        setStaff(staff.map(member => member.id === staffId ? updatedStaff : member));
        showAlert('Role assigned successfully', 'success');
      } catch (error) {
        console.error('Error assigning role:', error);
        showAlert(`Error assigning role: ${error.message}`, 'error');
      }
    };
    
    // Get role name by ID
    const getRoleName = (roleId) => {
      const role = roles.find(role => role.id === roleId);
      return role ? role.name : 'No Role';
    };
    
    // Group permissions by category
    const permissionCategories = {
      'Appointments': ['view_appointments', 'create_appointments', 'edit_appointments', 'delete_appointments'],
      'Clients': ['view_clients', 'create_clients', 'edit_clients', 'delete_clients'],
      'Staff': ['view_staff', 'manage_staff'],
      'Services': ['view_services', 'manage_services'],
      'Reports': ['view_reports', 'view_analytics'],
      'Administration': ['manage_salon', 'manage_billing', 'access_settings']
    };
    
    // Render permission checkboxes by category
    const renderPermissionCheckboxes = (formType) => {
      return Object.entries(permissionCategories).map(([category, perms]) => (
        <div key={category} className="mb-4">
          <h4 className="text-sm font-medium text-spa-dark mb-2">{category}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {perms.map(permission => (
              <label key={permission} className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={
                    formType === 'new' 
                      ? newRole.permissions.includes(permission)
                      : editRoleForm.permissions.includes(permission)
                  } 
                  onChange={() => 
                    formType === 'new' 
                      ? handlePermissionChange(permission)
                      : handleEditPermissionChange(permission)
                  }
                  className="rounded text-spa-olive focus:ring-spa-olive"
                />
                <span className="text-sm">
                  {permission.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </label>
            ))}
          </div>
        </div>
      ));
    };
    
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-serif font-bold text-spa-dark">Roles & Permissions Management</h2>
        <p className="text-spa-brown">Create and manage roles with specific permissions for your staff.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create New Role Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-spa-dark mb-4">Create New Role</h3>
              <form onSubmit={createRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-spa-dark mb-1">Role Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={newRole.name} 
                    onChange={handleNewRoleChange} 
                    className="w-full p-2 border border-spa-beige rounded-md"
                    placeholder="e.g., Stylist, Manager"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-spa-dark mb-1">Permissions</label>
                  <div className="mt-2 space-y-2 max-h-80 overflow-y-auto p-2 border border-spa-beige rounded-md">
                    {renderPermissionCheckboxes('new')}
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="w-full bg-spa-olive hover:bg-spa-olive-600 text-white py-2 px-4 rounded-md transition-colors"
                >
                  Create Role
                </button>
              </form>
            </div>
          </div>
          
          {/* Existing Roles */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-spa-dark mb-4">Existing Roles</h3>
              {roles.length === 0 ? (
                <p className="text-center text-spa-brown py-4">No roles have been created yet.</p>
              ) : (
                <div className="space-y-4">
                  {roles.map(role => (
                    <div key={role.id} className="border border-spa-beige rounded-md p-4">
                      {editingRole === role.id ? (
                        <form onSubmit={updateRole} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-spa-dark mb-1">Role Name</label>
                            <input 
                              type="text" 
                              name="name" 
                              value={editRoleForm.name} 
                              onChange={(e) => setEditRoleForm({...editRoleForm, name: e.target.value})} 
                              className="w-full p-2 border border-spa-beige rounded-md"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-spa-dark mb-1">Permissions</label>
                            <div className="mt-2 space-y-2 max-h-80 overflow-y-auto p-2 border border-spa-beige rounded-md">
                              {renderPermissionCheckboxes('edit')}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button 
                              type="submit" 
                              className="flex-1 bg-spa-olive hover:bg-spa-olive-600 text-white py-2 px-4 rounded-md transition-colors"
                            >
                              Save Changes
                            </button>
                            <button 
                              type="button" 
                              onClick={cancelEditRole}
                              className="flex-1 border border-spa-brown text-spa-brown hover:bg-spa-brown hover:text-white py-2 px-4 rounded-md transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-lg font-medium text-spa-dark">{role.name}</h4>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => startEditRole(role)}
                                className="text-spa-olive hover:text-spa-olive-600 transition-colors"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => deleteRole(role.id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <h5 className="text-sm font-medium text-spa-dark mb-1">Permissions:</h5>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {role.permissions.map(permission => (
                                <span key={permission} className="inline-block bg-spa-nude px-2 py-1 rounded-md text-xs">
                                  {permission.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Staff Role Assignment */}
            <div className="bg-white p-6 rounded-lg shadow-md mt-6">
              <h3 className="text-lg font-medium text-spa-dark mb-4">Assign Roles to Staff</h3>
              {staff.length === 0 ? (
                <p className="text-center text-spa-brown py-4">No staff members found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-spa-beige">
                    <thead>
                      <tr>
                        <th className="py-3 text-left text-xs font-medium text-spa-brown uppercase tracking-wider">Name</th>
                        <th className="py-3 text-left text-xs font-medium text-spa-brown uppercase tracking-wider">Email</th>
                        <th className="py-3 text-left text-xs font-medium text-spa-brown uppercase tracking-wider">Current Role</th>
                        <th className="py-3 text-left text-xs font-medium text-spa-brown uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-spa-beige">
                      {staff.map(member => (
                        <tr key={member.id}>
                          <td className="py-4 text-sm text-spa-dark">{member.name}</td>
                          <td className="py-4 text-sm text-spa-dark">{member.email}</td>
                          <td className="py-4 text-sm text-spa-dark">{getRoleName(member.roleId)}</td>
                          <td className="py-4 text-sm">
                            <select 
                              className="p-1 border border-spa-beige rounded-md"
                              onChange={(e) => assignRoleToStaff(member.id, parseInt(e.target.value))}
                              value={member.roleId || ''}
                            >
                              <option value="">Select a role</option>
                              {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const StaffManagementTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif font-bold text-spa-dark">Staff Management</h2>
      <p className="text-spa-brown">Add and manage your salon's staff members.</p>
      
      {/* Placeholder for staff management UI */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-spa-dark mb-4">Staff Directory</h3>
          <p className="text-sm text-spa-brown mb-6">View and manage your salon's staff members.</p>
          
          {/* Staff directory - to be implemented */}
          <div className="bg-spa-nude-50 p-4 rounded-md text-center">
            <p>Staff directory will be implemented in the next phase.</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-spa-dark mb-4">Add New Staff Member</h3>
          <p className="text-sm text-spa-brown mb-6">Invite a new staff member to join your salon.</p>
          
          {/* Add staff form - to be implemented */}
          <div className="bg-spa-nude-50 p-4 rounded-md text-center">
            <p>Staff invitation form will be implemented in the next phase.</p>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Alert component
  const AlertComponent = () => {
    if (!alert.show) return null;
    
    const bgColor = alert.type === 'success' ? 'bg-green-100' :
                    alert.type === 'error' ? 'bg-red-100' :
                    alert.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100';
                    
    const textColor = alert.type === 'success' ? 'text-green-800' :
                      alert.type === 'error' ? 'text-red-800' :
                      alert.type === 'warning' ? 'text-yellow-800' : 'text-blue-800';
    
    return (
      <div className={`fixed top-4 right-4 p-4 rounded-md shadow-md ${bgColor} ${textColor} max-w-md z-50`}>
        <div className="flex items-start">
          {alert.type === 'success' && (
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          )}
          {alert.type === 'error' && (
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {alert.type === 'warning' && (
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          <div>
            <p className="text-sm">{alert.message}</p>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AlertComponent />
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {/* Admin Panel Header */}
        <div className="bg-spa-nude-50 border-b border-spa-beige p-6">
          <h1 className="text-3xl font-serif font-bold text-spa-dark">Admin Customization Panel</h1>
          <p className="text-spa-brown mt-2">Configure your salon's settings, services, staff, and more.</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-spa-beige overflow-x-auto">
          <button 
            className={`px-6 py-4 text-sm font-medium ${activeTab === 'salon' ? 'text-spa-olive border-b-2 border-spa-olive' : 'text-spa-brown hover:text-spa-dark'}`}
            onClick={() => setActiveTab('salon')}
          >
            Salon Profile
          </button>
          <button 
            className={`px-6 py-4 text-sm font-medium ${activeTab === 'services' ? 'text-spa-olive border-b-2 border-spa-olive' : 'text-spa-brown hover:text-spa-dark'}`}
            onClick={() => setActiveTab('services')}
          >
            Service Catalog
          </button>
          <button 
            className={`px-6 py-4 text-sm font-medium ${activeTab === 'roles' ? 'text-spa-olive border-b-2 border-spa-olive' : 'text-spa-brown hover:text-spa-dark'}`}
            onClick={() => setActiveTab('roles')}
          >
            Roles & Permissions
          </button>
          <button 
            className={`px-6 py-4 text-sm font-medium ${activeTab === 'staff' ? 'text-spa-olive border-b-2 border-spa-olive' : 'text-spa-brown hover:text-spa-dark'}`}
            onClick={() => setActiveTab('staff')}
          >
            Staff Management
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'salon' && <SalonProfileTab />}
          {activeTab === 'services' && <ServiceCatalogTab />}
          {activeTab === 'roles' && <RolesPermissionsTab />}
          {activeTab === 'staff' && <StaffManagementTab />}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
