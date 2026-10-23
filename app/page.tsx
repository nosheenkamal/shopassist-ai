
"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([
    {
      role: "assistant",
      text: "Hi there! 👋 Welcome to ShopAssist. I can help with product questions, order support, and refund policies. What can I help you with?",
    },
  ]);

 
async function sendMessage() {
  const question = message.trim();
  if (!question) return;

  setChat((previous) => [
    ...previous,
    { role: "user", text: question },
  ]);
  setMessage("");

  try {
    const response = await fetch("/api/products");
    const data = await response.json();

    if (!response.ok) {
      throw new Error("Could not load products");
    }

    const products = data.products ?? [];
    const normalizedQuestion = question.toLowerCase();
    
const orderIdMatch = question.match(/\bORD\d+\b/i);

if (orderIdMatch) {
  try {
    const orderResponse = await fetch("/api/orders");
    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      throw new Error("Could not load orders");
    }

    const order = (orderData.orders ?? []).find(
      (item: Record<string, string>) =>
        item.Order_ID.toLowerCase() ===
        orderIdMatch[0].toLowerCase()
    );
if (
  order &&
  (
    normalizedQuestion.includes("refund") ||
    normalizedQuestion.includes("return") ||
    normalizedQuestion.includes("money back")
  )
) {
  const refundResponse = await fetch("/api/refund", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderId: order.Order_ID,
    }),
  });

  const refundData = await refundResponse.json();

  const refundAnswer = refundResponse.ok
    ? `Your refund request for ${order.Order_ID} has been recorded as Pending Review. No refund has been approved yet.`
    : refundData.error || "I couldn't record your refund request right now.";

  setChat((previous) => [
    ...previous,
    { role: "assistant", text: refundAnswer },
  ]);
  return;
}
    const answer = order
      ? `Order ${order.Order_ID} is currently ${order.Status}. Product ID: ${order.Product_ID}. Quantity: ${order.Quantity}. Order date: ${order.Order_Date}.`
      : `Sorry, I couldn't find order ${orderIdMatch[0]}. Please check the order ID.`;

    setChat((previous) => [
      ...previous,
      { role: "assistant", text: answer },
    ]);
    return;
  } catch {
    setChat((previous) => [
      ...previous,
      {
        role: "assistant",
        text: "Sorry, I couldn't retrieve the order details. Please try again.",
      },
    ]);
    return;
  }
}

    const matches = products.filter(
      (product: Record<string, string>) =>
        normalizedQuestion.includes(
          product.Product_Name.toLowerCase()
        )
    );

    let answer = "";
if (
  normalizedQuestion.includes("cheapest") ||
  normalizedQuestion.includes("lowest price")
) {
  const cheapest = [...products].sort(
    (a: Record<string, string>, b: Record<string, string>) =>
      Number(a.Price_USD) - Number(b.Price_USD)
  )[0];

  answer = cheapest
    ? `Our cheapest product is ${cheapest.Product_Name} at $${cheapest.Price_USD}.`
    : "I couldn't find any products right now.";
 } else if (
  normalizedQuestion.includes("most expensive") ||
  normalizedQuestion.includes("highest price")
) {
  const mostExpensive = [...products].sort(
    (a: Record<string, string>, b: Record<string, string>) =>
      Number(b.Price_USD) - Number(a.Price_USD)
  )[0];

  answer = mostExpensive
    ? `Our most expensive product is ${mostExpensive.Product_Name} at $${mostExpensive.Price_USD}.`
    : "I couldn't find any products right now.";
} else if (matches.length > 0) {
      answer = matches
        .map(
          (product: Record<string, string>) =>
            `${product.Product_Name}: $${product.Price_USD}. ` +
            `Stock: ${product.Stock}. ` +
            `Discount: ${product.Discount_Percent}%.`
        )
        .join("\n");
    } else if (
      normalizedQuestion.includes("sale") ||
      normalizedQuestion.includes("discount") ||
      normalizedQuestion.includes("offer")
    ) {
      const discounted = products.filter(
        (product: Record<string, string>) =>
          Number(product.Discount_Percent) > 0
      );

      answer = discounted.length
        ? "These products currently have discounts:\n" +
          discounted
            .map(
              (product: Record<string, string>) =>
                `${product.Product_Name}: ${product.Discount_Percent}% off`
            )
            .join("\n")
        : "There are no discounted products listed right now.";
  } else if (
  normalizedQuestion.includes("refund") ||
  normalizedQuestion.includes("return") ||
  normalizedQuestion.includes("money back")
) {
 answer = "Loading refund policy...";
try {
  const policyResponse = await fetch("/api/policy");
  const policyData = await policyResponse.json();

  answer = policyResponse.ok && policyData.policy
    ? `Here is our demo refund policy:\n${policyData.policy}`
    : "Sorry, I couldn't load the refund policy right now.";
} catch {
  answer = "Sorry, I couldn't load the refund policy right now.";
}
} else if (
  normalizedQuestion.includes("stock") ||
      normalizedQuestion.includes("available")
    ) {
      answer =
        "Here are our available products:\n" +
        products
          .map(
            (product: Record<string, string>) =>
              `${product.Product_Name}: ${product.Stock} in stock`
          )
          .join("\n");
    } else {
      answer =
        "I can help with product prices, stock, and discounts. " +
        "Try asking about the Wireless Mouse or which products are on sale.";
    }

    setChat((previous) => [
      ...previous,
      { role: "assistant", text: answer },
    ]);
    await fetch("/api/interactions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    customerName: "Guest",
    question,
    response: answer,
    refundStatus: normalizedQuestion.includes("refund")
      || normalizedQuestion.includes("return")
      ? "Pending Review"
      : "N/A",
  }),
});
  } catch (error) {
    setChat((previous) => [
      ...previous,
      {
        role: "assistant",
        text: "Sorry, I couldn't retrieve product information. Please try again.",
      },
    ]);
  }
}

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🛍️ ShopAssist AI</h1>
            <p className="mt-1 text-sm text-slate-400">
              E-commerce customer support
            </p>
          </div>
          <span className="rounded-full bg-emerald-900/50 px-3 py-1 text-sm text-emerald-300">
            ● Demo online
          </span>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-2">
        <div className="flex flex-col justify-center">
          <p className="mb-3 font-semibold text-cyan-400">
            YOUR STORE, SUPPORTED BY AI
          </p>
          <h2 className="text-4xl font-bold leading-tight md:text-5xl">
            Customer support,
            <span className="text-cyan-400"> made simpler.</span>
          </h2>
          <p className="mt-5 max-w-lg leading-7 text-slate-300">
            Get help with product details, order information, promotions, and
            refund policies in one friendly place.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <span className="text-2xl">📦</span>
              <h3 className="mt-3 font-semibold">Order Support</h3>
              <p className="mt-2 text-sm text-slate-400">
                Get help with order questions.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <span className="text-2xl">↩️</span>
              <h3 className="mt-3 font-semibold">Refund Guidance</h3>
              <p className="mt-2 text-sm text-slate-400">
                Understand the refund process.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
          <div className="border-b border-slate-700 bg-slate-800 px-5 py-4">
            <h3 className="font-bold">💬 Chat with ShopAssist</h3>
            <p className="mt-1 text-sm text-slate-400">
              Customer support assistant
            </p>
          </div>

          <div className="flex h-[380px] flex-col gap-4 overflow-y-auto p-5">
            {chat.map((item, index) => (
              <div
                key={index}
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  item.role === "user"
                    ? "self-end bg-cyan-600 text-white"
                    : "self-start bg-slate-800 text-slate-100"
                }`}
              >
                {item.text}
              </div>
            ))}
          </div>

          <form
            className="flex gap-2 border-t border-slate-700 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask about a product or order..."
              className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Send
            </button>
          </form>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-5 text-center text-sm text-slate-500">
        ShopAssist AI · E-commerce Support Agent Capstone
      </footer>
    </main>
  );
}
