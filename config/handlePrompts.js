const { Readable } = require("stream");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const OpenAI = require("openai");
const Anthropic = require("@anthropic-ai/sdk");
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const {Groq} = require("groq-sdk");

// User management for API keys and user tokens
const Account = require("../models/mongo/documents/Account");
const { authenticateAndDecode } = require("../middleware/verify");

async function incrementUsedCharacters(account, characters) {
  try {
    // console.log("incrementUsedCharacters", characters);
    await Account.updateOne(
      { uuid: account.uuid },
      { $inc: { charactersUsed: characters } }
    );
  } catch (error) {
    console.error("Error incrementing used characters:", error);
  }
}

async function incrementOwnUsedCharacters(account, characters) {
  try {
    // console.log("incrementOwnUsedCharacters", characters);
    await Account.updateOne(
      { uuid: account.uuid },
      { $inc: { ownCharactersUsed: characters } }
    );
  } catch (error) {
    console.error("Error incrementing own used characters:", error);
  }
}

// Establish the AI Services
const services = {
  openAi:
    process.env.OPENAI_API_KEY !== undefined &&
    process.env.OPENAI_API_KEY !== "",
  azureOpenAi:
    process.env.AZURE_OPENAI_KEY !== undefined &&
    process.env.AZURE_OPENAI_KEY !== "",
  anthropic:
    process.env.ANTHROPIC_API_KEY !== undefined &&
    process.env.ANTHROPIC_API_KEY !== "",
  mistral:
    process.env.MISTRAL_API_KEY !== undefined &&
    process.env.MISTRAL_API_KEY !== "",
  groq:
    process.env.GROQ_API_KEY !== undefined &&
    process.env.GROQ_API_KEY !== "",

};

// Clients for AI services
const openAiClient = services.openAi
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const anthropicClient = services.anthropic
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;
const azureOpenAiClient = services.azureOpenAi
  ? new OpenAIClient(
      process.env.AZURE_OPENAI_ENDPOINT,
      new AzureKeyCredential(process.env.AZURE_OPENAI_KEY)
    )
  : null;
  const groqClient = services.groq
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;


// Initialize Mistral client asynchronously
let mistralClient;
if (process.env.MISTRAL_API_KEY) {
  import('@mistralai/mistralai').then(mistralModule => {
    mistralClient = new mistralModule.default(process.env.MISTRAL_API_KEY);
  }).catch(error => {
    console.error('Failed to import MistralClient:', error);
  });
}

 

// Helper functions
const hasMatchingApiKey = (account, provider) => {
  return (
    (provider === "openAi" && account?.openAiApiKey) ||
    (provider === "anthropic" && account?.anthropicApiKey) ||
    (provider === "azureOpenAi" && account?.azureOpenAiApiKey) ||
    (provider === "mistral" && account?.mistralApiKey) 
  );
};

const hasEnoughTokens = (account, charactersNeeded) => {
  return (
    account &&
    account.charactersUsed + charactersNeeded <= account.characterReserve
  );
};

const calculateMessageLength = (data) => {
  if (data.messageHistory) {
    return data.messageHistory.reduce(
      (sum, obj) => sum + (obj.content?.length || 0),
      0
    );
  }
  return (data.userPrompt?.length || 0) + (data.systemPrompt?.length || 0);
};

const handlePrompt = async (promptConfig, sendToClient) => {
  // console.log('promptConfig', promptConfig)
  const {
    account,
    provider,
    uuid,
    session,
    model,
    messageHistory,
    userPrompt,
    systemPrompt,
    temperature,
  } = promptConfig;

  // Main logic
  try {
    // Calculate the length of the message to be used
    const messageLength = calculateMessageLength(promptConfig);
    const isAccountApiKeyMatch =
      account && hasMatchingApiKey(account, provider);
    const isTokenSufficient = hasEnoughTokens(account, messageLength);

    // If the user has a matching API key, use their API key.
    if (isAccountApiKeyMatch) {
      await incrementOwnUsedCharacters(account, messageLength);
    } else if (account && !isTokenSufficient) {
      // User is logged in but does not have a matching API key and no tokens left
      sendToClient(
        uuid,
        session,
        "ERROR",
        "You've used your entire reserve of characters. Add your own API key to continue to use this service freely."
      );
      return;
    } else if (account) {
      // User is logged in, provider doesn't match the presence of an API key, but tokens are available
      await incrementUsedCharacters(account, messageLength);
    }
    // If the user is not logged in, their token is expired, or they have no matching key, the request is still processed.
    let responseStream;
    let messages = null;
    if (messageHistory.length) messages = messageHistory;
    else
      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

    switch (provider) {
      case "openAi":
        if (!services.openAi) break;

        responseStream = await handleOpenAiPrompt(account, {
          model,
          messages: messages,
          temperature: parseFloat(temperature) || 0.5,
          stream: true,
        });
        await handlePromptResponse(
          responseStream,
          provider,
          uuid,
          session,
          sendToClient
        );
        break;
      case "anthropic":
        if (!services.anthropic) break;
        responseStream = await handleAnthropicPrompt(account, {
          model,
          messages:messages,
          temperature: parseFloat(temperature) || 0.5,
          stream: true,
        });
        await handlePromptResponse(
          responseStream,
          provider,
          uuid,
          session,
          sendToClient
        );
        break;
      case "azureOpenAi":
        if (!services.azureOpenAi) break;
        responseStream = await handleAzureOpenAiPrompt(
          account,
          model,
          messages,
          {
            temperature: parseFloat(temperature) || 0.5,
          }
        );
        const stream = Readable.from(responseStream);
        handleAzureStream(stream, uuid, session, sendToClient);
        break;

        case "mistral":
          if (!services.mistral) break;
          // console.log("mistral messages", messages)
          responseStream = await handleMistralPrompt(account, {
            model,
            messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
          });
          await handlePromptResponse(
            responseStream,
            provider,
            uuid,
            session,
            sendToClient
          );
          break;

          case "groq":
            if (!services.groq) break;
            // console.log("mistral messages", messages)
            responseStream = await handleGroqPrompt(account, {
              
              model,
              stream:true,
              messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
            });
            await handlePromptResponse(
              responseStream,
              provider,
              uuid,
              session,
              sendToClient
            );
            break;
  

      default:
        sendToClient(
          uuid,
          session,
          "ERROR",
          JSON.stringify({
            message: "Provider not supported or not activated.",
          })
        );
        break;
    }
  } catch (error) {
    sendToClient(uuid, session, "ERROR", JSON.stringify(error));
    console.error("Prompt error", error);
  }
};

const handleOpenAiPrompt = async (account, promptConfig) => {
  let client = openAiClient;
  if (account?.openAiApiKey)
    client = new OpenAI({ apiKey: account.openAiApiKey });
  const responseStream = await client.chat.completions.create(promptConfig);
  return responseStream;
};



const handleAnthropicPrompt = async (account, promptConfig) => {
  let client = anthropicClient;
  if (account?.anthropicApiKey)
    client = new Anthropic({ apiKey: account.anthropicApiKey });
  // console.log("Messages", promptConfig.messages);
  let anthropicPrompt = convertArray(promptConfig.messages);
  // console.log("anthropicPrompt", anthropicPrompt);
  anthropicPrompt.model = promptConfig.model;
  anthropicPrompt.max_tokens = 4096;
  anthropicPrompt.stream = true;
  anthropicPrompt.temperature = promptConfig.temperature || 0.5;

  // console.log("Anthropic Prompt", anthropicPrompt);
  const responseStream = await client.messages.create(anthropicPrompt);
  return responseStream;
};

const handleMistralPrompt = async (account, promptConfig) => {
  let client = mistralClient;
  if(client)
    {

  if (account?.mistralApiKey)
    client = new MistralClient({ apiKey: account.mistralApiKey });
  const chatStreamResponse = await mistralClient.chatStream(promptConfig);
  return chatStreamResponse;
}

};


const handleGroqPrompt = async (account, promptConfig) => {
  let client = groqClient;
  if (account?.groqApiKey)
    client = new Groq({ apiKey: account.groqApiKey });
  const responseStream = await client.chat.completions.create(promptConfig);
  return responseStream;
};

 
function convertArray(array) {
  let result = {
    system: null,
    messages: [],
  };

  array.forEach((item, index) => {
    if (index === 0 && item.role === "system") {
      // If the first item has role 'system', store its content separately
      result.system = item.content;
    } else {
      // For all other items, convert 'system' to 'assistant'
      let role = item.role === "system" ? "assistant" : item.role;
      // Add the message object to the messages array
      result.messages.push({ role: role, content: item.content });
    }
  });

  return result;
}

const handleAzureOpenAiPrompt = async (
  account,
  model,
  messages,
  promptConfig
) => {
  let client = azureOpenAiClient;
  if (account?.azureOpenAiApiKey && account?.azureOpenAiApiEndpoint) {
    client = new OpenAIClient(
      azure.azureOpenAiApiEndpoint,
      new AzureKeyCredential(azure.azureOpenAiApiKey)
    );
  }
  const responseStream = await client.streamChatCompletions(
    model,
    messages,
    promptConfig
  );
  return responseStream;
};

const handlePromptResponse = async (
  responseStream,
  provider,
  uuid,
  session,
  sendToClient
) => {
  for await (const part of responseStream) {
    try {
      if (provider === "openAi" && part?.choices?.[0]?.delta?.content) {
        sendToClient(uuid, session, "message", part.choices[0].delta.content);
      } else if (provider === "anthropic" && part.type != "message_stop") {
        // console.log('part', part)
        let text = part?.content_block?.text || part?.delta?.text || "";
        sendToClient(uuid, session, "message", text);
      } 
        // Add a condition for Mistral
      else if (provider === "mistral" && part.choices[0].delta.content !== undefined && !part.choices[0].finish_reason  ) {
          sendToClient(uuid, session, "message", part.choices[0].delta.content);
          }
        // Add a condition for Mistral
        else if (provider === "groq" && part?.choices?.[0]?.delta?.content   ) {
          // console.log(part.choices[0])
          sendToClient(uuid, session, "message", part.choices[0].delta.content);
          }

      else {
        sendToClient(uuid, session, "EOM", null);
      }
    } catch (error) {
      sendToClient(uuid, session, "ERROR", JSON.stringify(error));
      console.error("Could not process stream message", error);
    }
  }
};

const handleAzureStream = (stream, uuid, session, sendToClient) => {
  stream.on("data", (event) => {
    event.choices.forEach((choice) => {
      if (choice.delta?.content !== undefined) {
        sendToClient(uuid, session, "message", choice.delta.content);
      }
    });
  });

  stream.on("end", () => sendToClient(uuid, session, "EOM", null));
  stream.on("error", (error) =>
    sendToClient(
      uuid,
      session,
      "ERROR",
      JSON.stringify({ message: "Stream error.", error: error.message })
    )
  );
};

// function formatAnthropic(messageHistory) {
//   let anthropicString = "";
//   messageHistory.forEach((message, index) => {
//     const prompt =
//       message.role === "system"
//         ? index === 0
//           ? ""
//           : Anthropic.AI_PROMPT
//         : Anthropic.HUMAN_PROMPT;
//     anthropicString += prompt + message.content;
//   });
//   anthropicString += Anthropic.AI_PROMPT;
//   return anthropicString; // Return the resulting string
// }

module.exports = {
  handlePrompt,
  // Export any other functions that are needed externally
};
