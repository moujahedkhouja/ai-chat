export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string; // ISO string from server
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;  // ISO string
  updatedAt: string;  // ISO string
  messages: Message[];
}
