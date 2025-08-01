import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { io } from "socket.io-client";

import { cn } from "../utils/cn.js";
import { fetchUserLanguage } from "../utils/api.js";
import { getTranslations } from "../utils/languageHelper.js";

import robot from "../assets/robot.png";
import notification from "../assets/positive-notification.wav";
import { formatTimestamp } from "../utils/formatTimestamp.js";
import { truncateText } from "../utils/truncateText.js";

export const ChatArea = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [maxLength, setMaxLength] = useState(20);
  const audioReceiveRef = useRef(null);

  const [language, setLanguage] = useState("en");
  const [translations, setTranslations] = useState(getTranslations("en"));

  useEffect(() => {
    const loadUserLanguage = async () => {
      try {
        const userData = await fetchUserLanguage();
        const userLanguage = userData.language || "en";
        setLanguage(userLanguage);
        setTranslations(getTranslations(userLanguage));
      } catch (error) {
        console.error("Failed to fetch user language:", error);
      }
    };

    loadUserLanguage();
  }, []);

  const {
    data: chatroomsData,
    error: chatroomsError,
    isLoading,
  } = useQuery({
    queryKey: ["chatrooms"],
    queryFn: async () => {
      const response = await fetch("/api/chatrooms/chats", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch chatrooms");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["chatrooms"], data);
    },
    onError: (error) => {
      console.error(error.message);
    },
  });

  const volume = chatroomsData?.volume || "middle";

  useEffect(() => {
    if (!audioReceiveRef.current) {
      audioReceiveRef.current = new Audio(notification);
    }
    audioReceiveRef.current.volume =
      volume === "silent" ? 0 : volume === "middle" ? 0.5 : 1;

    const initializeAudio = () => {
      window.removeEventListener("click", initializeAudio);
      window.removeEventListener("touchstart", initializeAudio);
    };

    window.addEventListener("click", initializeAudio);
    window.addEventListener("touchstart", initializeAudio);

    return () => {
      window.removeEventListener("click", initializeAudio);
      window.removeEventListener("touchstart", initializeAudio);
    };
  }, [volume]);

  window.scrollTo(0, 0);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/logout`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to logout");
      }
      return response.json();
    },
    onSuccess: () => {
      navigate("/");
    },
    onError: (error) => {
      console.error("Failed to logout", error);
    },
  });

  useEffect(() => {
    const socket = io(import.meta.env.VITE_REACT_APP_SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("message", () => {
      queryClient.invalidateQueries(["chatrooms"]);
      if (audioReceiveRef.current) {
        audioReceiveRef.current.play().catch((error) => {
          console.error("Audio playback failed:", error);
        });
      }
    });

    socket.on("message-update", () => {
      queryClient.invalidateQueries(["chatroom"]);
    });

    socket.on("message-delete", () => {
      queryClient.invalidateQueries(["chatrooms"]);
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  useEffect(() => {
    const updateMaxLength = () => {
      setMaxLength(window.innerWidth >= 1280 ? 80 : 20);
    };

    updateMaxLength();

    window.addEventListener("resize", updateMaxLength);

    return () => {
      window.removeEventListener("resize", updateMaxLength);
    };
  }, []);

  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".svg",
    ".gif",
    ".bmp",
    ".webp",
  ];

  function isImageUrl(url) {
    return (
      url.startsWith("https://res.cloudinary.com/") &&
      imageExtensions.some((extension) => url.endsWith(extension))
    );
  }

  const audioExtensions = [".webm", ".mp3", ".mp4", ".wav", ".aac"];

  function isAudioUrl(url) {
    return (
      url.startsWith("https://res.cloudinary.com/") &&
      audioExtensions.some((extension) => url.endsWith(extension))
    );
  }

  return (
    <div className="[scrollbar-width:thin] dark:bg-base-100 dark:bg-none bg-gradient-to-r from-amber-100 to-blue-300 pb-16 xl:pb-20">
      <header className="flex justify-between items-center sticky top-0 z-50 bg-gray-700 xl:p-2 xl:h-25">
        <h1 className="text-white flex items-center tracking-widest text-sm md:text-base xl:text-3xl ml-2">
          Hello, Word!
        </h1>
        <img
          className="h-12 absolute left-1/2 transform -translate-x-1/2 xl:h-16"
          src={robot}
          alt="robot"
        />
        <div className="relative">
          <div
            className="cursor-pointer flex flex-col items-center"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <div className="relative aspect-square h-8 xl:h-12 border-2 border-gray-100 bg-gray-400 rounded-full mt-2 mr-2 overflow-hidden hover:scale-120 duration-300">
              <img
                className={cn(
                  "transition-all absolute inset-0 w-full h-full object-cover transform duration-300 hover:scale-170 z-50",
                  isLoading && "opacity-0"
                )}
                src={
                  chatroomsData?.currentUsername
                    ? `https://robohash.org/${chatroomsData?.currentUsername}`
                    : robot
                }
                alt="avatar"
              />
            </div>
            <span className="mr-2 xl:text-xl text-white">
              {chatroomsData?.currentUsername}
            </span>
          </div>

          {menuOpen && (
            <ul className="border-gray-300 border-l-2 border-b-2 bg-gray-700 absolute right-0 xl:-right-2 xl:top-23 backdrop-blur-xs rounded-bl-2xl shadow-lg z-999 duration-300">
              <li
                className="hover:bg-gray-600 cursor-pointer  text-white font-extrabold duration-300  px-3 py-1 md:px-8"
                onClick={() => navigate(`/profile`)}
              >
                {translations.menu.profile}
              </li>
              <li
                className="hover:bg-gray-600 cursor-pointer text-white  font-extrabold  duration-300  px-3 py-1 md:px-8"
                onClick={() => navigate(`/settings`)}
              >
                {translations.menu.settings}
              </li>
              <li
                className="hover:bg-gray-600 cursor-pointer text-white 
                duration-300 text-xs  px-3 py-1 md:px-8 text-nowrap"
                onClick={() => navigate(`/about-us`)}
              >
                {translations.menu.aboutUs}
              </li>
              <li
                className="hover:bg-gray-600 cursor-pointer text-white 
                duration-300 text-xs  px-3 py-1 md:px-8 text-nowrap"
              >
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline tracking-widest"
                >
                  {translations.menu.privacy}
                </a>
              </li>
              <li
                className="hover:bg-gray-600 rounded-bl-2xl cursor-pointer text-red-600 font-extrabold  duration-300 px-3 py-1 md:px-8 outline-none"
                onClick={() => logoutMutation.mutate()}
              >
                {translations.menu.logout}
              </li>
            </ul>
          )}
        </div>
      </header>
      <main className="min-h-screen">
        {isLoading ? (
          <p>{translations.chatArea.loading}</p>
        ) : chatroomsError ? (
          <p>{translations.chatArea.errorLoadingChatrooms}</p>
        ) : (
          <>
            <ul>
              {chatroomsData?.chatrooms.map((chatroom) => (
                <Link
                  key={chatroom.chatId}
                  to={`/chatarea/chats/${chatroom.chatId}`}
                >
                  <li className="flex p-2 py-4 border-t-1 dark:hover:bg-gray-600 hover:bg-gray-200 duration-300">
                    <div className="relative aspect-square h-12 xl:h-20 border-2 dark:bg-gray-700 bg-gray-400 rounded-full overflow-hidden  ">
                      <img
                        className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-300 hover:scale-150"
                        src={
                          chatroom.usernames.join(", ")
                            ? `https://robohash.org/${chatroom.usernames.join(", ")}`
                            : robot
                        }
                        alt="avatar"
                      />
                    </div>
                    <div className="flex flex-col pl-4">
                      <span className="font-bold">
                        {chatroom.usernames.join(", ") ??
                          translations.chatArea.noUsername}
                      </span>
                      {chatroom.isDeletedAccount ? (
                        <span className="text-xs xl:text-xl text-red-500">
                          {translations.chatArea.deletedAccount}
                        </span>
                      ) : chatroom.lastMessage ? (
                        <>
                          {chatroom.currentUserId ===
                          chatroom.lastMessage.sender ? (
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined dark:text-gray-400 text-gray-700">
                                forward
                              </span>
                              {isImageUrl(chatroom.lastMessage.content) ? (
                                <span className="text-xs xl:text-xl text-nowrap border-2 border-amber-400 rounded-xl px-2">
                                  {translations.chatArea.sentImage}
                                </span>
                              ) : isAudioUrl(chatroom.lastMessage.content) ? (
                                <span className="text-xs xl:text-xl text-nowrap border-2 border-amber-400 rounded-xl px-2">
                                  {translations.chatArea.sentAudioMessage}
                                </span>
                              ) : (
                                <span className="text-xs xl:text-xl text-nowrap">
                                  {truncateText(
                                    chatroom.lastMessage.content,
                                    maxLength / 2
                                  )}
                                </span>
                              )}
                            </div>
                          ) : isImageUrl(chatroom.lastMessage.content) ? (
                            <span className="text-xs xl:text-xl text-nowrap border-2 border-amber-400 rounded-xl px-2">
                              {translations.chatArea.sentImage}
                            </span>
                          ) : isAudioUrl(chatroom.lastMessage.content) ? (
                            <span className="text-xs xl:text-xl text-nowrap border-2 border-amber-400 rounded-xl px-2">
                              {translations.chatArea.sentAudioMessage}
                            </span>
                          ) : (
                            <span className="text-xs xl:text-xl text-nowrap">
                              {truncateText(
                                chatroom.lastMessage.content,
                                maxLength
                              )}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs xl:text-xl text-gray-500">
                          {translations.chatArea.noMessages}
                        </span>
                      )}
                    </div>
                    <div className="ml-auto">
                      {chatroom.timestamps &&
                        chatroom.timestamps.length > 0 && (
                          <span className="flex justify-end dark:text-gray-400 text-gray-700 text-xs text-nowrap">
                            {formatTimestamp(chatroom.timestamps[0], language)}
                          </span>
                        )}
                      {chatroom.unreadMessagesCount > 0 && (
                        <div className="text-amber-400 dark:bg-transparent bg-gray-50  border-2 rounded-full px-2 flex items-center ml-auto justify-center w-7 h-7 mt-1">
                          <span className="animate-pulse text-xs dark:text-amber-400 text-gray-900">
                            {chatroom.unreadMessagesCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </li>
                </Link>
              ))}
            </ul>
            <button
              className="xl:h-20 xl:w-30 xl:bottom-4 xl:right-4 justify-center cursor-pointer fixed bottom-2 right-2 flex items-center px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              onClick={() => navigate("/chatarea/exist")}
            >
              <span
                className="material-symbols-outlined text-gray-200"
                style={{ fontSize: "36px" }}
              >
                person_add
              </span>
            </button>
          </>
        )}
      </main>
    </div>
  );
};
