const {Firestore} = require('@google-cloud/firestore');
const firestore = new Firestore();

// Find the latest previous standup record for a user
async function getLatestStandup(userEmail, todayStr) {
  // First check today's record
  const todayDoc = await firestore
    .collection("Standup")
    .doc(todayStr)
    .collection("entries")
    .doc(userEmail)
    .get();
    
  if (todayDoc.exists) {
    return { doc: todayDoc, date: todayStr };
  }

  // Search through the last 14 days
  for (let i = 1; i <= 7; i++) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - i);
    const pastDateStr = pastDate.toISOString().slice(0, 10);
    
    const pastDoc = await firestore
      .collection("Standup")
      .doc(pastDateStr)
      .collection("entries")
      .doc(userEmail)
      .get();
      
    if (pastDoc.exists) {
      return { doc: pastDoc, date: pastDateStr };
    }
  }
  
  return { doc: null, date: null };
}

async function getAvailabilityFields(userEmail) {
  const docRef = firestore.collection("Availability").doc(userEmail);
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    const data = docSnap.data() || {};
    let lastModifiedText = "";
    if (data.lastModified) {
      const dt = new Date(data.lastModified.toDate ? data.lastModified.toDate() : data.lastModified);
      // Show time in IST (Asia/Kolkata)
      const options = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      };
      lastModifiedText = `Last Updated on ${dt.toLocaleString('en-IN', options)}`;
    }
    return [
      data.howMuch || "",
      data.howLong || "",
      data.sinceWhen || "",
      data.currentProject || "",
      data.remarks || "",
      lastModifiedText
    ];
  } else {
    return ["", "", "", "", "", ""];
  }
}

// Save standup entry
async function saveStandupEntry(userEmail, dateStr, yesterday, today, blockers) {
  const docRef = firestore
    .collection("Standup")
    .doc(dateStr)
    .collection("entries")
    .doc(userEmail);

  const now = new Date();
  let created = now;
  const docSnap = await docRef.get();
  if (docSnap.exists && docSnap.data().created) {
    created = docSnap.data().created;
  }
  
  await docRef.set({
    yesterday,
    today,
    blockers,
    created,
    lastModified: now
  });
}

// Save availability entry
async function saveAvailabilityEntry(userEmail, fields) {
  const docRef = firestore.collection("Availability").doc(userEmail);
  const now = new Date();
  let created = now;
  const docSnap = await docRef.get();
  if (docSnap.exists && docSnap.data().created) {
    created = docSnap.data().created;
  }
  
  await docRef.set({
    ...fields,
    created,
    lastModified: now
  });
}

module.exports = {
  getLatestStandup,
  getAvailabilityFields,
  saveStandupEntry,
  saveAvailabilityEntry
};