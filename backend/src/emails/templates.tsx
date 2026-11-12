import { Body, Button, Column, Container, Head, Heading, Hr, Html, Img, Link, Preview, Row, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

const C = { ink: "#141414", ivory: "#FAF7F2", brass: "#B08D57", stone: "#6B6560", line: "#E6DED2", emerald: "#1F3D36" };
const rs = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-PK")}`;

export type EmailOrder = {
  orderNumber: string;
  customer: { name: string; email: string; phone: string };
  shipping: { address: string; city: string };
  items: { name: string; image: string; size: string; color: string; qty: number; lineTotal: number }[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  payment: { method: string; status?: string };
  courier?: { name: string; trackingNumber: string } | null;
};

type Brand = { storeName: string; siteUrl: string; phone: string; email: string };

function Layout({ preview, brand, children }: { preview: string; brand: Brand; children: ReactNode }) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ background: C.ivory, fontFamily: "Helvetica, Arial, sans-serif", margin: 0, padding: "32px 0" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", background: "#ffffff", border: `1px solid ${C.line}` }}>
          <Section style={{ background: C.ink, padding: "28px 32px", textAlign: "center" }}>
            <Text style={{ margin: 0, color: C.ivory, fontFamily: "Georgia, serif", fontSize: 26, letterSpacing: 1 }}>AH Clothing</Text>
            <Text style={{ margin: "4px 0 0", color: C.brass, fontSize: 10, letterSpacing: 6, textTransform: "uppercase" }}>Hub · Pakistan</Text>
          </Section>
          <Section style={{ padding: "36px 32px" }}>{children}</Section>
          <Hr style={{ borderColor: C.line, margin: 0 }} />
          <Section style={{ padding: "24px 32px", textAlign: "center" }}>
            <Text style={{ color: C.stone, fontSize: 12, margin: 0 }}>Questions? Reply to this email, call {brand.phone} or WhatsApp us.</Text>
            <Text style={{ color: C.stone, fontSize: 12, margin: "8px 0 0" }}>
              <Link href={brand.siteUrl} style={{ color: C.brass }}>{brand.storeName}</Link> · Cash on Delivery nationwide · 7-day easy returns
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function Items({ order }: { order: EmailOrder }) {
  return (
    <Section style={{ border: `1px solid ${C.line}`, padding: 16, marginTop: 24 }}>
      {order.items.map((it, i) => (
        <Row key={i} style={{ marginBottom: 12 }}>
          <Column style={{ width: 64 }}>{it.image ? <Img src={it.image} width="56" height="74" alt={it.name} style={{ objectFit: "cover" }} /> : null}</Column>
          <Column>
            <Text style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.ink }}>{it.name}</Text>
            <Text style={{ margin: "2px 0 0", fontSize: 12, color: C.stone }}>{it.color} · {it.size} · Qty {it.qty}</Text>
          </Column>
          <Column style={{ textAlign: "right", width: 100 }}><Text style={{ margin: 0, fontSize: 14, color: C.ink }}>{rs(it.lineTotal)}</Text></Column>
        </Row>
      ))}
      <Hr style={{ borderColor: C.line }} />
      {[["Subtotal", rs(order.subtotal)], ...(order.discount ? [["Discount", `− ${rs(order.discount)}`]] : []), ["Delivery", order.deliveryCharge ? rs(order.deliveryCharge) : "Free"]].map(([l, v]) => (
        <Row key={l}><Column><Text style={{ margin: "2px 0", fontSize: 13, color: C.stone }}>{l}</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ margin: "2px 0", fontSize: 13, color: C.ink }}>{v}</Text></Column></Row>
      ))}
      <Row><Column><Text style={{ margin: "8px 0 0", fontSize: 16, fontWeight: 700, color: C.ink }}>Total</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ margin: "8px 0 0", fontSize: 16, fontWeight: 700, color: C.ink }}>{rs(order.total)}</Text></Column></Row>
    </Section>
  );
}

const h1 = { fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 30, color: C.ink, margin: "0 0 12px" };
const p = { fontSize: 15, lineHeight: "24px", color: C.stone, margin: "0 0 12px" };
const btn = { background: C.ink, color: C.ivory, padding: "14px 28px", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" as const, textDecoration: "none" };
const PAY: Record<string, string> = { cod: "Cash on Delivery", jazzcash: "JazzCash", easypaisa: "EasyPaisa" };

export function OrderPlacedEmail({ order, brand }: { order: EmailOrder; brand: Brand }) {
  return (
    <Layout preview={`Order ${order.orderNumber} received — thank you!`} brand={brand}>
      <Text style={{ color: C.brass, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", margin: "0 0 8px" }}>Order confirmed</Text>
      <Heading style={h1}>Thank you, {order.customer.name.split(" ")[0]}!</Heading>
      <Text style={p}>We&apos;ve received your order <strong style={{ color: C.ink }}>{order.orderNumber}</strong>. {order.payment.method === "cod" ? "We'll contact you shortly to confirm and dispatch within 24 hours." : "We'll verify your payment and confirm your order shortly."}</Text>
      <Items order={order} />
      <Section style={{ marginTop: 24 }}>
        <Text style={{ ...p, margin: 0 }}><strong style={{ color: C.ink }}>Deliver to:</strong> {order.customer.name}, {order.shipping.address}, {order.shipping.city} · {order.customer.phone}</Text>
        <Text style={{ ...p, margin: "6px 0 0" }}><strong style={{ color: C.ink }}>Payment:</strong> {PAY[order.payment.method] ?? order.payment.method}</Text>
      </Section>
      <Section style={{ textAlign: "center", marginTop: 28 }}><Button href={`${brand.siteUrl}/account/orders`} style={btn}>Track your order</Button></Section>
    </Layout>
  );
}

const STATUS_COPY: Record<string, { title: string; body: string }> = {
  confirmed: { title: "Your order is confirmed", body: "Great news — our team has confirmed your order and is preparing it with care." },
  packed: { title: "Your order is packed", body: "Your pieces are packed and ready to be handed to our courier partner." },
  shipped: { title: "Your order is on its way", body: "Your order has been shipped. You can track it with the details below." },
  delivered: { title: "Delivered — enjoy!", body: "Your order has been delivered. We hope you love it. We'd be grateful for a quick review!" },
  cancelled: { title: "Your order was cancelled", body: "Your order has been cancelled. If you paid online, a refund will be processed within 5–7 working days." },
  returned: { title: "Return received", body: "We've received your return. Your refund or exchange is being processed." },
};

export function StatusEmail({ order, status, brand, customText }: { order: EmailOrder; status: string; brand: Brand; customText?: string }) {
  const c = STATUS_COPY[status] ?? { title: `Order update: ${status}`, body: "" };
  return (
    <Layout preview={`${c.title} — ${order.orderNumber}`} brand={brand}>
      <Text style={{ color: C.brass, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", margin: "0 0 8px" }}>Order {order.orderNumber}</Text>
      <Heading style={h1}>{c.title}</Heading>
      <Text style={p}>Hi {order.customer.name.split(" ")[0]}, {customText || c.body}</Text>
      {status === "shipped" && order.courier && (
        <Section style={{ background: C.ivory, padding: 16, marginTop: 8 }}>
          <Text style={{ margin: 0, fontSize: 14, color: C.ink }}>Courier: <strong>{order.courier.name}</strong></Text>
          <Text style={{ margin: "4px 0 0", fontSize: 14, color: C.ink }}>Tracking number: <strong>{order.courier.trackingNumber}</strong></Text>
        </Section>
      )}
      <Items order={order} />
      <Section style={{ textAlign: "center", marginTop: 28 }}><Button href={`${brand.siteUrl}/account/orders`} style={btn}>View order</Button></Section>
    </Layout>
  );
}

export function AdminNewOrderEmail({ order, brand }: { order: EmailOrder; brand: Brand }) {
  return (
    <Layout preview={`New order ${order.orderNumber} — ${rs(order.total)}`} brand={brand}>
      <Heading style={h1}>New order {order.orderNumber}</Heading>
      <Text style={p}>{order.customer.name} · {order.customer.phone} · {order.shipping.city} · {PAY[order.payment.method]}{order.payment.status === "awaiting_approval" ? " (screenshot awaiting approval)" : ""}</Text>
      <Items order={order} />
      <Section style={{ textAlign: "center", marginTop: 28 }}><Button href={`${brand.siteUrl}/admin/orders`} style={{ ...btn, background: C.emerald }}>Open in admin</Button></Section>
    </Layout>
  );
}

export function CustomEmail({ name, subject, message, brand }: { name: string; subject: string; message: string; brand: Brand }) {
  return (
    <Layout preview={subject} brand={brand}>
      <Heading style={h1}>{subject}</Heading>
      <Text style={p}>Hi {name.split(" ")[0]},</Text>
      {message.split(/\n{2,}/).map((para, i) => <Text key={i} style={{ ...p, whiteSpace: "pre-line" }}>{para}</Text>)}
      <Text style={{ ...p, marginTop: 24 }}>Warm regards,<br />Team {brand.storeName}</Text>
    </Layout>
  );
}
