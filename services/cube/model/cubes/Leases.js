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

    // A renewed lease stays Active until its own term ends, so its renewal can
    // be Active alongside it — counting leases would count that tenant twice.
    activeTenantCount: {
      sql: `tenant_id`,
      type: `countDistinct`,
      title: `Active Tenants`,
      filters: [{ sql: `${CUBE}.status = 'Lease.Status.Active'` }],
    },

    pendingCount: {
      type: `count`,
      title: `Pending Leases`,
      filters: [{ sql: `${CUBE}.status = 'Lease.Status.Pending'` }],
    },

    expiringPropertyCount: {
      sql: `${propertyId}`,
      type: `countDistinct`,
      title: `Properties With Leases Expiring`,
      filters: [
        { sql: `${CUBE}.status = 'Lease.Status.Active'` },
        { sql: `${hasLiveRenewal} = FALSE` },
        { sql: `${isExpiring}` },
      ],
    },

    // Distinct from activeCount: a renewed lease stays Active until its own
    // term runs out, so it would otherwise be counted as expiring while the
    // tenancy is plainly continuing.
    expiringCount: {
      type: `count`,
      title: `Leases Expiring`,
      filters: [
        { sql: `${CUBE}.status = 'Lease.Status.Active'` },
        { sql: `${hasLiveRenewal} = FALSE` },
        { sql: `${isExpiring}` },
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

    // Move-out inside the warning window for the length of the stay. Must
    // match leaseExpiringScope in services/main and expiringWindowMs in the
    // property manager, or the Insights count disagrees with the list it opens.
    isExpiring: {
      sql: `(${CUBE}.move_out_date > NOW()
        AND ${CUBE}.move_out_date <= NOW() + (CASE
          WHEN ${CUBE}.move_out_date - ${CUBE}.move_in_date < INTERVAL '7 days' THEN INTERVAL '1 day'
          WHEN ${CUBE}.move_out_date - ${CUBE}.move_in_date < INTERVAL '30 days' THEN INTERVAL '3 days'
          WHEN ${CUBE}.move_out_date - ${CUBE}.move_in_date < INTERVAL '90 days' THEN INTERVAL '7 days'
          ELSE INTERVAL '30 days'
        END))`,
      type: `boolean`,
      title: `Is Expiring`,
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
