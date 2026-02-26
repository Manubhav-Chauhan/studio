'use server';
/**
 * @fileOverview This file defines a Genkit flow for handling conversational follow-ups.
 * It analyzes a new user command in the context of a previous interaction to determine
 * if it's a modification, a request for clarification, or a new command, and provides
 * a resolved instruction or a clarification question.
 *
 * - handleConversationalFollowUp - A function that handles conversational follow-ups.
 * - HandleConversationalFollowUpInput - The input type for the handleConversationalFollowUp function.
 * - HandleConversationalFollowUpOutput - The return type for the handleConversationalFollowUp function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const HandleConversationalFollowUpInputSchema = z.object({
  currentCommand: z.string().describe('The latest voice command issued by the user.'),
  previousContext: z.string().optional().describe('The context of the immediately preceding interaction or command from the user or assistant. This helps in understanding follow-up requests.'),
});
export type HandleConversationalFollowUpInput = z.infer<typeof HandleConversationalFollowUpInputSchema>;

const HandleConversationalFollowUpOutputSchema = z.object({
  nextInstruction: z.string().describe('The fully resolved instruction or question for the system or user, based on the current command and previous context. If the current command modifies the previous context, this will be the modified command. If clarification is needed, this will be the question to ask the user. If it\'s a new, unrelated command, this is the command itself.'),
  isUserClarificationNeeded: z.boolean().describe('True if the `nextInstruction` is a question that needs to be asked to the user for clarification before an action can be taken.'),
});
export type HandleConversationalFollowUpOutput = z.infer<typeof HandleConversationalFollowUpOutputSchema>;

export async function handleConversationalFollowUp(
  input: HandleConversationalFollowUpInput
): Promise<HandleConversationalFollowUpOutput> {
  return handleConversationalFollowUpFlow(input);
}

const handleConversationalFollowUpPrompt = ai.definePrompt({
  name: 'handleConversationalFollowUpPrompt',
  input: { schema: HandleConversationalFollowUpInputSchema },
  output: { schema: HandleConversationalFollowUpOutputSchema },
  prompt: `You are an AI assistant designed to understand and process user commands, especially conversational follow-ups.
Your task is to analyze the 'currentCommand' in the context of the 'previousContext' (if available).

Determine if the 'currentCommand' is:
1. A modification or refinement of the 'previousContext'.
2. A request for clarification related to the 'previousContext' or an action that needs more detail.
3. A completely new and unrelated command.

Based on this analysis, provide the 'nextInstruction' and set 'isUserClarificationNeeded'.

- If the 'currentCommand' modifies the 'previousContext', generate a new, fully resolved command in 'nextInstruction'.
- If clarification is explicitly requested by the user, or if the 'previousContext' implies a need for more detail that 'currentCommand' does not provide, set 'isUserClarificationNeeded' to true and formulate a clear 'clarificationQuestion' as 'nextInstruction'.
- If it's a completely new command, 'nextInstruction' should just be the 'currentCommand'.

Examples:

Previous Context: "Set alarm for 7 AM"
Current Command: "Actually, make it 8 AM"
Output: {"nextInstruction": "Set alarm for 8 AM", "isUserClarificationNeeded": false}

Previous Context: "Open that document"
Current Command: "Which one?"
Output: {"nextInstruction": "Which document would you like to open?", "isUserClarificationNeeded": true}

Previous Context: "Turn on the lights"
Current Command: "Living room light band karo."
Output: {"nextInstruction": "Turn off the living room lights.", "isUserClarificationNeeded": false}

Previous Context: "Find my resume file"
Current Command: "Open that"
Output: {"nextInstruction": "Open my resume file", "isUserClarificationNeeded": false}

Previous Context: ""
Current Command: "Open Chrome"
Output: {"nextInstruction": "Open Chrome", "isUserClarificationNeeded": false}

Previous Context: "Play some music"
Current Command: "Which genre?"
Output: {"nextInstruction": "What genre of music would you like to play?", "isUserClarificationNeeded": true}

Previous Context: "{{{previousContext}}}"
Current Command: "{{{currentCommand}}}"
`
});

const handleConversationalFollowUpFlow = ai.defineFlow(
  {
    name: 'handleConversationalFollowUpFlow',
    inputSchema: HandleConversationalFollowUpInputSchema,
    outputSchema: HandleConversationalFollowUpOutputSchema,
  },
  async (input) => {
    const { output } = await handleConversationalFollowUpPrompt(input);
    return output!;
  }
);
