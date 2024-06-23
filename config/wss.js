// wss.js
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const { handlePrompt } = require("./handlePrompts"); // Import the handlePrompt function

// User management for API keys and user tokens
const Account = require("../models/mongo/documents/Account");
const { authenticateAndDecode } = require("../middleware/verify");

async function verifyTokenAndAccount(token) {
  try {
    const tokenDecoded = authenticateAndDecode(token);
    if (!tokenDecoded) return null;
    return await Account.findOne({ username: tokenDecoded.username });
  } catch (error) {
    throw error;
  }
}

function buildPromptConfig(data, account) {
  return {
    account,
    uuid: data.uuid,
    session: data.session,
    provider: data.provider || "openAi",
    model: data.model || "gpt-4",
    temperature: data.temperature,
    systemPrompt: data.systemPrompt,
    userPrompt: data.userPrompt,
    messageHistory: data.messageHistory,
    knowledgeSetUuids: data.knowledgeSetUuids,
  };
}

// Create a WebSocket server
const createWebSocketServer = (server) => {
  const wss = new WebSocket.Server({ server });
  const clients = {};

  const sendToClient = (uuid, session, type, message = null) => {
    const clientWs = clients[uuid];
    if (clientWs && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ session, type, message }));
    } else {
      console.error(`No open WebSocket found for UUID: ${uuid}`);
    }
  };

  wss.on("connection", (ws) => {
    ws.uuid = uuidv4();
    clients[ws.uuid] = ws;
    ws.send(JSON.stringify({ uuid: ws.uuid }));
    console.log(`Client connected ${ws.uuid}`);

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);
        if (!data.uuid) {
          ws.send(JSON.stringify({ message: "UUID is missing from the message" }));
          return;
        }

        if (data.type === "ping") {
          sendToClient(data.uuid, data.session, "pong");
          return;
        }

        if (data.type !== "prompt") {
          sendToClient(data.uuid, data.session, "ERROR", "Unrecognized message type");
          return;
        }

        // Handle prompt message type
        let account = null;
        if (data.token) account = await verifyTokenAndAccount(data.token);

        const promptConfig = buildPromptConfig(data, account);
        await handlePrompt(promptConfig, sendToClient);
      } catch (error) {
        console.error("Failed to parse message:", error);
        ws.send(JSON.stringify({ message: "Error processing message" }));
      }
    });

    ws.on("close", () => {
      delete clients[ws.uuid];
    });
  });

  return { wss, sendToClient };
};

module.exports = { createWebSocketServer };