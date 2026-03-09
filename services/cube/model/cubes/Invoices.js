/**
 * Invoices cube — scoped to the authenticated client's receivable invoices.
 * Security context (clientId) is injected via a signed JWT from the Go backend.
 */
cube(`Invoices`, {
  // Only invoices where the authenticated client is the payee (revenue they receive).
  // Falls back to 'NO_ACCESS' so unauthenticated requests return zero rows.
  sql: `
    SELECT *
    FROM invoices
    WHERE deleted_at IS NULL
      AND payee_type = 'PROPERTY_OWNER'
      AND payee_client_id = '${COMPILE_CONTEXT.securityContext?.clientId ?? 'NO_ACCESS'}'
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
