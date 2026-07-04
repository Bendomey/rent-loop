/**
 * Payments cube — actual money received (vs. Invoices, which track what's owed).
 * Scoped to the authenticated client via the underlying invoice's payee.
 */
cube(`Payments`, {
  sql: `
    SELECT p.*
    FROM payments p
    JOIN invoices i ON i.id = p.invoice_id AND i.deleted_at IS NULL
    WHERE p.deleted_at IS NULL
      AND i.payee_type = 'PROPERTY_OWNER'
      AND ${COMPILE_CONTEXT.securityContext?.clientId
        ? `i.payee_client_id = '${COMPILE_CONTEXT.securityContext.clientId}'::uuid`
        : '1 = 0'}
  `,

  measures: {
    count: {
      type: `count`,
      title: `Payment Count`,
    },

    totalAmount: {
      sql: `amount`,
      type: `sum`,
      title: `Total Amount Paid (pesewas)`,
      filters: [{ sql: `${CUBE}.status = 'SUCCESSFUL'` }],
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
    },

    invoiceId: {
      sql: `invoice_id`,
      type: `string`,
      title: `Invoice ID`,
    },

    // Derived via the parent invoice's context, mirroring Invoices.propertyId
    propertyId: {
      sql: `(
        SELECT COALESCE(
          (SELECT u.property_id::text FROM tenant_applications ta JOIN units u ON ta.desired_unit_id = u.id WHERE ta.id = inv.context_tenant_application_id LIMIT 1),
          (SELECT u.property_id::text FROM leases l JOIN units u ON l.unit_id = u.id WHERE l.id = inv.context_lease_id LIMIT 1),
          (SELECT b.property_id::text FROM bookings b WHERE b.id = inv.context_booking_id LIMIT 1),
          (SELECT e.property_id::text FROM expenses e WHERE e.id = inv.context_expense_id LIMIT 1),
          inv.payer_property_id::text
        )
        FROM invoices inv
        WHERE inv.id = ${CUBE}.invoice_id
      )`,
      type: `string`,
      title: `Property ID`,
    },

    // Derived via the parent invoice's lease/booking context
    tenantId: {
      sql: `(
        SELECT COALESCE(
          (SELECT l.tenant_id::text FROM leases l WHERE l.id = inv.context_lease_id LIMIT 1),
          (SELECT b.tenant_id::text FROM bookings b WHERE b.id = inv.context_booking_id LIMIT 1)
        )
        FROM invoices inv
        WHERE inv.id = ${CUBE}.invoice_id
      )`,
      type: `string`,
      title: `Tenant ID`,
    },

    status: {
      sql: `status`,
      type: `string`,
      title: `Payment Status`,
    },

    rail: {
      sql: `rail`,
      type: `string`,
      title: `Payment Rail`,
    },

    createdAt: {
      sql: `created_at`,
      type: `time`,
      title: `Created At`,
    },

    successfulAt: {
      sql: `successful_at`,
      type: `time`,
      title: `Successful At`,
    },
  },
})
