import { propertyScopeSql } from './scope';

/**
 * Expenses cube — scoped to the authenticated client via properties, then
 * narrowed to the caller's permitted properties (see `../scope.js`).
 *
 * An expense is a payable: it is created together with the bill for it, and
 * settlement state lives on that bill rather than on the expense row. The
 * LATERAL join picks the one live invoice so status can be derived without
 * fanning a single expense out into several rows — an expense that was
 * invoiced, voided and reissued has more than one.
 *
 * Rows migrated from the old model have no invoice at all. Those posted
 * Dr Expense / Cr Cash when they were created, so the money had already left
 * and they read as SETTLED — see DeriveExpenseStatus in the Go services, which
 * this mirrors. Calling them outstanding would tell a landlord they owe
 * vendors for cash they have already spent.
 */
cube(`Expenses`, {
  sql: `
    SELECT e.*, i.status AS invoice_status
    FROM expenses e
    JOIN properties p ON p.id = e.property_id::uuid AND p.deleted_at IS NULL
    LEFT JOIN LATERAL (
      SELECT inv.status
      FROM invoices inv
      WHERE inv.context_expense_id = e.id
        AND inv.deleted_at IS NULL
        AND inv.status <> 'VOID'
      ORDER BY inv.created_at DESC
      LIMIT 1
    ) i ON TRUE
    WHERE e.deleted_at IS NULL
      AND ${COMPILE_CONTEXT.securityContext?.clientId
        ? `p.client_id = '${COMPILE_CONTEXT.securityContext.clientId}'::uuid`
        : '1 = 0'}
      AND ${propertyScopeSql(COMPILE_CONTEXT.securityContext, 'e.property_id::text')}
  `,

  measures: {
    // Voided expenses are excluded from every money measure below. A withdrawn
    // bill is not spend, and counting it would overstate what the property
    // costs to run.
    count: {
      type: `count`,
      title: `Total Expenses`,
      filters: [{ sql: `${CUBE}.voided_at IS NULL` }],
    },

    totalAmount: {
      sql: `amount`,
      type: `sum`,
      title: `Total Expense Amount (pesewas)`,
      filters: [{ sql: `${CUBE}.voided_at IS NULL` }],
    },

    maintenanceAmount: {
      sql: `amount`,
      type: `sum`,
      title: `Maintenance Expense Amount (pesewas)`,
      filters: [
        { sql: `${CUBE}.context_type = 'MAINTENANCE'` },
        { sql: `${CUBE}.voided_at IS NULL` },
      ],
    },

    generalAmount: {
      sql: `amount`,
      type: `sum`,
      title: `General Expense Amount (pesewas)`,
      filters: [
        { sql: `${CUBE}.context_type = 'GENERAL'` },
        { sql: `${CUBE}.voided_at IS NULL` },
      ],
    },

    // What the landlord still owes vendors: bills raised and not yet fully
    // paid. This is the figure the expense page leads with.
    outstandingAmount: {
      sql: `amount`,
      type: `sum`,
      title: `Owed To Vendors (pesewas)`,
      filters: [
        { sql: `${CUBE}.voided_at IS NULL` },
        { sql: `${CUBE}.invoice_status IN ('DRAFT', 'ISSUED', 'PARTIALLY_PAID')` },
      ],
    },

    settledAmount: {
      sql: `amount`,
      type: `sum`,
      title: `Paid To Vendors (pesewas)`,
      filters: [
        { sql: `${CUBE}.voided_at IS NULL` },
        {
          sql: `(${CUBE}.invoice_status IS NULL OR ${CUBE}.invoice_status = 'PAID')`,
        },
      ],
    },

    outstandingCount: {
      type: `count`,
      title: `Unpaid Expenses`,
      filters: [
        { sql: `${CUBE}.voided_at IS NULL` },
        { sql: `${CUBE}.invoice_status IN ('DRAFT', 'ISSUED', 'PARTIALLY_PAID')` },
      ],
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

    category: {
      sql: `category`,
      type: `string`,
      title: `Category`,
    },

    vendorName: {
      sql: `vendor_name`,
      type: `string`,
      title: `Vendor`,
    },

    // Mirrors DeriveExpenseStatus in the Go services. Kept in step with it:
    // two places deriving the same status differently is how a dashboard comes
    // to disagree with the screen it summarises.
    status: {
      sql: `
        CASE
          WHEN ${CUBE}.voided_at IS NOT NULL THEN 'VOIDED'
          WHEN ${CUBE}.invoice_status IS NULL THEN 'SETTLED'
          WHEN ${CUBE}.invoice_status = 'PAID' THEN 'SETTLED'
          WHEN ${CUBE}.invoice_status = 'PARTIALLY_PAID' THEN 'PARTIALLY_SETTLED'
          ELSE 'OUTSTANDING'
        END
      `,
      type: `string`,
      title: `Status`,
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
