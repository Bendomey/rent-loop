/**
 * Invoices cube — scoped to the authenticated client's receivable invoices.
 * Security context (clientId) is injected via a signed JWT from the Go backend.
 */
cube(`Invoices`, {
  // Only invoices where the authenticated client is the payee (revenue they receive).
  // Uses 1=0 when clientId is absent so unauthenticated requests return zero rows
  // without triggering a uuid cast error.
  sql: `
    SELECT *
    FROM invoices
    WHERE deleted_at IS NULL
      AND payee_type = 'PROPERTY_OWNER'
      AND ${COMPILE_CONTEXT.securityContext?.clientId
        ? `payee_client_id = '${COMPILE_CONTEXT.securityContext.clientId}'::uuid`
        : '1 = 0'}
  `,

  measures: {
    count: {
      type: `count`,
      title: `Invoice Count`,
    },

    totalAmount: {
      sql: `total_amount`,
      type: `sum`,
      title: `Total Invoice Amount (pesewas)`,
    },

    // Sum of total_amount for invoices in PAID status
    paidAmount: {
      sql: `total_amount`,
      type: `sum`,
      title: `Paid Amount (pesewas)`,
      filters: [{ sql: `${CUBE}.status = 'PAID'` }],
    },

    // Sum of total_amount for invoices in ISSUED or PARTIALLY_PAID status (outstanding)
    outstandingAmount: {
      sql: `total_amount`,
      type: `sum`,
      title: `Outstanding Amount (pesewas)`,
      filters: [
        {
          sql: `${CUBE}.status IN ('ISSUED', 'PARTIALLY_PAID')`,
        },
      ],
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
    },

    // Derived property ID — resolves via context join (TA → unit, Lease → unit, payer_property_id)
    propertyId: {
      sql: `COALESCE(
        (SELECT u.property_id::text FROM tenant_applications ta JOIN units u ON ta.desired_unit_id = u.id WHERE ta.id = ${CUBE}.context_tenant_application_id LIMIT 1),
        (SELECT u.property_id::text FROM leases l JOIN units u ON l.unit_id = u.id WHERE l.id = ${CUBE}.context_lease_id LIMIT 1),
        ${CUBE}.payer_property_id::text
      )`,
      type: `string`,
      title: `Property ID`,
    },

    status: {
      sql: `status`,
      type: `string`,
      title: `Invoice Status`,
    },

    contextType: {
      sql: `context_type`,
      type: `string`,
      title: `Context Type`,
    },

    issuedAt: {
      sql: `issued_at`,
      type: `time`,
      title: `Issued At`,
    },

    paidAt: {
      sql: `paid_at`,
      type: `time`,
      title: `Paid At`,
    },

    createdAt: {
      sql: `created_at`,
      type: `time`,
      title: `Created At`,
    },
  },
})
