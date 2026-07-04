/**
 * Bookings cube — scoped to the authenticated client via properties.
 */
cube(`Bookings`, {
  sql: `
    SELECT b.*
    FROM bookings b
    JOIN properties p ON p.id = b.property_id AND p.deleted_at IS NULL
    WHERE b.deleted_at IS NULL
      AND ${COMPILE_CONTEXT.securityContext?.clientId
        ? `p.client_id = '${COMPILE_CONTEXT.securityContext.clientId}'::uuid`
        : '1 = 0'}
  `,

  measures: {
    count: {
      type: `count`,
      title: `Total Bookings`,
    },

    confirmedCount: {
      type: `count`,
      title: `Confirmed Bookings`,
      filters: [{ sql: `${CUBE}.status = 'CONFIRMED'` }],
    },

    checkedInCount: {
      type: `count`,
      title: `Checked-in Bookings`,
      filters: [{ sql: `${CUBE}.status = 'CHECKED_IN'` }],
    },

    completedCount: {
      type: `count`,
      title: `Completed Bookings`,
      filters: [{ sql: `${CUBE}.status = 'COMPLETED'` }],
    },

    canceledCount: {
      type: `count`,
      title: `Canceled Bookings`,
      filters: [{ sql: `${CUBE}.status = 'CANCELLED'` }],
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
      title: `Booking Status`,
    },

    propertyId: {
      sql: `property_id`,
      type: `string`,
      title: `Property ID`,
    },

    tenantId: {
      sql: `tenant_id`,
      type: `string`,
      title: `Tenant ID`,
    },

    unitId: {
      sql: `unit_id`,
      type: `string`,
      title: `Unit ID`,
    },

    checkInDate: {
      sql: `check_in_date`,
      type: `time`,
      title: `Check-in Date`,
    },

    checkOutDate: {
      sql: `check_out_date`,
      type: `time`,
      title: `Check-out Date`,
    },

    createdAt: {
      sql: `created_at`,
      type: `time`,
      title: `Created At`,
    },
  },
})
