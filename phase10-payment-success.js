import { supabase } from "./supabase-client.js";

const params = new URLSearchParams(window.location.search);

const bookingId = params.get("booking");

const setText = (id, value) => {

  const element = document.getElementById(id);

  if (element) {

    element.textContent = value;

  }

};

const formatMoney = (amount) =>

  new Intl.NumberFormat("en-CA", {

    style: "currency",

    currency: "CAD"

  }).format(Number(amount || 0));

const formatDate = (dateValue) => {

  if (!dateValue) return "—";

  return new Date(`${dateValue}T12:00:00`).toLocaleDateString(

    "en-CA",

    {

      year: "numeric",

      month: "long",

      day: "numeric"

    }

  );

};

async function loadReceipt() {

  try {

    if (!bookingId) {

      throw new Error("Booking ID is missing.");

    }

    const { data: booking, error: bookingError } = await supabase

      .from("booking_requests")

      .select(

        "id, status, total_amount, traveler_id, arrival, departure, listing_id"

      )

      .eq("id", bookingId)

      .single();

    if (bookingError || !booking) {

      throw new Error("Booking could not be loaded.");

    }

    const { data: listing, error: listingError } = await supabase

      .from("listings")

      .select("title, province")

      .eq("id", booking.listing_id)

      .single();

    if (listingError || !listing) {

      throw new Error("Listing could not be loaded.");

    }

    const { data: traveler } = await supabase

      .from("profiles")

      .select("full_name")

      .eq("id", booking.traveler_id)

      .single();

    const { data: taxRule } = await supabase

      .from("canada_tax_rules")

      .select(

        "federal_tax_name, federal_tax_rate, provincial_tax_name, provincial_tax_rate, local_tax_name, local_tax_rate"

      )

      .ilike(

        "province_name",

        String(listing.province || "").trim()

      )

      .single();

    const subtotal = Number(booking.total_amount || 0);

    const taxRate =

      Number(taxRule?.federal_tax_rate || 0) +

      Number(taxRule?.provincial_tax_rate || 0) +

      Number(taxRule?.local_tax_rate || 0);

    const tax = Math.round(subtotal * taxRate * 100) / 100;

    const total = subtotal + tax;

    setText("receipt-booking", booking.id);

    setText("receipt-pad", listing.title || "Nomad Park Pad");

    setText(

      "receipt-dates",

      `${formatDate(booking.arrival)} to ${formatDate(booking.departure)}`

    );

    setText(

      "receipt-traveler",

      traveler?.full_name || "Traveler"

    );

    setText("receipt-subtotal", formatMoney(subtotal));

    setText("receipt-tax", formatMoney(tax));

    setText("receipt-total", formatMoney(total));

    setText("receipt-status", "Confirmed");

    const tripLink = document.querySelector(

      'a[href="trip-details.html"]'

    );

    if (tripLink) {

      tripLink.href =

        `trip-details.html?booking=${encodeURIComponent(booking.id)}`;

    }

  } catch (error) {

    console.error("Receipt loading failed:", error);

    setText("receipt-booking", "Unable to load");

    setText("receipt-pad", "Unable to load");

    setText("receipt-dates", "Unable to load");

    setText("receipt-traveler", "Unable to load");

    setText("receipt-subtotal", "—");

    setText("receipt-tax", "—");

    setText("receipt-total", "—");

    setText("receipt-status", "Payment received");

  }

}

loadReceipt();