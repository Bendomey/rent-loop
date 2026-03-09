/**
 * Units cube — scoped to the authenticated client via properties.
 */
cube(`Units`, {
  sql: `
    SELECT u.*
    FROM units u
    JOIN properties p ON p.id = u.property_id AND p.deleted_at IS NULL
    WHERE u.deleted_at IS NULL
      AND p.client_id = '${COMPILE_CONTEXT.securityContext?.clientId ?? 'NO_ACCESS'}'
  `,

  measures: {
    count: {
      type: `count`,
      title: `Total Units`,
    },

    availableCount: {
      type: `count`,
      title: `Available Units`,
      filters: [{ sql: `${CUBE}.status = 'AVAILABLE'` }],
    },

    occupiedCount: {
      type: `count`,
      title: `Occupied Units`,
      filters: [{ sql: `${CUBE}.status = 'OCCUPIED'` }],
    },

    maintenanceCount: {
      type: `count`,
      title: `Units in Maintenance`,
      filters: [{ sql: `${CUBE}.status = 'MAINTENANCE'` }],
    },

    draftCount: {
      type: `count`,
      title: `Draft Units`,
      filters: [{ sql: `${CUBE}.status = 'DRAFT'` }],
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
      title: `Unit Status`,
    },

    type: {
      sql: `type`,
      type: `string`,
      title: `Unit Type`,
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
