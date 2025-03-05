import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import { useAuthStore } from "../store/useAuthStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";
import { useGroupStore } from "../store/useGroupStore";

const ChatContainer = ({ isGroupChat = false }) => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    sendMessage,
    deleteMessage
  } = useChatStore();
  const {
    groupMessages,
    getGroupMessages,
    isGroupMessagesLoading,
    selectedGroup,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
    joinGroupRoom,
    sendGroupMessage,
    deleteGroupMessage
  } = useGroupStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(null); // Track which message menu is open

  // Determine which state to use based on chat type
  const currentMessages = isGroupChat ? groupMessages : messages;
  const isLoading = isGroupChat ? isGroupMessagesLoading : isMessagesLoading;

  // Effect for handling direct messages
  useEffect(() => {
    if (!isGroupChat && selectedUser?._id) {
      getMessages(selectedUser._id);
      subscribeToMessages();
      return () => unsubscribeFromMessages();
    }
  }, [
    isGroupChat,
    selectedUser?._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages
  ]);

  // Separate effect for handling group messages
  useEffect(() => {
    if (isGroupChat && selectedGroup?._id) {
      getGroupMessages(selectedGroup._id);
      // Make sure to join the group room
      joinGroupRoom(selectedGroup._id);
      // Set up subscription for real-time updates
      subscribeToGroupMessages();
      return () => {
        unsubscribeFromGroupMessages();
      };
    }
  }, [
    isGroupChat,
    selectedGroup?._id,
    getGroupMessages,
    joinGroupRoom,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages
  ]);

  useEffect(() => {
    if (messageEndRef.current && currentMessages.length > 0) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentMessages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setMenuOpen(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDeleteMessage = async (messageId) => {
    if (isGroupChat) {
      await deleteGroupMessage(messageId);
    } else {
      await deleteMessage(messageId);
    }
    setMenuOpen(null);
  };

  const toggleMenu = (e, messageId) => {
    e.stopPropagation(); // Prevent triggering the document click handler
    setMenuOpen(menuOpen === messageId ? null : messageId);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader isGroupChat={isGroupChat} />
        <MessageSkeleton />
        <MessageInput isGroupChat={isGroupChat} />
      </div>
    );
  }

  const renderMessageSender = (message) => {
    if (isGroupChat && message.senderId && message.senderId._id !== authUser._id) {
      // Find the group member who sent this message
      const sender = selectedGroup.members.find(member => member._id === message.senderId._id);
      return sender?.fullName || "Unknown user";
    }
    return null;
  };

  const getSenderProfilePic = (message) => {
    if (isGroupChat) {
      const senderId = typeof message.senderId === 'object' ? message.senderId._id : message.senderId;
      const member = selectedGroup.members?.find(m => m._id === senderId);
      return member?.profilePic || "/avatar.png";
    }
    return message.senderId === authUser._id ? authUser.profilePic : selectedUser.profilePic || "/avatar.png";
  };

  const isUserSender = (message) => {
    return isGroupChat 
      ? message.senderId._id === authUser._id 
      : message.senderId === authUser._id;
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader isGroupChat={isGroupChat} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentMessages.map((message, index) => {
          const isSender = isUserSender(message);
          
          return (
            <div
              key={message._id}
              className={`chat ${isSender ? "chat-end" : "chat-start"}`}
              ref={index === currentMessages.length - 1 ? messageEndRef : null}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={getSenderProfilePic(message)}
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header flex items-center">
                {isGroupChat && message.senderId !== authUser._id && (
                  <span className="font-bold mr-1">{renderMessageSender(message)}</span>
                )}
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
                {message.isOptimistic && (
                  <span className="text-xs ml-2 italic opacity-70">Sending...</span>
                )}
                {message.failed && (
                  <span className="text-xs ml-2 italic text-red-500">Failed to send</span>
                )}
                {message.isDeleting && (
                  <span className="text-xs ml-2 italic opacity-70">Deleting...</span>
                )}
                
                {/* Only show delete option for messages sent by current user */}
                {isSender && !message.isDeleting && (
                  <div className="relative inline-block ml-2" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="text-xs p-1 rounded-full opacity-50 hover:opacity-100 hover:bg-base-200 focus:outline-none"
                      onClick={(e) => toggleMenu(e, message._id)}
                      aria-label="Message options"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                      </svg>
                    </button>
                    {menuOpen === message._id && (
                      <div className="absolute z-10 right-0 mt-1 bg-base-100 shadow-lg rounded-lg py-1 w-28 border border-base-300">
                        <button 
                          className="w-full px-4 py-2 text-left text-sm hover:bg-base-200 text-red-500 flex items-center gap-2"
                          onClick={() => handleDeleteMessage(message._id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className={`chat-bubble flex flex-col ${isSender
                ? `bg-primary text-primary-foreground ${message.isOptimistic ? 'opacity-70' : ''} ${message.isDeleting ? 'opacity-50' : ''}`
                : "bg-base-200"
                }`}
                style={{ maxWidth: '80%', wordBreak: 'break-word', overflowWrap: 'break-word' }}
              >
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
                {message.failed && (
                  <button
                    onClick={() => {
                      // Re-try sending the failed message
                      const messageData = {
                        text: message.text,
                        image: message.image
                      };
                      if (isGroupChat) {
                        sendGroupMessage(messageData);
                      } else {
                        sendMessage(messageData);
                      }
                      // Remove the failed message
                      if (isGroupChat) {
                        useGroupStore.setState(state => ({
                          groupMessages: state.groupMessages.filter(msg => msg._id !== message._id)
                        }));
                      } else {
                        useChatStore.setState(state => ({
                          messages: state.messages.filter(msg => msg._id !== message._id)
                        }));
                      }
                    }}
                    className="text-xs mt-1 underline"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput isGroupChat={isGroupChat} />
    </div>
  );
};

export default ChatContainer;