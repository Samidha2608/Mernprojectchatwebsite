import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { persist } from "zustand/middleware";

export const useChatStore = create(
  persist(
    (set, get) => ({
      messages: [],
      users: [],
      selectedUser: null,
      isUsersLoading: false,
      isMessagesLoading: true,
      unreadMessages: {}, // userId -> count of unread messages

      getUsers: async () => {
        set({ isUsersLoading: true });
        try {
          const res = await axiosInstance.get("/messages/users");
          set({ users: res.data });
        } catch (error) {
          toast.error(error.response.data.message);
        } finally {
          set({ isUsersLoading: false });
        }
      },

      getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        try {
          const res = await axiosInstance.get(`/messages/${userId}`);
          set({
            messages: res?.data,
            // Clear unread messages when opening a chat
            unreadMessages: {
              ...get().unreadMessages,
              [userId]: 0
            }
          });
        } catch (error) {
          console.error(error)
          toast.error(error.response.data.message);
        } finally {
          set({ isMessagesLoading: false });
        }
      },
      
      sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        // Create an optimistic message
        const optimisticId = `temp-${Date.now()}`;
        const optimisticMessage = {
          _id: optimisticId,
          text: messageData.text,
          image: messageData.image,
          senderId: useAuthStore.getState().authUser._id,
          receiverId: selectedUser._id,
          createdAt: new Date().toISOString(),
          isOptimistic: true, // Flag to identify optimistic messages
        };

        // Add optimistic message to state
        set(state => ({
          messages: [...state.messages, optimisticMessage]
        }));
        try {
          const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
          set({ messages: [...messages, res.data] });
          
          // Replace optimistic message with server response
          set(state => ({
            messages: state.messages.map(msg =>
              msg._id === optimisticId ? { ...res.data } : msg
            )
          }));

          return res.data;
        } catch (error) {
          // Mark message as failed instead of removing it
          set(state => ({
            messages: state.messages.map(msg =>
              msg._id === optimisticId ? { ...msg, failed: true, isOptimistic: false } : msg
            )
          }));
          toast.error(error.response.data.message);
          throw error;
        }
      },

      deleteMessage: async (messageId) => {
        try {
          // Optimistically remove the message from the UI
          set(state => ({
            messages: state.messages.map(msg => 
              msg._id === messageId ? { ...msg, isDeleting: true } : msg
            )
          }));

          // Call the API to delete the message
          await axiosInstance.delete(`/messages/${messageId}`);
          
          // Remove the message from state after successful deletion
          set(state => ({
            messages: state.messages.filter(msg => msg._id !== messageId)
          }));
          
          return true;
        } catch (error) {
          // Revert the optimistic update if deletion fails
          set(state => ({
            messages: state.messages.map(msg =>
              msg._id === messageId ? { ...msg, isDeleting: false } : msg
            )
          }));
          toast.error("Failed to delete message");
          return false;
        }
      },

      subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        const socket = useAuthStore.getState().socket;

        socket.on("newMessage", (newMessage) => {
          const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id;
          if (!isMessageSentFromSelectedUser) return;

          set({
            messages: [...get().messages, newMessage],
          });
        });

        // Listen for message deletion events
        socket.on("messageDeleted", (messageId) => {
          set(state => ({
            messages: state.messages.filter(message => message._id !== messageId)
          }));
        });
      },

      // Listen for any new messages to track unread counts
      subscribeToUnreadMessages: () => {
        const socket = useAuthStore.getState().socket;
        const authUser = useAuthStore.getState().authUser;
        const { selectedUser } = get();

        if (!socket) {
          console.log("Socket not connected, cannot subscribe to unread messages");
          // Try to reconnect socket
          setTimeout(() => {
            if (authUser && !useAuthStore.getState().socket) {
              useAuthStore.getState().connectSocket();
            }
          }, 1000);
          return;
        }

        socket.off("newMessage"); // Remove existing listeners

        socket.on("newMessage", (newMessage) => {
          // Only count messages sent to the current user (receiver) and not from the currently selected chat
          if (newMessage.receiverId === authUser._id &&
            (!selectedUser || newMessage.senderId !== selectedUser._id)) {
            set(state => {
              const currentCount = state.unreadMessages[newMessage.senderId] || 0;
              return {
                unreadMessages: {
                  ...state.unreadMessages,
                  [newMessage.senderId]: currentCount + 1
                }
              };
            });
          }
        });
      },

      unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
        socket.off("messageDeleted");
      },

      setSelectedUser: (selectedUser) => {
        set(state => {
          if (selectedUser) {
            // Clear unread messages when selecting a user
            return {
              selectedUser,
              unreadMessages: {
                ...state.unreadMessages,
                [selectedUser._id]: 0
              }
            };
          } else {
            return { selectedUser: null };
          }
        })
      },

      clearUnreadMessages: (userId) => {
        set(state => ({
          unreadMessages: {
            ...state.unreadMessages,
            [userId]: 0
          }
        }));
      },
    }),
    {
      name: "chat-storage", // name for the localStorage key
      partialize: (state) => ({ unreadMessages: state.unreadMessages }), // only persist unreadMessages
    }
  )
);