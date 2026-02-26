'use server';
/**
 * @fileOverview A Genkit flow for processing English voice commands.
 * It identifies user intent and extracts relevant entities from the command.
 *
 * - processVoiceCommandIntent - A function that handles the voice command processing.
 * - ProcessVoiceCommandIntentInput - The input type for the processVoiceCommandIntent function.
 * - ProcessVoiceCommandIntentOutput - The return type for the processVoiceCommandIntent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessVoiceCommandIntentInputSchema = z.object({
  command: z.string().describe('The transcribed English voice command.'),
});
export type ProcessVoiceCommandIntentInput = z.infer<typeof ProcessVoiceCommandIntentInputSchema>;

const IntentEnum = z.enum([
  'open_app',
  'close_app',
  'set_volume',
  'adjust_brightness',
  'toggle_wifi',
  'toggle_bluetooth',
  'search_file',
  'create_folder',
  'take_screenshot',
  'read_clipboard',
  'write_clipboard',
  'control_smart_bulb',
  'send_message',
  'schedule_meeting',
  'general_conversation',
  'unknown',
]);

const ProcessVoiceCommandIntentOutputSchema = z.object({
  intent: IntentEnum.describe('The identified intent of the voice command.'),
  entities: z.record(z.string(), z.any()).optional().describe(
    `A JSON object containing extracted key-value pairs (entities) relevant to the intent.
    - For 'open_app' or 'close_app', expected entity: { "appName": "string" }
    - For 'set_volume' or 'adjust_brightness', expected entity: { "level": "number" (0-100) }
    - For 'toggle_wifi' or 'toggle_bluetooth', expected entity: { "state": "boolean" (true for 'on', false for 'off') }
    - For 'search_file', expected entity: { "fileName": "string" }
    - For 'create_folder', expected entity: { "folderName": "string" }
    - For 'write_clipboard', expected entity: { "content": "string" }
    - For 'control_smart_bulb', expected entities: { "deviceName": "string", "state": "boolean" (true/false), "color": "string" (optional), "brightness": "number" (optional, 0-100) }
    - For 'send_message', expected entities: { "recipient": "string", "message": "string" }
    - For 'schedule_meeting', expected entities: { "time": "string", "date": "string", "subject": "string" }
    - For 'take_screenshot', 'read_clipboard', 'general_conversation', or 'unknown', entities object should be empty or omitted.`
  ),
});
export type ProcessVoiceCommandIntentOutput = z.infer<typeof ProcessVoiceCommandIntentOutputSchema>;

export async function processVoiceCommandIntent(
  input: ProcessVoiceCommandIntentInput
): Promise<ProcessVoiceCommandIntentOutput> {
  return processVoiceCommandIntentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processVoiceCommandIntentPrompt',
  input: {schema: ProcessVoiceCommandIntentInputSchema},
  output: {schema: ProcessVoiceCommandIntentOutputSchema},
  prompt: `You are an AI assistant designed to interpret English voice commands for a desktop virtual assistant.
Your task is to identify the user's intent and extract relevant entities from the given command.

Here are the possible intents and the entities you should extract for each:

-   'open_app': To open an application. Expected entities: { "appName": "string" (e.g., "Chrome", "Calculator") }
-   'close_app': To close an application. Expected entities: { "appName": "string" (e.g., "Word", "Slack") }
-   'set_volume': To set the system volume to a specific level. Expected entities: { "level": "number" (0-100, e.g., 50) }
-   'adjust_brightness': To adjust screen brightness. Expected entities: { "level": "number" (0-100, e.g., 75) }
-   'toggle_wifi': To turn Wi-Fi on or off. Expected entities: { "state": "boolean" (true for 'on', false for 'off') }
-   'toggle_bluetooth': To turn Bluetooth on or off. Expected entities: { "state": "boolean" (true for 'on', false for 'off') }
-   'search_file': To search for a file. Expected entities: { "fileName": "string" (e.g., "my resume.pdf") }
-   'create_folder': To create a new folder. Expected entities: { "folderName": "string" (e.g., "Work Documents") }
-   'take_screenshot': To capture a screenshot. No specific entities.
-   'read_clipboard': To read content from the clipboard. No specific entities.
-   'write_clipboard': To write content to the clipboard. Expected entities: { "content": "string" }
-   'control_smart_bulb': To control a smart light bulb. Expected entities: { "deviceName": "string" (e.g., "Living room light"), "state": "boolean" (true for 'on', false for 'off'), "color": "string" (optional, e.g., "red"), "brightness": "number" (optional, 0-100) }
-   'send_message': To send a message. Expected entities: { "recipient": "string" (e.g., "Rahul"), "message": "string" (e.g., "I will be late.") }
-   'schedule_meeting': To schedule a meeting. Expected entities: { "time": "string" (e.g., "5 PM"), "date": "string" (e.g., "tomorrow"), "subject": "string" (optional) }
-   'general_conversation': For general conversational queries not covered by other intents. No specific entities.
-   'unknown': If the intent cannot be clearly identified from the command. No specific entities.

Your response must be a JSON object with two top-level keys: "intent" and "entities".
The "entities" key should contain a JSON object with key-value pairs representing the extracted entities. If there are no entities for a given intent, the "entities" object should be empty or omitted.

Example 1:
Command: "Open Chrome"
Output:
{
  "intent": "open_app",
  "entities": {
    "appName": "Chrome"
  }
}

Example 2:
Command: "Set volume to 75"
Output:
{
  "intent": "set_volume",
  "entities": {
    "level": 75
  }
}

Example 3:
Command: "Turn off the living room light"
Output:
{
  "intent": "control_smart_bulb",
  "entities": {
    "deviceName": "living room light",
    "state": false
  }
}

Example 4:
Command: "What is the weather like today?"
Output:
{
  "intent": "general_conversation",
  "entities": {}
}

Example 5:
Command: "Send a message to Rahul saying I will be late"
Output:
{
  "intent": "send_message",
  "entities": {
    "recipient": "Rahul",
    "message": "I will be late"
  }
}

Example 6:
Command: "Unclear gibberish"
Output:
{
  "intent": "unknown",
  "entities": {}
}

Now, process the following command:

Command: {{{command}}}`
});

const processVoiceCommandIntentFlow = ai.defineFlow(
  {
    name: 'processVoiceCommandIntentFlow',
    inputSchema: ProcessVoiceCommandIntentInputSchema,
    outputSchema: ProcessVoiceCommandIntentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to get an output from the prompt.');
    }
    return output;
  }
);
