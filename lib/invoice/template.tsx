// lib/invoice/template.tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

export interface InvoiceBusiness {
  name: string;
  phone?: string | null;
  address?: string | null;
}

export interface InvoiceCustomer {
  name: string | null;
  phone: string;
  address?: string | null;
}

export interface InvoiceItem {
  name?: string | null;
  quantity?: number | null;
  price?: number | null;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderId: string;
  date: Date;
  business: InvoiceBusiness;
  customer: InvoiceCustomer;
  items: InvoiceItem[];
  currency: string;
  total: number;
  paymentMethod?: string | null;
  paymentStatus: string;
  orderStatus: string;
  notes?: string | null;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0B1220",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  brand: {
    flexDirection: "column",
  },
  brandName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#0B1220",
    marginBottom: 4,
  },
  brandMeta: {
    fontSize: 9,
    color: "#556075",
    marginBottom: 2,
  },
  invoiceTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#0B1220",
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 10,
    color: "#556075",
    textAlign: "right",
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  metaBlock: {
    width: "30%",
  },
  metaLabel: {
    fontSize: 8,
    color: "#8B95AB",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 10,
    color: "#0B1220",
    marginBottom: 2,
  },
  metaValueBold: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0B1220",
    marginBottom: 2,
  },
  summaryBlock: {
    width: "35%",
    backgroundColor: "#F5F7FE",
    borderRadius: 6,
    padding: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 9,
    color: "#556075",
  },
  summaryValue: {
    fontSize: 9,
    color: "#0B1220",
    fontFamily: "Helvetica-Bold",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#E6EAF5",
  },
  balanceLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0B1220",
  },
  balanceValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0B1220",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0B1220",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 2,
  },
  thText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  thItem: { width: "50%" },
  thQty: { width: "15%", textAlign: "right" },
  thRate: { width: "17.5%", textAlign: "right" },
  thAmount: { width: "17.5%", textAlign: "right" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F5FB",
  },
  tdText: {
    fontSize: 10,
    color: "#0B1220",
  },
  tdItem: { width: "50%" },
  tdQty: { width: "15%", textAlign: "right", color: "#556075" },
  tdRate: { width: "17.5%", textAlign: "right", color: "#556075" },
  tdAmount: { width: "17.5%", textAlign: "right", fontFamily: "Helvetica-Bold" },
  totalsBlock: {
    marginTop: 20,
    marginLeft: "auto",
    width: "50%",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalsLabel: {
    fontSize: 10,
    color: "#556075",
  },
  totalsValue: {
    fontSize: 10,
    color: "#0B1220",
  },
  totalsGrand: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E6EAF5",
  },
  totalsGrandLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0B1220",
  },
  totalsGrandValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0B1220",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#8B95AB",
    borderTopWidth: 1,
    borderTopColor: "#F3F5FB",
    paddingTop: 10,
  },
  statusChip: {
    fontSize: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
  },
});

function fmt(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    PKR: "Rs ",
    INR: "₹",
    AED: "AED ",
    SAR: "SAR ",
    BDT: "৳",
    NGN: "₦",
  };
  const sym = symbols[currency] || `${currency} `;
  const n = Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: Number(amount) % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${sym}${n}`;
}

export function InvoiceContent({ data }: { data: InvoiceData }) {
  const subtotal = data.items.reduce((sum, it) => {
    const qty = it.quantity ?? 1;
    const price = it.price ?? 0;
    return sum + qty * price;
  }, 0);

  const effectiveSubtotal = subtotal > 0 ? subtotal : data.total;
  const tax = 0;
  const grand = effectiveSubtotal + tax;

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brand}>
          <Text style={styles.brandName}>{data.business.name}</Text>
          {data.business.phone ? (
            <Text style={styles.brandMeta}>{data.business.phone}</Text>
          ) : null}
          {data.business.address ? (
            <Text style={styles.brandMeta}>{data.business.address}</Text>
          ) : null}
        </View>
        <View>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>{data.invoiceNumber}</Text>
        </View>
      </View>

      {/* Meta row */}
      <View style={styles.metaRow}>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Bill To</Text>
          <Text style={styles.metaValueBold}>
            {data.customer.name || "Customer"}
          </Text>
          <Text style={styles.metaValue}>{data.customer.phone}</Text>
        </View>

        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Ship To</Text>
          <Text style={styles.metaValue}>{data.customer.address || "—"}</Text>
        </View>

        <View style={styles.summaryBlock}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date</Text>
            <Text style={styles.summaryValue}>
              {data.date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment</Text>
            <Text style={styles.summaryValue}>{data.paymentMethod || "—"}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Status</Text>
            <Text style={styles.summaryValue}>
              {data.paymentStatus === "paid" ? "Paid" : "Unpaid"}
            </Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Balance Due</Text>
            <Text style={styles.balanceValue}>{fmt(grand, data.currency)}</Text>
          </View>
        </View>
      </View>

      {/* Items table */}
      <View style={styles.tableHeader}>
        <Text style={[styles.thText, styles.thItem]}>Item</Text>
        <Text style={[styles.thText, styles.thQty]}>Qty</Text>
        <Text style={[styles.thText, styles.thRate]}>Rate</Text>
        <Text style={[styles.thText, styles.thAmount]}>Amount</Text>
      </View>

      {data.items.map((it, i) => {
        const qty = it.quantity ?? 1;
        const price = it.price ?? 0;
        const lineTotal = qty * price;
        return (
          <View key={i} style={styles.tableRow} wrap={false}>
            <Text style={[styles.tdText, styles.tdItem]}>
              {it.name || "Item"}
            </Text>
            <Text style={[styles.tdText, styles.tdQty]}>{qty}</Text>
            <Text style={[styles.tdText, styles.tdRate]}>
              {price > 0 ? fmt(price, data.currency) : "—"}
            </Text>
            <Text style={[styles.tdText, styles.tdAmount]}>
              {lineTotal > 0 ? fmt(lineTotal, data.currency) : "—"}
            </Text>
          </View>
        );
      })}

      {/* Totals */}
      <View style={styles.totalsBlock}>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Subtotal</Text>
          <Text style={styles.totalsValue}>{fmt(effectiveSubtotal, data.currency)}</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Tax (0%)</Text>
          <Text style={styles.totalsValue}>{fmt(tax, data.currency)}</Text>
        </View>
        <View style={styles.totalsGrand}>
          <Text style={styles.totalsGrandLabel}>Total</Text>
          <Text style={styles.totalsGrandValue}>{fmt(grand, data.currency)}</Text>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer} fixed>
        Thank you for your business. Order #{data.orderId} · Generated by Fluxo
      </Text>
    </Page>
  );
}

export function InvoicePDF({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <InvoiceContent data={data} />
    </Document>
  );
}