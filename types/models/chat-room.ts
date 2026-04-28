export interface ChatRoom {
  id: number;
  otherMember: {
    id: number;
    username: string;
  };
  lastMessage: string | null;
  lastMessageAt: string | null;
}
