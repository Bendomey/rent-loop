import { propertyScopeSql } from './scope';

/**
 * Payments cube — actual money received (vs. Invoices, which track what's owed).
 * Scoped to the authenticated client via the underlying invoice's payee, then
 * narrowed to the caller's permitted properties (see `../scope.js`).
 */

// Mirrors the `propertyId` dimension below, but resolved off the base SQL's
// existing `invoices i` join rather than re-querying invoices — one less
// correlated subquery per row than the dimension's version.
const PAYMENT_PROPERTY_ID_SQL = `COALESCE(
  (SELECT fa.property_id::text FROM financial_accounts fa WHERE fa.id = i.financial_account_id AND fa.deleted_at IS NULL LIMIT 1),
  (SELECT b.property_id::text FROM bookings b WHERE b.id = i.context_booking_id LIMIT 1),
  i.payer_property_id::text
)`;

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
      AND ${propertyScopeSql(COMPILE_CONTEXT.securityContext, PAYMENT_PROPERTY_ID_SQL)}
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
          (SELECT fa.property_id::text FROM financial_accounts fa WHERE fa.id = inv.financial_account_id AND fa.deleted_at IS NULL LIMIT 1),
          (SELECT b.property_id::text FROM bookings b WHERE b.id = inv.context_booking_id LIMIT 1),
          inv.payer_property_id::text
        )
        FROM invoices inv
        WHERE inv.id = ${CUBE}.invoice_id
      )`,
      type: `string`,
      title: `Property ID`,
    },

    // The parent invoice's financial account carries tenant_id directly, set
    // when approval links the lease. Application-stage payments resolve to NULL
    // until approval — correct, because no tenant exists yet.
    tenantId: {
      sql: `(
        SELECT COALESCE(
          (SELECT fa.tenant_id::text FROM financial_accounts fa WHERE fa.id = inv.financial_account_id AND fa.deleted_at IS NULL LIMIT 1),
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
