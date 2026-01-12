import { createSignal, For, Show } from "solid-js";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

export default function FAQ() {
  const [openItem, setOpenItem] = createSignal<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenItem(openItem() === id ? null : id);
  };

  const faqSections: FAQSection[] = [
    {
      title: "Orders & Payment",
      items: [
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and Apple Pay. All transactions are securely processed and encrypted."
        },
        {
          question: "Can I modify or cancel my order?",
          answer: "Orders can be modified or cancelled within 1 hour of placement. After this window, our fulfillment process begins and changes may not be possible. Please contact us immediately if you need assistance."
        },
        {
          question: "Do you offer gift cards?",
          answer: "Yes, Mik Draumida gift cards are available in various denominations. Gift cards never expire and can be used on any purchase, including sale items."
        }
      ]
    },
    {
      title: "Shipping & Delivery",
      items: [
        {
          question: "Where do you ship?",
          answer: "We ship worldwide. Domestic orders (US) typically arrive within 5-7 business days. International shipping takes 10-21 business days depending on destination and customs processing."
        },
        {
          question: "How can I track my order?",
          answer: "Once your order ships, you'll receive an email with tracking information. You can also track your order by logging into your account on our website."
        },
        {
          question: "Are duties and taxes included?",
          answer: "Prices displayed do not include import duties or taxes for international orders. These fees are determined by your local customs authority and are the responsibility of the recipient."
        },
        {
          question: "Do you offer express shipping?",
          answer: "Yes, express shipping is available at checkout for an additional fee. Express domestic orders typically arrive within 2-3 business days."
        }
      ]
    },
    {
      title: "Returns & Exchanges",
      items: [
        {
          question: "What is your return policy?",
          answer: "We accept returns within 14 days of delivery for unworn items in original condition with all tags attached. Items must be returned in their original packaging. Sale items are final sale."
        },
        {
          question: "How do I initiate a return?",
          answer: "To initiate a return, please contact our customer service team with your order number. We'll provide you with a return authorization and shipping instructions."
        },
        {
          question: "How long do refunds take?",
          answer: "Once we receive your return, please allow 5-7 business days for inspection and processing. Refunds are issued to the original payment method within 3-5 business days after approval."
        },
        {
          question: "Can I exchange an item for a different size?",
          answer: "Yes, exchanges are available for different sizes subject to availability. Please contact us within 14 days of delivery to arrange an exchange."
        }
      ]
    },
    {
      title: "Products & Care",
      items: [
        {
          question: "How should I care for my Mik Draumida pieces?",
          answer: "Each garment includes specific care instructions on the label. Generally, we recommend dry cleaning for tailored pieces and gentle hand washing for knitwear. Always store items properly to maintain their shape and quality."
        },
        {
          question: "Are your products true to size?",
          answer: "Our pieces are designed with a contemporary fit. Detailed measurements are provided on each product page. If you're between sizes, we recommend sizing up for a relaxed fit or down for a more tailored silhouette."
        },
        {
          question: "What materials do you use?",
          answer: "We source only the finest materials from renowned mills worldwide—Italian wools, Japanese denims, Portuguese cottons, and premium leather. Material composition is listed on each product page."
        },
        {
          question: "Do you offer alterations?",
          answer: "While we don't offer in-house alterations, our customer service team can recommend trusted tailors in major cities. Many of our pieces are designed to be easily altered by a professional."
        }
      ]
    },
    {
      title: "Account & Privacy",
      items: [
        {
          question: "Do I need an account to place an order?",
          answer: "No, you can checkout as a guest. However, creating an account allows you to track orders, save your preferences, and enjoy a faster checkout experience."
        },
        {
          question: "How is my personal information protected?",
          answer: "We take privacy seriously. Your data is encrypted and never shared with third parties for marketing purposes. Please review our Privacy Policy for complete details."
        },
        {
          question: "How do I unsubscribe from emails?",
          answer: "You can unsubscribe from marketing emails by clicking the 'unsubscribe' link at the bottom of any email, or by updating your preferences in your account settings."
        }
      ]
    }
  ];

  return (
    <main class="legal-page">
      <div class="legal-container">
        <h1 class="legal-title">Frequently Asked Questions</h1>
        <p class="legal-intro">
          Find answers to common questions about shopping with Mik Draumida. 
          Can't find what you're looking for? Contact us at support@mikdraumida.com
        </p>

        <For each={faqSections}>
          {(section, sectionIndex) => (
            <section class="faq-section">
              <h2 class="faq-section-title">{section.title}</h2>
              <div class="faq-items">
                <For each={section.items}>
                  {(item, itemIndex) => {
                    const itemId = `${sectionIndex()}-${itemIndex()}`;
                    return (
                      <div class="faq-item">
                        <button
                          class={`faq-question ${openItem() === itemId ? "faq-question-open" : ""}`}
                          onClick={() => toggleItem(itemId)}
                        >
                          <span>{item.question}</span>
                          <svg
                            class={`faq-icon ${openItem() === itemId ? "faq-icon-open" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="1.5"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        <Show when={openItem() === itemId}>
                          <div class="faq-answer">
                            <p>{item.answer}</p>
                          </div>
                        </Show>
                      </div>
                    );
                  }}
                </For>
              </div>
            </section>
          )}
        </For>

        <section class="faq-contact">
          <h2>Still Have Questions?</h2>
          <p>
            Our customer service team is here to help. Reach out to us and we'll 
            get back to you within 24 hours.
          </p>
          <a href="mailto:support@mikdraumida.com" class="faq-contact-btn">
            Contact Support
          </a>
        </section>
      </div>
    </main>
  );
}
