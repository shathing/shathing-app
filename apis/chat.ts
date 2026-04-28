import http from './config';

import {
  type ChatMessageSliceResponse,
  type CreateChatRoomRequest,
  type GetChatRoomMessagesRequest,
} from '@/types/apis/chat';
import { type ChatRoom } from '@/types/models/chat-room';

export const chatApi = {
  createRoom: (request: CreateChatRoomRequest) => http.post<ChatRoom>('/chat/rooms', request),
  getRooms: () => http.get<ChatRoom[]>('/chat/rooms'),
  getMessages: (roomId: number, request?: GetChatRoomMessagesRequest) =>
    http.get<ChatMessageSliceResponse>(`/chat/rooms/${roomId}/messages`, { params: request }),
};
