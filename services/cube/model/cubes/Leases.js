/**
 * Leases cube — scoped to the authenticated client via properties.
 */
cube(`Leases`, {
  sql: `
    SELECT l.*
    FROM leases l
    JOIN units u ON u.id = l.unit_id AND u.deleted_at IS NULL
    JOIN properties p ON p.id = u.property_id AND p.deleted_at IS NULL
    WHERE l.deleted_at IS NULL
      AND ${COMPILE_CONTEXT.securityContext?.clientId
        ? `p.client_id = '${COMPILE_CONTEXT.securityContext.clientId}'::uuid`
        : '1 = 0'}
  `,

  measures: {
    count: {
      type: `count`,
      title: `Total Leases`,
    },

    activeCount: {
      type: `count`,
      title: `Active Leases`,
      filters: [{ sql: `${CUBE}.status = 'Lease.Status.Active'` }],
    },

    pendingCount: {
      type: `count`,
      title: `Pending Leases`,
      filters: [{ sql: `${CUBE}.status = 'Lease.Status.Pending'` }],
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
    },

    propertyId: {
      sql: `(SELECT u.property_id::text FROM units u WHERE u.id = ${CUBE}.unit_id LIMIT 1)`,
      type: `string`,
      title: `Property ID`,
    },

    status: {
      sql: `status`,
      type: `string`,
      title: `Lease Status`,
    },

    activatedAt: {
      sql: `activated_at`,
      type: `time`,
      title: `Activated At`,
    },

    moveInDate: {
      sql: `move_in_date`,
      type: `time`,
      title: `Move-in Date`,
    },

    createdAt: {
      sql: `created_at`,
      type: `time`,
      title: `Created At`,
    },
  },
})
