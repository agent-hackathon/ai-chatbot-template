export const runtime = 'nodejs';

import {
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { myProvider } from '@/lib/ai/models';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { getFinance } from '@/lib/ai/tools/get-finance';
import { queryDatabase } from '@/lib/ai/tools/query-database';
import getConfig from 'next/config';

const { serverRuntimeConfig } = getConfig();
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || serverRuntimeConfig.OPENAI_API_KEY;

export const maxDuration = 60;

export async function POST(request: Request) {
  //console.log('🔥 Chat API POST - Request received');
  const { id, messages, selectedChatModel } = await request.json();
  //console.log('🔥 Chat API POST - Payload:', { id, messagesCount: messages.length, selectedChatModel });

  const session = await auth();
  //console.log('🔥 Chat API POST - Session:', session ? `User ID: ${session.user?.id}` : 'No session');

  if (!session || !session.user || !session.user.id) {
    //console.log('🔥 Chat API POST - Unauthorized, rejecting');
    return new Response('Unauthorized', { status: 401 });
  }

  const userMessage = getMostRecentUserMessage(messages);
  //console.log('🔥 Chat API POST - User message:', userMessage?.content || 'None found');

  if (!userMessage) {
    //console.log('🔥 Chat API POST - No user message, rejecting');
    return new Response('No user message found', { status: 400 });
  }

  const chat = await getChatById({ id });
  //console.log('🔥 Chat API POST - Chat fetch:', chat ? `ID: ${chat.id}, User: ${chat.userId}` : 'Not found');

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage }); 
    //console.log('🔥 Chat API POST - Creating new chat with title:', title);
    await saveChat({ id, userId: session.user.id, title });
  }

  //console.log('🔥 Chat API POST - Saving user message');
  await saveMessages({
    messages: [{ ...userMessage, createdAt: new Date(), chatId: id }],
  });

  //console.log('🔥 Chat API POST - Starting stream with model:', selectedChatModel);
  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        model: myProvider.languageModel(selectedChatModel),
        system: systemPrompt({ selectedChatModel }),
        messages,
        maxSteps: 5,
        experimental_activeTools:
          selectedChatModel === 'chat-model-reasoning'
            ? []
            : ['getWeather', 'createDocument', 'updateDocument', 'requestSuggestions','getFinance', 'queryDatabase'],
        experimental_transform: smoothStream({ chunking: 'word' }),
        experimental_generateMessageId: generateUUID,
        tools: {
          getWeather,
          createDocument: createDocument({ session, dataStream }),
          updateDocument: updateDocument({ session, dataStream }),
          requestSuggestions: requestSuggestions({ session, dataStream }),
          getFinance,
          queryDatabase,
        },
        onFinish: async ({ response, reasoning }) => {
          console.log('🔥 Chat API POST - Stream finished');
          if (session.user?.id) {
            try {
              const sanitizedResponseMessages = sanitizeResponseMessages({
                messages: response.messages,
                reasoning,
              });
              console.log('🔥 Chat API POST - Saving', sanitizedResponseMessages.length, 'response messages');
              await saveMessages({
                messages: sanitizedResponseMessages.map((message) => ({
                  id: message.id,
                  chatId: id,
                  role: message.role,
                  content: message.content,
                  createdAt: new Date(),
                })),
              });
            } catch (error) {
              console.error('🔥 Chat API POST - Failed to save messages:', error);
            }
          }
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'stream-text',
        },
      });

      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true,
      });
    },
    onError: (error) => {
      console.error('🔥 Chat API POST - Stream error:', error);
      return 'Oops, an error occurred!';
    },
  });
}

export async function DELETE(request: Request) {
  console.log('🔥 Chat API DELETE - Request received');
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  console.log('🔥 Chat API DELETE - Chat ID:', id);

  if (!id) {
    console.log('🔥 Chat API DELETE - No ID, rejecting');
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();
  console.log('🔥 Chat API DELETE - Session:', session ? `User ID: ${session.user?.id}` : 'No session');

  if (!session || !session.user) {
    console.log('🔥 Chat API DELETE - Unauthorized, rejecting');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });
    console.log('🔥 Chat API DELETE - Chat fetch:', chat ? `ID: ${chat.id}, User: ${chat.userId}` : 'Not found');

    if (chat.userId !== session.user.id) {
      console.log('🔥 Chat API DELETE - User mismatch, rejecting');
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });
    console.log('🔥 Chat API DELETE - Chat deleted successfully');
    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    console.error('🔥 Chat API DELETE - Error:', error);
    return new Response('An error occurred while processing your request', { status: 500 });
  }
}