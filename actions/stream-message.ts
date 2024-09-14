"use server";

import OpenAI from "openai";
import { createStreamableValue } from "ai/rsc";
import { ChatMessage } from "@/types"; // Adjust the import path if needed

const openai = new OpenAI();

export async function streamMessage(chatMessages: chatMessage[]) {
  const stream = createStreamableValue("");

  (async () => {
    const thread = await openai.beta.threads.create();

    for (const message of chatMessages) {
      await openai.beta.threads.messages.create(thread.id, {
        role: message.role === "user" ? "user" : "assistant",
        content: message.content,
      });
    }

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: "asst_bbjDVoNPnBsr1Wr2wf2shmX0",
    });

    while (true) {
      const runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      
      if (runStatus.status === "completed") {
        const messages = await openai.beta.threads.messages.list(thread.id);
        const lastMessage = messages.data[0];
        if (lastMessage.role === "assistant" && lastMessage.content[0].type === "text") {
          stream.update(lastMessage.content[0].text.value);
        }
        break;
      } else if (runStatus.status === "failed") {
        console.error("Run failed:", runStatus.last_error);
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    stream.done();
  })();

  return { output: stream.value };
}
