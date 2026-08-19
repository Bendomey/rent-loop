import { propertyScopeSql } from './scope';

/**
 * Leases cube — scoped to the authenticated client via properties, then
 * narrowed to the caller's permitted properties (see `../scope.js`).
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
      AND ${propertyScopeSql(COMPILE_CONTEXT.securityContext, 'u.property_id::text')}
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

    // Distinct properties with at least one active lease (combine with a
    // moveOutDate timeDimension at query time to scope to an expiry window)
    expiringPropertyCount: {
      sql: `${propertyId}`,
      type: `countDistinct`,
      title: `Properties With Leases Expiring`,
      filters: [
        { sql: `${CUBE}.status = 'Lease.Status.Active'` },
        { sql: `${CUBE}.has_live_renewal = FALSE` },
      ],
    },

    // Active leases actually coming to an end. Pair with a moveOutDate
    // timeDimension to scope the window.
    //
    // Distinct from activeCount: a renewed lease stays Active until its own
    // term runs out, so it would otherwise be counted as expiring while the
    // tenancy is plainly continuing.
    expiringCount: {
      type: `count`,
      title: `Leases Expiring`,
      filters: [
        { sql: `${CUBE}.status = 'Lease.Status.Active'` },
        { sql: `${CUBE}.has_live_renewal = FALSE` },
      ],
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

    tenantId: {
      sql: `tenant_id`,
      type: `string`,
      title: `Tenant ID`,
    },

    status: {
      sql: `status`,
      type: `string`,
      title: `Lease Status`,
    },

    // Whether this lease has already been renewed.
    //
    // The child's status is what settles it: Terminated or Cancelled means the
    // renewal did not take and the parent really is ending. Anything else —
    // Pending, Active, Completed — means the tenancy continues past this
    // lease's own move-out date.
    hasLiveRenewal: {
      sql: `EXISTS (
        SELECT 1 FROM leases renewal
        WHERE renewal.parent_lease_id = ${CUBE}.id
          AND renewal.deleted_at IS NULL
          AND renewal.status NOT IN ('Lease.Status.Terminated', 'Lease.Status.Cancelled')
      )`,
      type: `boolean`,
      title: `Has Live Renewal`,
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

    moveOutDate: {
      sql: `move_out_date`,
      type: `time`,
      title: `Move-out Date`,
    },

    createdAt: {
      sql: `created_at`,
      type: `time`,
      title: `Created At`,
    },
  },
})
