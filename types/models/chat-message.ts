export interface ChatMessage {
  id: number;
  roomId: number;
  sender: {
    id: number;
    username: string;
  };
  content: string;
  createdDate: string;
}
