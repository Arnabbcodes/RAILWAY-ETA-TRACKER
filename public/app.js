Vercel API -> Groq AI -> Display
// ============================================================

const form = document.getElementById("trip-form");
const submitBtn = document.getElementById("submit-btn");
const resultCard = document.getElementById("result-card");
const etaOutput = document.getElementById("eta-output");
const etaMinutesEl = document.getElementById("eta-minutes");
const aiExplanationEl = document.getElementById("ai-explanation");
const historyList = document.getElementById("history-list");
const refreshBtn = document.getElementById("refresh-history");

// ------------------------------------------------------------
// 1. FORM SUBMIT -> RUN ETA ALGORITHM -> SAVE TO SUPABASE -> CALL AI
// ------------------------------------------------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const origin = document.getElementById("origin").value.trim();
  const destination = document.getElementById("destination").value.trim();
  const distanceKm = parseFloat(document.getElementById("distance").value);
  const speedKmh = parseFloat(document.getElementById("speed").value);
  const traffic = document.getElementById("traffic").value;

  setLoading(true);

  try {
    // STEP A: run the ETA algorithm (client-side, instant)
    const { minutes, arrival, multiplier } = calculateETA({ distanceKm, speedKmh, traffic });

    // Show ETA immediately
    resultCard.hidden = false;
    etaOutput.textContent = formatTime(arrival);
    etaMinutesEl.textContent = `${minutes} minutes from now · ${traffic} traffic (×${multiplier})`;
    aiExplanationEl.textContent = "Thinking…";

    // STEP B: save the trip to Supabase
    const tripRow = await saveTripToSupabase({
      origin,
      destination,
      distance_km: distanceKm,
      speed_kmh: speedKmh,
      traffic,
      eta_minutes: minutes,
    });

    // STEP C: call the Vercel serverless API -> which calls Groq AI
    const explanation = await fetchAIExplanation({
      origin,
      destination,
      distanceKm,
      speedKmh,
      traffic,
      etaMinutes: minutes,
    });

    aiExplanationEl.textContent = explanation;

    // STEP D: update Supabase row with the AI explanation (optional persistence)
    if (tripRow?.id) {
      await updateTripExplanation(tripRow.id, explanation);
    }

    // STEP E: refresh the history list
    await loadHistory();

  } catch (err) {
    console.error(err);
    showError(err.message || "Something went wrong.");
    aiExplanationEl.textContent = "Could not generate explanation.";
  } finally {
    setLoading(false);
  }
});

// ------------------------------------------------------------
// 2. SUPABASE — save a new trip row
// ------------------------------------------------------------
async function saveTripToSupabase(trip) {
  const { data, error } = await supabaseClient
    .from("trips")
    .insert([trip])
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    throw new Error("Failed to save trip to Supabase.");
  }
  return data;
}

// ------------------------------------------------------------
// 3. SUPABASE — update a trip row with the AI explanation
// ------------------------------------------------------------
async function updateTripExplanation(tripId, explanation) {
  const { error } = await supabaseClient
    .from("trips")
    .update({ ai_explanation: explanation })
    .eq("id", tripId);

  if (error) {
    console.warn("Supabase update warning:", error.message);
  }
}

// ------------------------------------------------------------
// 4. SUPABASE — load trip history
// ------------------------------------------------------------
async function loadHistory() {
  const { data, error } = await supabaseClient
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Supabase select error:", error);
    historyList.innerHTML = `<li class="history-list__empty">Could not load history.</li>`;
    return;
  }

  if (!data || data.length === 0) {
    historyList.innerHTML = `<li class="history-list__empty">No trips yet.</li>`;
    return;
  }

  historyList.innerHTML = data
    .map(
      (t) => `
      <li>
        <span>${escapeHtml(t.origin)} → ${escapeHtml(t.destination)}</span>
        <span>${t.eta_minutes} min · ${escapeHtml(t.traffic)}</span>
      </li>`
    )
    .join("");
}

refreshBtn.addEventListener("click", loadHistory);

// ------------------------------------------------------------
// 5. VERCEL API -> GROQ AI — fetch a natural-language explanation
// ------------------------------------------------------------
async function fetchAIExplanation({ origin, destination, distanceKm, speedKmh, traffic, etaMinutes }) {
  const response = await fetch(`${API_BASE_URL}/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      origin,
      destination,
      distanceKm,
      speedKmh,
      traffic,
      etaMinutes,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI explanation request failed: ${text}`);
  }

  const data = await response.json();
  return data.explanation;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? "Calculating…" : "Calculate ETA";
}

function showError(message) {
  clearError();
  const el = document.createElement("p");
  el.className = "error-text";
  el.id = "form-error";
  el.textContent = message;
  form.appendChild(el);
}

function clearError() {
  document.getElementById("form-error")?.remove();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Load history as soon as the page opens
loadHistory();
