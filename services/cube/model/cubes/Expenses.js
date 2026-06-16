/**
 * Expenses cube — scoped to the authenticated client via properties.
 */
cube(`Expenses`, {
  sql: `
    SELECT e.*
    FROM expenses e
    JOIN properties p ON p.id = e.property_id::uuid AND p.deleted_at IS NULL
    WHERE e.deleted_at IS NULL
      AND ${COMPILE_CONTEXT.securityContext?.clientId
        ? `p.client_id = '${COMPILE_CONTEXT.securityContext.clientId}'::uuid`
        : '1 = 0'}
  `,

  measures: {
    count: {
      type: `count`,
      title: `Total Expenses`,
    },

    totalAmount: {
      sql: `amount`,
      type: `sum`,
      title: `Total Expense Amount (pesewas)`,
    },

    totalAmountConverted: {
      sql: `${CUBE}.amount *
        COALESCE(
          (SELECT er.rate FROM exchange_rates er
           WHERE er.base_currency = 'USD'
             AND er.quote_currency = '${COMPILE_CONTEXT.securityContext?.reportingCurrency ?? 'GHS'}'
             AND er.effective_date <= ${CUBE}.created_at::date
           ORDER BY er.effective_date DESC LIMIT 1),
          1
        ) / NULLIF(
          COALESCE(
            (SELECT er.rate FROM exchange_rates er
             WHERE er.base_currency = 'USD'
               AND er.quote_currency = ${CUBE}.currency
               AND er.effective_date <= ${CUBE}.created_at::date
             ORDER BY er.effective_date DESC LIMIT 1),
            1
          ),
          0
        )`,
      type: `sum`,
      title: `Total Expense Amount (converted to reporting currency)`,
    },

    maintenanceAmount: {
      sql: `amount`,
      type: `sum`,
      title: `Maintenance Expense Amount (pesewas)`,
      filters: [{ sql: `${CUBE}.context_type = 'MAINTENANCE'` }],
    },

    maintenanceAmountConverted: {
      sql: `${CUBE}.amount *
        COALESCE(
          (SELECT er.rate FROM exchange_rates er
           WHERE er.base_currency = 'USD'
             AND er.quote_currency = '${COMPILE_CONTEXT.securityContext?.reportingCurrency ?? 'GHS'}'
             AND er.effective_date <= ${CUBE}.created_at::date
           ORDER BY er.effective_date DESC LIMIT 1),
          1
        ) / NULLIF(
          COALESCE(
            (SELECT er.rate FROM exchange_rates er
             WHERE er.base_currency = 'USD'
               AND er.quote_currency = ${CUBE}.currency
               AND er.effective_date <= ${CUBE}.created_at::date
             ORDER BY er.effective_date DESC LIMIT 1),
            1
          ),
          0
        )`,
      type: `sum`,
      title: `Maintenance Expense Amount (converted to reporting currency)`,
      filters: [{ sql: `${CUBE}.context_type = 'MAINTENANCE'` }],
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
    },

    contextType: {
      sql: `context_type`,
      type: `string`,
      title: `Context Type`,
    },

    propertyId: {
      sql: `property_id`,
      type: `string`,
      title: `Property ID`,
    },

    description: {
      sql: `description`,
      type: `string`,
      title: `Description`,
    },

    createdAt: {
      sql: `created_at`,
      type: `time`,
      title: `Created At`,
    },
  },
})
