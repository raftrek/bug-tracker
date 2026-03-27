
import { GoogleGenAI } from "@google/genai";
import { Issue, TeamMember } from '../types';

// Ensure the API key is available from environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey });

export async function generateIssueSummary(title: string, description: string): Promise<string> {
  const prompt = `
    You are an expert project manager. Analyze the following bug report/task and provide a concise summary and suggest the next actionable steps.
    Format your response clearly with a "Summary" section and a "Next Steps" section.

    **Title:** ${title}
    **Description:** ${description}
    ---
    **Response:**
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get summary from Gemini API.");
  }
}

export async function suggestAssignee(title: string, description: string, members: TeamMember[]): Promise<string | null> {
  if (!members || members.length === 0) return null;

  const memberList = members.map(m => `- ID: ${m.user.id}, Name: ${m.user.name}, Role: ${m.role}`).join('\n');

  const prompt = `
    You are an intelligent project management assistant. Given the following issue and a list of team members, suggest the BEST member to assign the issue to.
    Base your decision on typical roles and the context of the issue. If unsure, pick the most appropriate one.
    
    Respond ONLY with the EXACT ID of the suggested member from the list. Do not add any extra text.

    **Issue Title:** ${title}
    **Issue Description:** ${description}

    **Team Members:**
    ${memberList}
    ---
    **Response (ID only):**
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const suggestedId = response.text?.trim() || '';
    if (members.some(m => m.user.id === suggestedId)) {
        return suggestedId;
    }
    return null;
  } catch (error) {
    console.error("Error suggesting assignee:", error);
    return null; // Fail gracefully
  }
}

export async function detectDuplicates(title: string, description: string, existingIssues: Issue[]): Promise<string[]> {
  if (!existingIssues || existingIssues.length === 0) return [];

  // Limit existing issues to avoid token limits
  const recentIssues = existingIssues.slice(0, 100);
  const issuesList = recentIssues.map(i => `ID: ${i.id} | Title: ${i.title} | Description: ${i.description.substring(0, 100)}...`).join('\n');

  const prompt = `
    You are an intelligent bug tracking assistant. Compare the following NEW issue with the list of EXISTING issues to detect duplicates.
    An issue is a duplicate if it describes the same bug, feature, or task.

    **New Issue:**
    Title: ${title}
    Description: ${description}

    **Existing Issues:**
    ${issuesList}
    ---
    Return ONLY a JSON array of strings containing the IDs of existing issues that are highly likely duplicates. Do not include markdown formatting or any other text.
    Example: ["id1", "id2"]
    If there are no duplicates, return an empty array: []
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const text = response.text?.trim() || '[]';
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const duplicates = JSON.parse(cleanText);
    return Array.isArray(duplicates) ? duplicates : [];
  } catch (error) {
    console.error("Error detecting duplicates:", error);
    return [];
  }
}

export async function naturalLanguageSearch(query: string, existingIssues: Issue[]): Promise<string[]> {
  if (!existingIssues || existingIssues.length === 0) return [];

  const recentIssues = existingIssues.slice(0, 200);
  const issuesList = recentIssues.map(i => `ID: ${i.id} | Title: ${i.title} | Status: ${i.status} | Type: ${i.type}`).join('\n');

  const prompt = `
    You are an intelligent search assistant for a project management tool.
    Find all issues that match the user's natural language search query.

    **User Query:** "${query}"

    **Issues Database:**
    ${issuesList}
    ---
    Return ONLY a JSON array of strings containing the IDs of issues that match the query well. Do not include markdown formatting or any other text.
    Example: ["id1", "id2"]
    If no issues match, return an empty array: []
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const text = response.text?.trim() || '[]';
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const matches = JSON.parse(cleanText);
    return Array.isArray(matches) ? matches : [];
  } catch (error) {
    console.error("Error performing NL search:", error);
    return [];
  }
}

export async function chatWithProject(query: string, projectData: any): Promise<string> {
  const prompt = `
    You are an expert AI assistant embedded in a project management tool.
    Answer the user's question based on the provided project context.
    Keep your answer concise, helpful, and formatted nicely in markdown.

    **User Question:** ${query}

    **Project Context (JSON):**
    ${JSON.stringify(projectData).substring(0, 10000)}
    ---
    **Response:**
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Error chatting with project:", error);
    throw new Error("Failed to chat with project.");
  }
}
