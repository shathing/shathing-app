import { type ChatMessage } from '@/types/models/chat-message';

export interface CreateChatRoomRequest {
  otherMemberId: number;
}

export interface GetChatRoomMessagesRequest {
  beforeMessageId?: number;
  size?: number;
}

export interface ChatMessageSliceResponse {
  items: ChatMessage[];
  nextCursorId: number | null;
  hasNext: boolean;
}
