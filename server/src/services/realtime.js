export function getRealtimeContract() {
  return {
    provider: "firebase-firestore",
    collections: {
      conversations: "conversations/{conversationId}",
      messages: "conversations/{conversationId}/messages/{messageId}",
      presence: "presence/{userId}",
      typing: "conversations/{conversationId}/typing/{userId}"
    },
    localDemo: "REST endpoints mirror this contract until Firebase credentials are configured."
  };
}
