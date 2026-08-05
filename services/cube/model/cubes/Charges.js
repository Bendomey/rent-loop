import { propertyScopeSql } from './scope';

/**
 * Charges cube — what tenants actually owe, independent of what has been billed.
 *
 * `Invoices.outstandingAmount` can only see money that has already been
 * invoiced, so unbilled arrears are invisible to it. A tenant three months
 * behind on rent that nobody got round to invoicing shows as owing nothing.
 * These measures read the obligations themselves.
 *
 * Scoped through `financial_accounts`, which carries denormalised client_id and
 * property_id — one join, no COALESCE chain.
 */
cube(`Charges`, {
  sql: `
    SELECT ci.*,
           fa.property_id AS account_property_id,
           fa.client_id   AS account_client_id,
           fa.lease_id    AS account_lease_id
    FROM charge_instances ci
    JOIN financial_accounts fa
      ON fa.id = ci.financial_account_id AND fa.deleted_at IS NULL
    WHERE ci.deleted_at IS NULL
      AND ci.voided_at IS NULL
      AND ${COMPILE_CONTEXT.securityContext?.clientId
        ? `fa.client_id = '${COMPILE_CONTEXT.securityContext.clientId}'::uuid`
        : '1 = 0'}
      AND ${propertyScopeSql(COMPILE_CONTEXT.securityContext, 'fa.property_id::text')}
  `,

  measures: {
    count: {
      type: `count`,
      title: `Charge Count`,
    },

    // Everything the tenant has been charged, billed or not.
    expectedRevenue: {
      sql: `amount`,
      type: `sum`,
      title: `Expected Revenue (pesewas)`,
      filters: [{ sql: `${CUBE}.amount > 0` }],
    },

    outstandingAmount: {
      sql: `${CUBE}.amount - ${CUBE}.settled_amount`,
      type: `sum`,
      title: `Outstanding Amount (pesewas)`,
    },

    // The figure invoice-derived balances cannot produce: money that is overdue
    // and that nobody has billed yet.
    arrearsAmount: {
      sql: `${CUBE}.amount - ${CUBE}.settled_amount`,
      type: `sum`,
      title: `Arrears Amount (pesewas)`,
      filters: [
        { sql: `${CUBE}.due_date < NOW()` },
        { sql: `${CUBE}.amount > ${CUBE}.settled_amount` },
      ],
    },

    uninvoicedAmount: {
      sql: `${CUBE}.amount - ${CUBE}.invoiced_amount`,
      type: `sum`,
      title: `Uninvoiced Amount (pesewas)`,
    },

    // Negative charges are money owed back to the tenant.
    refundsOwed: {
      sql: `${CUBE}.settled_amount - ${CUBE}.amount`,
      type: `sum`,
      title: `Refunds Owed (pesewas)`,
      filters: [{ sql: `${CUBE}.amount < 0` }],
    },

    settledAmount: {
      sql: `settled_amount`,
      type: `sum`,
      title: `Settled Amount (pesewas)`,
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
    },

    financialAccountId: {
      sql: `financial_account_id`,
      type: `string`,
      title: `Financial Account ID`,
    },

    propertyId: {
      sql: `account_property_id`,
      type: `string`,
      title: `Property ID`,
    },

    leaseId: {
      sql: `account_lease_id`,
      type: `string`,
      title: `Lease ID`,
    },

    category: {
      sql: `category`,
      type: `string`,
      title: `Charge Category`,
    },

    name: {
      sql: `name`,
      type: `string`,
      title: `Charge Name`,
    },

    currency: {
      sql: `currency`,
      type: `string`,
      title: `Currency`,
    },

    dueDate: {
      sql: `due_date`,
      type: `time`,
      title: `Due Date`,
    },

    createdAt: {
      sql: `created_at`,
      type: `time`,
      title: `Created At`,
    },
  },
});
