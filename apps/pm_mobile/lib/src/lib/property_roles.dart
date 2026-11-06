bool canManageProperty(Map<String, String>? roles, String? propertyId) =>
    propertyId != null && roles?[propertyId] == 'MANAGER';
