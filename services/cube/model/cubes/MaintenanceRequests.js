/**
 * MaintenanceRequests cube — scoped to the authenticated client via properties.
 */
cube(`MaintenanceRequests`, {
  sql: `
    SELECT mr.*
    FROM maintenance_requests mr
    JOIN units u ON u.id = mr.unit_id AND u.deleted_at IS NULL
    JOIN properties p ON p.id = u.property_id AND p.deleted_at IS NULL
    WHERE mr.deleted_at IS NULL
      AND ${COMPILE_CONTEXT.securityContext?.clientId
        ? `p.client_id = '${COMPILE_CONTEXT.securityContext.clientId}'::uuid`
        : '1 = 0'}
  `,

  measures: {
    count: {
      type: `count`,
      title: `Total Maintenance Requests`,
    },

    newCount: {
      type: `count`,
      title: `New Requests`,
      filters: [{ sql: `${CUBE}.status = 'NEW'` }],
    },

    inProgressCount: {
      type: `count`,
      title: `In Progress`,
      filters: [{ sql: `${CUBE}.status = 'IN_PROGRESS'` }],
    },

    inReviewCount: {
      type: `count`,
      title: `In Review`,
      filters: [{ sql: `${CUBE}.status = 'IN_REVIEW'` }],
    },

    resolvedCount: {
      type: `count`,
      title: `Resolved`,
      filters: [{ sql: `${CUBE}.status = 'RESOLVED'` }],
    },

    canceledCount: {
      type: `count`,
      title: `Canceled`,
      filters: [{ sql: `${CUBE}.status = 'CANCELED'` }],
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
      title: `Status`,
    },

    priority: {
      sql: `priority`,
      type: `string`,
      title: `Priority`,
    },

    category: {
      sql: `category`,
      type: `string`,
      title: `Category`,
    },

    propertyId: {
      sql: `(SELECT u.property_id::text FROM units u WHERE u.id = ${CUBE}.unit_id LIMIT 1)`,
      type: `string`,
      title: `Property ID`,
    },

    unitId: {
      sql: `unit_id`,
      type: `string`,
      title: `Unit ID`,
    },

    createdAt: {
      sql: `created_at`,
      type: `time`,
      title: `Created At`,
    },

    resolvedAt: {
      sql: `resolved_at`,
      type: `time`,
      title: `Resolved At`,
    },
  },
})
