const functions = require('@google-cloud/functions-framework');
const { 
  getLatestStandup, 
  getAvailabilityFields,
  saveStandupEntry,
  saveAvailabilityEntry
} = require('./firestore');
const { standupCard, availabilityCard } = require('./card');

functions.http('standyApp', async (req, res) => {
  const event = req.body;

  // Welcome message
  if (event.type === "ADDED_TO_SPACE") {
    const name = event.user?.displayName || "there";
    return res.json({
      text: `Thank you for adding me ${name}
! Type 's', 'S' or 'standup' for standup card and 'a', 'A' or 'availability' for availability card`
    });
  }

  // Handle card submissions (standup / availability)
  if (event.type === "CARD_CLICKED" && event.action) {
    // Standup
    if (event.action.actionMethodName === "submitStandup") {
      const inputs = event.common?.formInputs || {};
      const userEmail = event.user?.email || "unknown@example.com";
      const yesterday = inputs.yesterday?.stringInputs?.value?.[0] || "";
      const today = inputs.today?.stringInputs?.value?.[0] || "";
      const blockers = inputs.blockers?.stringInputs?.value?.[0] || "";
      const dateStr = new Date().toISOString().slice(0, 10);

      await saveStandupEntry(userEmail, dateStr, yesterday, today, blockers);
      return res.json({ text: "Thank you! Your standup has been submitted" });
    }

   // Availability
    if (event.action.actionMethodName === "submitAvailability") {
      const inputs = event.common?.formInputs || {};
      const userEmail = event.user?.email || "unknown@example.com";
      const fields = {
        howMuch: inputs.howMuch?.stringInputs?.value?.[0] || "",
        howLong: inputs.howLong?.stringInputs?.value?.[0] || "",
        sinceWhen: inputs.sinceWhen?.stringInputs?.value?.[0] || "",
        currentProject: inputs.currentProject?.stringInputs?.value?.[0] || "",
        remarks: inputs.remarks?.stringInputs?.value?.[0] || ""
      };

      await saveAvailabilityEntry(userEmail, fields);
      return res.json({ text: "Thank you! Your availability has been submitted" });
    }
  }

  // Respond to messages to show the correct card
  if (event.type === "MESSAGE") {
    const msg = (event.message?.argumentText || "").trim().toLowerCase();
    const userEmail = event.user?.email || "unknown@example.com";
    
    if (msg === "s" || msg === "standup") {
      const dateStr = new Date().toISOString().slice(0, 10);

      // Get last record (if it exists)
      const { doc: lastDoc, date: lastDate } = await getLatestStandup(userEmail, dateStr);
      
      if (lastDoc && lastDoc.exists) {
        const data = lastDoc.data() || {};
        // If today's record exists: prefill all fields with today's values
        if (dateStr === lastDate) {
          return res.json(standupCard(
            data.yesterday || "",
            data.today || "",
            data.blockers || ""
          ));
        } else {
          // For older records: yesterday=previous "today", blockers=previous "blockers", today=""
          return res.json(standupCard(data.today || "", "", data.blockers || ""));
        }
      }
      
      // No previous record found
      return res.json(standupCard());
    }

  if (msg === "a" || msg === "availability") {
      const [howMuch, howLong, sinceWhen, currentProject, remarks, lastUpdatedText] =
        await getAvailabilityFields(userEmail);
      return res.json(availabilityCard(howMuch, howLong, sinceWhen, currentProject, remarks, lastUpdatedText));
    }

    return res.json({
      text: "Type 's', 'S' or 'standup' for standup card and 'a', 'A' or 'availability' for availability card"
    });
  }

  // Fallback for unknown events
  res.json({
    text: "Type 's', 'S' or 'standup' for standup card and 'a', 'A' or 'availability' for availability card"
  });
});