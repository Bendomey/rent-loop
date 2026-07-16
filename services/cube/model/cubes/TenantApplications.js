/**
 * TenantApplications cube — scoped to the authenticated client via properties.
 */
cube(`TenantApplications`, {
  sql: `
    SELECT ta.*
    FROM tenant_applications ta
    JOIN properties p ON p.id = ta.property_id AND p.deleted_at IS NULL
    WHERE ta.deleted_at IS NULL
      AND ${COMPILE_CONTEXT.securityContext?.clientId
        ? `p.client_id = '${COMPILE_CONTEXT.securityContext.clientId}'::uuid`
        : '1 = 0'}
  `,

  measures: {
    count: {
      type: `count`,
      title: `Total Applications`,
    },

    inProgressCount: {
      type: `count`,
      title: `In-progress Applications`,
      filters: [{ sql: `${CUBE}.status = 'TenantApplication.Status.InProgress'` }],
    },

    completedCount: {
      type: `count`,
      title: `Completed Applications`,
      filters: [{ sql: `${CUBE}.status = 'TenantApplication.Status.Completed'` }],
    },

    cancelledCount: {
      type: `count`,
      title: `Cancelled Applications`,
      filters: [{ sql: `${CUBE}.status = 'TenantApplication.Status.Cancelled'` }],
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
    },

    status: {
      sql: `status`,
      type: `string`,
      title: `Application Status`,
    },

    propertyId: {
      sql: `property_id`,
      type: `string`,
      title: `Property ID`,
    },

    createdAt: {
      sql: `created_at`,
      type: `time`,
      title: `Created At`,
    },
  },
})
