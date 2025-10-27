// Standup Card Builder with prefilling support
function standupCard(yesterdayVal = "", todayVal = "", blockersVal = "") {
  return {
    cardsV2: [{
      cardId: "standupCard",
      card: {
        header: {
              title: "📝 Daily Standup",
              subtitle: "Share your progress and blockers"
            },
        sections: [{
          widgets: [
            {
              textInput: {
                name: "yesterday",
                label: "What did you do yesterday?",
                hintText: "E.g., Finished feature X, fixed bug Y",
                value: yesterdayVal,
                type: "MULTIPLE_LINE"
              }
            },
            {
              textInput: {
                name: "today",
                label: "What will you do today?",
                hintText: "E.g., Work on project launch",
                value: todayVal,
                type: "MULTIPLE_LINE"
              }
            },
            {
              textInput: {
                name: "blockers",
                label: "Blockers?",
                hintText: "E.g., Waiting on review",
                value: blockersVal,
                type: "MULTIPLE_LINE"
              }
            },
            {
              buttonList: {
                buttons: [{
                  text: "Submit",
                  onClick: {
                    action: {
                      function: "submitStandup",
                      loadIndicator: "SPINNER",
                      parameters: []
                    }
                  }
                }]
              }
            }
          ]
        }]
      }
    }]
  };
}

// Availability Card Builder (prefilled, with last updated at the bottom in IST)
function availabilityCard(
  howMuch = "", howLong = "", sinceWhen = "", currentProject = "", remarks = "", lastUpdatedText = ""
) {
  const widgets = [
    {
      textInput: {
        name: "howMuch",
        label: "What is your new daily availability?",
        hintText: "E.g., 50%, Half Time, Full Time",
        value: howMuch,
        type: "SINGLE_LINE"
      }
    },
    {
      textInput: {
        name: "howLong",
        label: "How long are you available?",
        hintText: "E.g., 1 month, 2 weeks",
        value: howLong,
        type: "SINGLE_LINE"
      }
    },
    {
      textInput: {
        name: "sinceWhen",
        label: "From when are you available?",
        hintText: "E.g., 28 Aug 2025, 1st week Sept, 2nd Week Oct",
        value: sinceWhen,
        type: "SINGLE_LINE"
      }
    },
    {
      textInput: {
        name: "currentProject",
        label: "What are your current client/in-house projects?",
        hintText: "Inhouse and Client both",
        value: currentProject,
        type: "SINGLE_LINE"
      }
    },
    {
      textInput: {
        name: "remarks",
        label: "Remarks",
        hintText: "Any additional notes or remarks about availability/blockers, etc.",
        value: remarks,
        type: "SINGLE_LINE"
      }
    },
    {
      buttonList: {
        buttons: [{
          text: "Submit",
          onClick: {
            action: {
              function: "submitAvailability",
              loadIndicator: "SPINNER",
              parameters: []
            }
          }
        }]
      }
    }
  ];
  if (lastUpdatedText) {
    widgets.push({
      textParagraph: {
        text: lastUpdatedText
      }
    });
  }
  return {
    cardsV2: [{
      cardId: "availabilityCard",
      card: {
        header: {
          title: "🕒 Update Your Availability",
          subtitle: "Let us know your current work capacity"
        },
        sections: [{
          widgets
        }]
      }
    }]
  };
}

module.exports = {
  standupCard,
  availabilityCard
};