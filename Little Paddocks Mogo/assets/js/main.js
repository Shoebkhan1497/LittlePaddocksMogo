
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const cartButton = document.getElementById("cartButton");
const cartPanel = document.getElementById("cartPanel");
const cartBackdrop = document.getElementById("cartBackdrop");
const closeCart = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const cartStatus = document.getElementById("cartStatus");
const checkoutMock = document.getElementById("checkoutMock");
const modalBackdrop = document.getElementById("modalBackdrop");
const bookingModal = document.getElementById("bookingModal");
const closeBooking = document.getElementById("closeBooking");
const selectedEventText = document.getElementById("selectedEventText");
const bookingForm = document.getElementById("bookingForm");
const bookingStatus = document.getElementById("bookingStatus");
const paymentMock = document.getElementById("paymentMock");
const contactForm = document.getElementById("contactForm");
const contactStatus = document.getElementById("contactStatus");

const cart = JSON.parse(localStorage.getItem("lpCart") || "[]");

function saveCart() {
  localStorage.setItem("lpCart", JSON.stringify(cart));
}

function currency(value) {
  return `A$${value}`;
}

function renderCart() {
  if (!cartItems || !cartCount || !cartTotal) return;
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  cartCount.textContent = totalQty;
  cartTotal.textContent = currency(total);

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Your cart is empty. Add tea, teaware or ritual objects from the shop.</p>";
    return;
  }

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.title}">
      <div>
        <strong>${item.title}</strong><br>
        <span>${currency(item.price)} × ${item.qty}</span>
      </div>
      <button class="icon-button" type="button" aria-label="Remove ${item.title}" data-remove="${item.title}">×</button>
    </div>
  `).join("");
}

function openCart() {
  if (!cartPanel || !cartBackdrop) return;
  cartBackdrop.classList.add("open");
  cartPanel.classList.add("open");
  cartPanel.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeCartPanel() {
  if (!cartPanel || !cartBackdrop) return;
  cartBackdrop.classList.remove("open");
  cartPanel.classList.remove("open");
  cartPanel.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function addToCart(button) {
  const product = {
    title: button.dataset.title,
    price: Number(button.dataset.price),
    image: button.dataset.image
  };
  const existing = cart.find(item => item.title === product.title);
  if (existing) existing.qty += 1;
  else cart.push({ ...product, qty: 1 });
  saveCart();
  renderCart();
  if (cartStatus) cartStatus.classList.remove("show");
  openCart();
}

function removeFromCart(title) {
  const index = cart.findIndex(item => item.title === title);
  if (index >= 0) cart.splice(index, 1);
  saveCart();
  renderCart();
}

function openBooking(eventName) {
  if (!bookingModal || !modalBackdrop || !selectedEventText) return;
  selectedEventText.innerHTML = `<strong>Selected:</strong> ${eventName}`;
  if (bookingStatus) bookingStatus.classList.remove("show");
  modalBackdrop.classList.add("open");
  bookingModal.classList.add("open");
  bookingModal.focus();
  document.body.style.overflow = "hidden";
}

function closeBookingModal() {
  if (!bookingModal || !modalBackdrop) return;
  modalBackdrop.classList.remove("open");
  bookingModal.classList.remove("open");
  document.body.style.overflow = "";
}

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

document.addEventListener("click", event => {
  const addButton = event.target.closest("[data-add-product]");
  if (addButton) addToCart(addButton);

  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) removeFromCart(removeButton.dataset.remove);

  const bookButton = event.target.closest("[data-book]");
  if (bookButton) openBooking(bookButton.dataset.book);

  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) {
    const filter = filterButton.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach(btn => btn.classList.remove("active"));
    filterButton.classList.add("active");
    document.querySelectorAll("[data-event-category]").forEach(card => {
      const show = filter === "all" || card.dataset.eventCategory === filter;
      card.style.display = show ? "" : "none";
    });
  }
});

if (cartButton) cartButton.addEventListener("click", openCart);
if (closeCart) closeCart.addEventListener("click", closeCartPanel);
if (cartBackdrop) cartBackdrop.addEventListener("click", closeCartPanel);
if (checkoutMock && cartStatus) {
  checkoutMock.addEventListener("click", () => cartStatus.classList.add("show"));
}

if (closeBooking) closeBooking.addEventListener("click", closeBookingModal);
if (modalBackdrop) modalBackdrop.addEventListener("click", closeBookingModal);
async function sendBookingEmail(payload, statusElement, submitButton, successText) {
  if (!statusElement) return;

  const originalText = submitButton ? submitButton.textContent : "";

  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    statusElement.textContent = "Sending your enquiry...";
    statusElement.classList.add("show");

    const response = await fetch("/api/send-booking-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      statusElement.textContent = successText || "Thank you. Your enquiry has been sent successfully.";
      return true;
    }

    statusElement.textContent = result.message || "Sorry, your enquiry could not be sent.";
    return false;
  } catch (error) {
    statusElement.textContent = "Sorry, something went wrong. Please try again.";
    return false;
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }
}

if (bookingForm && bookingStatus) {
  bookingForm.addEventListener("submit", async event => {
    event.preventDefault();

    const submitButton = bookingForm.querySelector("button[type='submit']");
    const selectedText = selectedEventText ? selectedEventText.textContent.replace("Selected:", "").trim() : "Creative Workshop";

    const sent = await sendBookingEmail({
      formType: "Event booking enquiry",
      name: document.getElementById("bookingName")?.value,
      email: document.getElementById("bookingEmail")?.value,
      topic: selectedText,
      guests: document.getElementById("bookingGuests")?.value,
      seatingArea: document.getElementById("bookingArea")?.value,
      message: document.getElementById("bookingNotes")?.value
    }, bookingStatus, submitButton, "Thank you. Your booking enquiry has been sent successfully.");

    if (sent) bookingForm.reset();
  });
}

if (paymentMock && bookingStatus) {
  paymentMock.addEventListener("click", () => {
    bookingStatus.textContent = "Payment is not connected yet. Please send a booking enquiry first.";
    bookingStatus.classList.add("show");
  });
}

if (contactForm && contactStatus) {
  contactForm.addEventListener("submit", async event => {
    event.preventDefault();

    const submitButton = contactForm.querySelector("button[type='submit']");

    const sent = await sendBookingEmail({
      formType: "General booking enquiry",
      name: document.getElementById("contactName")?.value,
      email: document.getElementById("contactEmail")?.value,
      topic: document.getElementById("contactTopic")?.value,
      seatingArea: document.getElementById("seatingArea")?.value,
      message: document.getElementById("contactMessage")?.value
    }, contactStatus, submitButton, "Thank you. Your booking enquiry has been sent successfully.");

    if (sent) contactForm.reset();
  });
}

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeBookingModal();
    closeCartPanel();
  }
});

renderCart();
