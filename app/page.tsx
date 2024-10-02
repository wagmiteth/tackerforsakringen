"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { streamMessage } from "@/actions/stream-message";
import { ChatMessage } from "@/types"; // Add this import
import { readStreamableValue } from "ai/rsc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';

function removeSources(content: string): string {
  return content.replace(/【[^】]*】/g, '');
}

const ChatComponent = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;
    setIsStreaming(true);

    const newMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, newMessage]);
    setInput('');

    try {
      const { output } = await streamMessage([...messages, newMessage]);
      const reader = readStreamableValue(output);

      let accumulatedContent = '';
      for await (const chunk of reader) {
        accumulatedContent += chunk;
      }
      setMessages(prev => [...prev, { role: 'assistant', content: accumulatedContent }]);
    } catch (error) {
      console.error('Error streaming message:', error);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-card rounded-lg shadow-lg overflow-hidden">
          <h1 className="text-2xl font-bold p-4 text-center border-b border-border text-black">Täcker försäkringen?</h1>

          <ScrollArea className="h-[60vh] p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  message.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <div className="mb-1 text-sm text-muted-foreground">
                  {message.role === "user" ? "You" : "Adviser"}
                </div>
                <div
                  className={`inline-block p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <ReactMarkdown>{removeSources(message.content)}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isStreaming && (
              <div className="mb-4 text-left">
                <div className="mb-1 text-sm text-muted-foreground">Adviser</div>
                <div className="inline-block p-3 rounded-lg bg-secondary text-secondary-foreground">
                  <span className="typing-animation">Typing</span>
                </div>
              </div>
            )}
          </ScrollArea>

          <form onSubmit={handleSubmit} className="p-4 border-t border-border">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                rows={1}
                className="w-full pr-12 resize-none text-black dark:text-white placeholder:text-gray-400"
                disabled={isStreaming}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-2 bottom-2"
                disabled={isStreaming}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
